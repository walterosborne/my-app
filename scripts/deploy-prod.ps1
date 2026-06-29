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

function Write-NgatScheduledTaskState {
    param(
        [Parameter(Mandatory = $true)]
        [string] $TaskName
    )

    try {
        $output = & schtasks.exe /Query /TN $TaskName /V /FO LIST 2>&1
        $exitCode = $LASTEXITCODE
        Write-NgatDeployLog "schtasks /Query exitCode=$exitCode"
        if ($output) {
            Write-NgatDeployLog ('schtasks /Query output:{0}{1}' -f [Environment]::NewLine, ($output -join [Environment]::NewLine))
        }
    }
    catch {
        Write-NgatDeployLog "schtasks /Query threw: $($_.Exception.Message)"
    }
}

function Invoke-NgatBackendProbe {
    param(
        [Parameter(Mandatory = $true)]
        [string] $AppRoot
    )

    $stdoutLog = Join-Path $AppRoot 'mssqlserver.log'
    $stderrLog = Join-Path $AppRoot 'mssqlserver.error.log'
    $probeUrls = @(
        'http://127.0.0.1:3001/api/testheaders?format=json',
        'http://127.0.0.1:3001/api/healthz'
    )

    Write-NgatDeployLog 'STEP START: backend probe'

    $backendProcessIds = @(Get-NgatBackendProcessIds)
    $listeningProcessIds = @(Get-NgatListeningProcessIds -Port 3001)
    Write-NgatDeployLog "Backend process ids after launch: $($(if ($backendProcessIds.Count -gt 0) { $backendProcessIds -join ', ' } else { 'none' }))"
    Write-NgatDeployLog "Listening process ids on port 3001: $($(if ($listeningProcessIds.Count -gt 0) { $listeningProcessIds -join ', ' } else { 'none' }))"

    foreach ($probeUrl in $probeUrls) {
        try {
            $response = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 5
            $body = if ($null -ne $response.Content) { [string]$response.Content } else { '' }
            $snippet = if ($body.Length -gt 800) { $body.Substring(0, 800) + '...' } else { $body }
            Write-NgatDeployLog ('Backend probe success url={0} status={1} bodySnippet={2}' -f $probeUrl, [int]$response.StatusCode, $snippet)
        }
        catch {
            $statusCode = $null
            $bodySnippet = ''

            if ($_.Exception.Response) {
                try {
                    $statusCode = [int]$_.Exception.Response.StatusCode
                }
                catch {
                    $statusCode = $null
                }

                try {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $bodyText = $reader.ReadToEnd()
                    $reader.Dispose()
                    $bodySnippet = if ($bodyText.Length -gt 800) { $bodyText.Substring(0, 800) + '...' } else { $bodyText }
                }
                catch {
                    $bodySnippet = ''
                }
            }

            Write-NgatDeployLog ('Backend probe failure url={0} status={1} message={2} bodySnippet={3}' -f $probeUrl, $(if ($null -ne $statusCode) { $statusCode } else { 'n/a' }), $_.Exception.Message, $bodySnippet)
        }
    }

    Write-NgatFileTail -Label 'mssqlserver stdout log' -Path $stdoutLog -TailLines 25
    Write-NgatFileTail -Label 'mssqlserver stderr log' -Path $stderrLog -TailLines 25
    Write-NgatDeployLog 'STEP END: backend probe'
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
    foreach ($backendProcessId in @(Get-NgatBackendProcessIds) + @(Get-NgatListeningProcessIds -Port 3001)) {
        if ($backendProcessId -gt 0) {
            [void]$pids.Add([int]$backendProcessId)
        }
    }

    foreach ($backendProcessId in $pids) {
        try {
            & taskkill.exe /PID $backendProcessId /T /F *> $null
            Write-NgatDeployLog "Stopped existing backend-related PID $backendProcessId."
        }
        catch {
            Write-NgatDeployLog ('taskkill skipped for PID {0}: {1}' -f $backendProcessId, $_.Exception.Message)
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
    $powershellPath = (Get-Command powershell.exe -ErrorAction Stop).Source
    $serverPath = Join-Path $AppRoot 'mssqlserver.js'
    $stdoutLog = Join-Path $AppRoot 'mssqlserver.log'
    $stderrLog = Join-Path $AppRoot 'mssqlserver.error.log'
    $pidFile = Join-Path $AppRoot '.mssqlserver.pid'
    $launchScript = Join-Path $AppRoot '.mssqlserver-launch.ps1'
    $runId = "$(Get-Date -Format 'yyyyMMddTHHmmssfff')-$PID"
    $taskName = 'NGAT_MSSQL_Backend'

    Write-NgatDeployLog 'STEP START: start MSSQL backend via PowerShell'
    Write-NgatDeployLog "Backend nodePath=$nodePath"
    Write-NgatDeployLog "Backend powershellPath=$powershellPath"
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
& `$nodePath `$serverPath >> `$stdoutLog 2>> `$stderrLog
`$exitCode = `$LASTEXITCODE
"[{0}] mssqlserver.js exited with code {1}. runId={2}" -f (Get-Date -Format o), `$exitCode, `$runId | Out-File -FilePath `$stdoutLog -Append -Encoding utf8
exit `$exitCode
"@

    Set-Content -LiteralPath $launchScript -Value $launchScriptContents -Encoding UTF8
    Write-NgatDeployLog "Launcher script written to $launchScript"

    $taskCommand = "`"$powershellPath`" -NoProfile -ExecutionPolicy Bypass -File `"$launchScript`""
    Write-NgatDeployLog "Scheduled task command=$taskCommand"

    $createOutput = & schtasks.exe /Create /TN $taskName /TR $taskCommand /SC ONSTART /RU SYSTEM /RL HIGHEST /F 2>&1
    $createExitCode = $LASTEXITCODE
    Write-NgatDeployLog "schtasks /Create exitCode=$createExitCode"
    if ($createOutput) {
        Write-NgatDeployLog ('schtasks /Create output:{0}{1}' -f [Environment]::NewLine, ($createOutput -join [Environment]::NewLine))
    }
    if ($createExitCode -ne 0) {
        throw "schtasks /Create failed with exit code $createExitCode."
    }

    $runOutput = & schtasks.exe /Run /TN $taskName 2>&1
    $runExitCode = $LASTEXITCODE
    Write-NgatDeployLog "schtasks /Run exitCode=$runExitCode"
    if ($runOutput) {
        Write-NgatDeployLog ('schtasks /Run output:{0}{1}' -f [Environment]::NewLine, ($runOutput -join [Environment]::NewLine))
    }
    if ($runExitCode -ne 0) {
        Write-NgatScheduledTaskState -TaskName $taskName
        throw "schtasks /Run failed with exit code $runExitCode."
    }

    Start-Sleep -Seconds 2

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

    Write-NgatDeployLog 'Backend launch was triggered, but readiness was not confirmed within the brief post-launch check. Continuing without failing deploy.'
    Write-NgatScheduledTaskState -TaskName $taskName
    Write-NgatFileTail -Label 'mssqlserver stdout log' -Path $stdoutLog
    Write-NgatFileTail -Label 'mssqlserver stderr log' -Path $stderrLog
    Write-NgatDeployLog 'STEP END: start MSSQL backend via PowerShell launchedWithoutConfirmation=true'
    Write-Host 'Triggered mssqlserver.js startup without blocking on readiness confirmation.'
    Write-Host "Stdout log: $stdoutLog"
    Write-Host "Stderr log: $stderrLog"
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
    Invoke-NgatBackendProbe -AppRoot $AppRoot

    Write-NgatDeployLog 'deploy-prod.ps1 completed successfully.'
    exit 0
}
catch {
    Write-NgatDeployLog "FATAL: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace
    exit 1
}
