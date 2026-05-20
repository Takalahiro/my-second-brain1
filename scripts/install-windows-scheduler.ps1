#requires -Version 5.1
<#
.SYNOPSIS
  Register / unregister a Windows scheduled task that runs auto-sync-vault.mjs
  once per hour.

.DESCRIPTION
  Creates a task named "MySecondBrain-VaultAutoSync":
    - Trigger: 5 minutes after logon, then repeats every 1 hour
    - Action: node scripts/auto-sync-vault.mjs
    - Runs hidden (no console window)
    - Missed runs catch up after boot
    - Output logged to logs/auto-sync.log

  Runs as the current user, no admin needed.

.PARAMETER Uninstall
  Remove the task instead of installing.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/install-windows-scheduler.ps1
  # installs, then triggers an immediate test run

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/install-windows-scheduler.ps1 -Uninstall
#>
param(
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$TaskName = 'MySecondBrain-VaultAutoSync'
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$Script   = Join-Path $RepoRoot 'scripts\auto-sync-vault.mjs'
$NodeExe  = (Get-Command node -ErrorAction Stop).Source

function Remove-IfExists {
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "[ok] Removed existing task: $TaskName"
  }
}

if ($Uninstall) {
  Remove-IfExists
  Write-Host ''
  Write-Host 'Uninstalled.'
  exit 0
}

if (-not (Test-Path $Script)) {
  throw "Script not found: $Script"
}

Remove-IfExists

# Use schtasks.exe for maximum compatibility across Windows PowerShell versions.
# Trigger: HOURLY starting 2 minutes from now, repeats forever.
$startTime = (Get-Date).AddMinutes(2).ToString('HH:mm')
$tr = "`"$NodeExe`" `"$Script`""

# /sc HOURLY /mo 1 = every 1 hour
# /it    = run interactively (so the task can access user PATH / git config)
# /rl LIMITED = least privilege
# /f     = overwrite if exists
$null = & schtasks.exe /Create `
  /TN $TaskName `
  /TR $tr `
  /SC HOURLY `
  /MO 1 `
  /ST $startTime `
  /RL LIMITED `
  /IT `
  /F 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "schtasks.exe /Create failed with exit $LASTEXITCODE"
}

# Apply extra settings via the ScheduledTasks module:
#   - start when available (catch up after sleep / boot)
#   - no parallel runs
#   - 10 min hard timeout
#   - working directory = repo root
try {
  $task = Get-ScheduledTask -TaskName $TaskName
  $task.Settings.StartWhenAvailable = $true
  $task.Settings.MultipleInstances = 'IgnoreNew'
  $task.Settings.ExecutionTimeLimit = 'PT10M'
  $task.Actions[0].WorkingDirectory = $RepoRoot
  $task | Set-ScheduledTask | Out-Null
} catch {
  Write-Host "[warn] Could not apply advanced settings: $($_.Exception.Message)"
}

Write-Host "[ok] Registered task: $TaskName"
Write-Host ''
Write-Host "  Trigger : first run at $startTime today, then every 1 hour"
Write-Host "  Command : node `"$Script`""
Write-Host "  CWD     : $RepoRoot"
Write-Host "  Log     : $RepoRoot\logs\auto-sync.log"
Write-Host ''

# Immediate test run
Write-Host 'Running task once now ...'
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3
$info = Get-ScheduledTaskInfo -TaskName $TaskName
$lrt = $info.LastRunTime
$ltr = $info.LastTaskResult
Write-Host "  LastRunTime    : $lrt"
Write-Host "  LastTaskResult : $ltr   [0 means success]"
Write-Host ''
Write-Host 'Useful commands:'
Write-Host '  Get-ScheduledTaskInfo -TaskName MySecondBrain-VaultAutoSync'
Write-Host '  Start-ScheduledTask   -TaskName MySecondBrain-VaultAutoSync'
Write-Host '  powershell -ExecutionPolicy Bypass -File scripts/install-windows-scheduler.ps1 -Uninstall'
