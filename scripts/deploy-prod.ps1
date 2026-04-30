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
    Invoke-NpmStep -Name 'start MSSQL backend' -Arguments @('run', 'start:mssqlserver:bg')

    Write-NgatDeployLog 'deploy-prod.ps1 completed successfully.'
    exit 0
}
catch {
    Write-NgatDeployLog "FATAL: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace
    exit 1
}
