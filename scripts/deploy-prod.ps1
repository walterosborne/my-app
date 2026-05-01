param(
    [string] $AppRoot
)

$ErrorActionPreference = 'Stop'

$StartedAt = Get-Date

function Resolve-NgatAppRoot {
    param(
        [string] $RequestedRoot
    )

    $candidates = @(
        $RequestedRoot,
        (Get-Location).Path,
        $(if ($PSScriptRoot) { Join-Path $PSScriptRoot '..' } else { $null })
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    foreach ($candidate in $candidates) {
        try {
            $resolved = (Resolve-Path -LiteralPath $candidate -ErrorAction Stop).Path
            if (Test-Path -LiteralPath (Join-Path $resolved 'package.json')) {
                return $resolved
            }
        }
        catch {
            # Try the next candidate.
        }
    }

    throw "Could not find app root. Checked: $($candidates -join ', ')"
}

$AppRoot = Resolve-NgatAppRoot -RequestedRoot $AppRoot
$DebugLog = Join-Path $AppRoot 'ngat-prod-debug.log'

function Write-NgatDeployLog {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    $elapsedMs = [int]((Get-Date) - $StartedAt).TotalMilliseconds
    $line = "[NGAT DEPLOY DEBUG $((Get-Date).ToString('o')) pid=$PID elapsedMs=$elapsedMs] $Message"
    Write-Host $line
    Add-Content -Path $DebugLog -Value $line
}

function Invoke-NpmStep {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    Write-NgatDeployLog "STEP START: $Name"
    Write-NgatDeployLog "COMMAND: npm $($Arguments -join ' ')"

    & npm @Arguments
    $exitCode = $LASTEXITCODE

    Write-NgatDeployLog "STEP END: $Name exitCode=$exitCode"

    if ($exitCode -ne 0) {
        throw "$Name failed with exit code $exitCode"
    }
}

function Prepare-IisDistRoot {
    $sourceWebConfig = Join-Path $AppRoot 'web.config'
    $distRoot = Join-Path $AppRoot 'dist'
    $targetWebConfig = Join-Path $distRoot 'web.config'

    Write-NgatDeployLog "STEP START: prepare IIS dist root"
    Write-NgatDeployLog "sourceWebConfig=$sourceWebConfig"
    Write-NgatDeployLog "distRoot=$distRoot"

    if (!(Test-Path -LiteralPath $sourceWebConfig)) {
        throw "Could not find web.config at $sourceWebConfig"
    }

    if (!(Test-Path -LiteralPath $distRoot)) {
        throw "Could not find built dist folder at $distRoot"
    }

    Copy-Item -LiteralPath $sourceWebConfig -Destination $targetWebConfig -Force

    Write-NgatDeployLog "STEP END: prepare IIS dist root targetWebConfig=$targetWebConfig"
}

function Publish-IisDistToAppRoot {
    $distRoot = Join-Path $AppRoot 'dist'

    Write-NgatDeployLog "STEP START: publish dist to IIS root"
    Write-NgatDeployLog "distRoot=$distRoot"
    Write-NgatDeployLog "appRoot=$AppRoot"

    if (!(Test-Path -LiteralPath $distRoot)) {
        throw "Could not find built dist folder at $distRoot"
    }

    $distItems = @(Get-ChildItem -LiteralPath $distRoot -Force)
    if ($distItems.Count -eq 0) {
        throw "Built dist folder is empty at $distRoot"
    }

    foreach ($item in $distItems) {
        $targetPath = Join-Path $AppRoot $item.Name

        if (Test-Path -LiteralPath $targetPath) {
            Remove-Item -LiteralPath $targetPath -Recurse -Force
            Write-NgatDeployLog "Removed existing IIS root item $targetPath"
        }

        Copy-Item -LiteralPath $item.FullName -Destination $targetPath -Recurse -Force
        Write-NgatDeployLog "Copied dist item $($item.FullName) to $targetPath"
    }

    Write-NgatDeployLog "STEP END: publish dist to IIS root items=$($distItems.Count)"
}

function ConvertTo-NgatPsSingleQuotedLiteral {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Value
    )

    return "'$($Value.Replace("'", "''"))'"
}

