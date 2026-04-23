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
    Invoke-NpmStep -Name 'start MSSQL backend' -Arguments @('run', 'start:mssqlserver:bg')

    Write-NgatDeployLog 'deploy-prod.ps1 completed successfully.'
    exit 0
}
catch {
    Write-NgatDeployLog "FATAL: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace
    exit 1
}