function Get-NgatNodePath {
    foreach ($candidate in @('node.exe', 'node')) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command -and $command.Source) {
            return $command.Source
        }
    }

    throw 'Could not find node.exe on PATH.'
}

function Get-NgatBackendProcessIds {
    try {
        $processIds = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop |
            Where-Object { $_.CommandLine -like '*mssqlserver.js*' } |
            ForEach-Object { [int]$_.ProcessId } |
            Sort-Object -Unique)

        return $processIds
    }
    catch {
        Write-NgatDeployLog "Backend process lookup failed: $($_.Exception.Message)"
        return @()
    }
}

function Get-NgatListeningProcessIds {
    param(
        [int] $Port = 3001
    )

    try {
        $lines = @(cmd /c "netstat -ano | findstr :$Port" 2>$null)
        $processIds = @()

        foreach ($line in $lines) {
            if ($line -match '\sLISTENING\s+(\d+)\s*$') {
                $processIds += [int]$Matches[1]
            }
        }

        return @($processIds | Sort-Object -Unique)
    }
    catch {
        Write-NgatDeployLog ('Port lookup on {0} failed: {1}' -f $Port, $_.Exception.Message)
        return @()
    }
}

function Write-NgatFileTail {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Label,

        [Parameter(Mandatory = $true)]
        [string] $Path,

        [int] $TailLines = 40
    )

    if (!(Test-Path -LiteralPath $Path)) {
        Write-NgatDeployLog ('{0} does not exist: {1}' -f $Label, $Path)
        return
    }

    $tail = @(Get-Content -LiteralPath $Path -Tail $TailLines -ErrorAction SilentlyContinue)
    if ($tail.Count -eq 0) {
        Write-NgatDeployLog ('{0} tail from {1}: <empty>' -f $Label, $Path)
        return
    }

    Write-NgatDeployLog ('{0} tail from {1}:{2}{3}' -f $Label, $Path, [Environment]::NewLine, ($tail -join [Environment]::NewLine))
}

function Stop-NgatMssqlBackend {
    $pidFile = Join-Path $AppRoot '.mssqlserver.pid'
    $taskScript = Join-Path $AppRoot '.mssqlserver-task.ps1'
    $launchScript = Join-Path $AppRoot '.mssqlserver-launch.ps1'
    $taskName = 'NGAT_MSSQL_Backend'

    Write-NgatDeployLog 'STEP START: stop MSSQL backend via PowerShell'

    try {
        & schtasks.exe /End /TN $taskName *> $null
        Write-NgatDeployLog "Ended scheduled task $taskName if it was running."
    }
    catch {
        Write-NgatDeployLog "schtasks /End skipped: $($_.Exception.Message)"
    }

    try {
        & schtasks.exe /Delete /TN $taskName /F *> $null
        Write-NgatDeployLog "Deleted scheduled task $taskName if it existed."
    }
    catch {
        Write-NgatDeployLog "schtasks /Delete skipped: $($_.Exception.Message)"
    }

    $pids = New-Object System.Collections.Generic.HashSet[int]
    foreach ($pid in @(Get-NgatBackendProcessIds) + @(Get-NgatListeningProcessIds -Port 3001)) {
        if ($pid -gt 0) {
            [void]$pids.Add([int]$pid)
        }
    }

    foreach ($pid in $pids) {
        try {
            & taskkill.exe /PID $pid /T /F *> $null
            Write-NgatDeployLog "Stopped existing backend-related PID $pid."
        }
        catch {
            Write-NgatDeployLog ('taskkill skipped for PID {0}: {1}' -f $pid, $_.Exception.Message)
        }
    }

    foreach ($path in @($pidFile, $taskScript, $launchScript)) {
        if (Test-Path -LiteralPath $path) {
            Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
            Write-NgatDeployLog "Removed stale launcher artifact $path"
        }
    }

    Write-NgatDeployLog 'STEP END: stop MSSQL backend via PowerShell'
}

function Start-NgatMssqlBackend {
    $nodePath = Get-NgatNodePath
    $serverPath = Join-Path $AppRoot 'mssqlserver.js'
    $stdoutLog = Join-Path $AppRoot 'mssqlserver.log'
    $stderrLog = Join-Path $AppRoot 'mssqlserver.error.log'
    $pidFile = Join-Path $AppRoot '.mssqlserver.pid'
    $launchScript = Join-Path $AppRoot '.mssqlserver-launch.ps1'
    $runId = "$(Get-Date -Format 'yyyyMMddTHHmmssfff')-$PID"

    Write-NgatDeployLog 'STEP START: start MSSQL backend via PowerShell'
    Write-NgatDeployLog "Backend nodePath=$nodePath"
    Write-NgatDeployLog "Backend serverPath=$serverPath"

    if (!(Test-Path -LiteralPath $serverPath)) {
        throw "Could not find mssqlserver.js at $serverPath"
    }

    Set-Content -LiteralPath $stdoutLog -Value "[NGAT DEPLOY START RUN $runId] stdout log reset $(Get-Date -Format o)" -Encoding UTF8
    Set-Content -LiteralPath $stderrLog -Value "[NGAT DEPLOY START RUN $runId] stderr log reset $(Get-Date -Format o)" -Encoding UTF8

    $quotedAppRoot = ConvertTo-NgatPsSingleQuotedLiteral -Value $AppRoot
    $quotedNodePath = ConvertTo-NgatPsSingleQuotedLiteral -Value $nodePath
    $quotedServerPath = ConvertTo-NgatPsSingleQuotedLiteral -Value $serverPath
    $quotedStdoutLog = ConvertTo-NgatPsSingleQuotedLiteral -Value $stdoutLog
    $quotedStderrLog = ConvertTo-NgatPsSingleQuotedLiteral -Value $stderrLog
    $quotedRunId = ConvertTo-NgatPsSingleQuotedLiteral -Value $runId

    $launchScriptContents = @"
`$ErrorActionPreference = 'Stop'
`$env:VSTS_PROCESS_LOOKUP_ID = `$null
Set-Location -LiteralPath $quotedAppRoot
`$nodePath = $quotedNodePath
`$serverPath = $quotedServerPath
`$stdoutLog = $quotedStdoutLog
`$stderrLog = $quotedStderrLog
`$runId = $quotedRunId
"[{0}] Launching mssqlserver.js from deploy-prod.ps1. runId={1}" -f (Get-Date -Format o), `$runId | Out-File -FilePath `$stdoutLog -Append -Encoding utf8
Start-Process -FilePath `$nodePath -ArgumentList @(`$serverPath) -WorkingDirectory $quotedAppRoot -RedirectStandardOutput `$stdoutLog -RedirectStandardError `$stderrLog -WindowStyle Hidden | Out-Null
"[{0}] Start-Process returned for runId={1}" -f (Get-Date -Format o), `$runId | Out-File -FilePath `$stdoutLog -Append -Encoding utf8
"@

    Set-Content -LiteralPath $launchScript -Value $launchScriptContents -Encoding UTF8
    Write-NgatDeployLog "Launcher script written to $launchScript"

    $wrapperPsi = New-Object System.Diagnostics.ProcessStartInfo
    $wrapperPsi.FileName = (Get-Command powershell.exe -ErrorAction Stop).Source
    $wrapperPsi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launchScript`""
    $wrapperPsi.WorkingDirectory = $AppRoot
    $wrapperPsi.UseShellExecute = $false
    $wrapperPsi.CreateNoWindow = $true
    $wrapperPsi.RedirectStandardOutput = $true
    $wrapperPsi.RedirectStandardError = $true
    [void]$wrapperPsi.EnvironmentVariables.Remove('VSTS_PROCESS_LOOKUP_ID')

    $wrapperProcess = New-Object System.Diagnostics.Process
    $wrapperProcess.StartInfo = $wrapperPsi
    [void]$wrapperProcess.Start()

    if (-not $wrapperProcess.WaitForExit(15000)) {
        try {
            $wrapperProcess.Kill()
        }
        catch {
            # Ignore secondary cleanup failures.
        }

        throw 'The backend launcher wrapper did not exit within 15 seconds.'
    }

    $wrapperStdOut = $wrapperProcess.StandardOutput.ReadToEnd().Trim()
    $wrapperStdErr = $wrapperProcess.StandardError.ReadToEnd().Trim()
    Write-NgatDeployLog "Launcher wrapper exitCode=$($wrapperProcess.ExitCode)"

    if ($wrapperStdOut) {
        Write-NgatDeployLog "Launcher wrapper stdout:`n$wrapperStdOut"
    }

    if ($wrapperStdErr) {
        Write-NgatDeployLog "Launcher wrapper stderr:`n$wrapperStdErr"
    }

    if ($wrapperProcess.ExitCode -ne 0) {
        Write-NgatFileTail -Label 'mssqlserver stdout log' -Path $stdoutLog
        Write-NgatFileTail -Label 'mssqlserver stderr log' -Path $stderrLog
        throw "The backend launcher wrapper failed with exit code $($wrapperProcess.ExitCode)."
    }

    $deadline = (Get-Date).AddSeconds(30)
    do {
        $backendProcessIds = @(Get-NgatBackendProcessIds)
        $listeningProcessIds = @(Get-NgatListeningProcessIds -Port 3001)
        $matchedPid = @($backendProcessIds | Where-Object { $listeningProcessIds -contains $_ } | Select-Object -First 1)
        $stdoutContents = if (Test-Path -LiteralPath $stdoutLog) { Get-Content -LiteralPath $stdoutLog -Raw -ErrorAction SilentlyContinue } else { '' }

        if ($matchedPid.Count -gt 0) {
            Set-Content -LiteralPath $pidFile -Value "$($matchedPid[0])" -Encoding ASCII
            Write-NgatDeployLog "STEP END: start MSSQL backend via PowerShell pid=$($matchedPid[0])"
            Write-Host "Started mssqlserver.js in background (PID $($matchedPid[0]))."
            Write-Host "Stdout log: $stdoutLog"
            Write-Host "Stderr log: $stderrLog"
            return
        }

        if ($stdoutContents -match '\[NGAT MSSQL READY\]\s+host=\S+\s+port=3001\b' -or $stdoutContents -match 'Server running on http://[^\s]+:3001\b') {
            $resolvedPid = @($backendProcessIds | Select-Object -First 1)
            $reportedPid = if ($resolvedPid.Count -gt 0) { $resolvedPid[0] } else { 'unavailable' }
            if ($resolvedPid.Count -gt 0) {
                Set-Content -LiteralPath $pidFile -Value "$($resolvedPid[0])" -Encoding ASCII
            }

            Write-NgatDeployLog "STEP END: start MSSQL backend via PowerShell pid=$reportedPid verifiedByLog=true"
            Write-Host "Started mssqlserver.js in background (PID $reportedPid)."
            Write-Host "Stdout log: $stdoutLog"
            Write-Host "Stderr log: $stderrLog"
            return
        }

        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)

    Write-NgatFileTail -Label 'mssqlserver stdout log' -Path $stdoutLog
    Write-NgatFileTail -Label 'mssqlserver stderr log' -Path $stderrLog
    throw 'Failed to confirm that mssqlserver.js started within 30 seconds.'
}

try {
    Set-Location -LiteralPath $AppRoot

    Add-Content -Path $DebugLog -Value ""
    Add-Content -Path $DebugLog -Value "===== deploy-prod.ps1 started $((Get-Date).ToString('o')) ====="

    Write-NgatDeployLog "deploy-prod.ps1 entered."
    Write-NgatDeployLog "AppRoot=$AppRoot"
    Write-NgatDeployLog "PowerShell=$($PSVersionTable.PSVersion)"
    Write-NgatDeployLog "VSTS_PROCESS_LOOKUP_ID present=$([bool]$env:VSTS_PROCESS_LOOKUP_ID)"

    Invoke-NpmStep -Name 'clean dist' -Arguments @('run', 'clean')
    Invoke-NpmStep -Name 'vite production build' -Arguments @('run', 'build')
    Prepare-IisDistRoot
    Publish-IisDistToAppRoot
    Stop-NgatMssqlBackend
    Start-NgatMssqlBackend

    Write-NgatDeployLog 'deploy-prod.ps1 completed successfully.'
    exit 0
}
catch {
    Write-NgatDeployLog "FATAL: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace
    exit 1
}
