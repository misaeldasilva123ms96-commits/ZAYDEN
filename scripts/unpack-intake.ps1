#Requires -Version 5.1
<#
.SYNOPSIS
  Unpacks ZAYDEN vendor archives into governed intake folders.

.NOTES
  Origin: ZAYDEN Phase 1 — Source Intake (reproducible layout).
  This script is a thin orchestration wrapper over Expand-Archive (no third-party deps).
#>
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $Root

function Require-Zip($name) {
  $p = Join-Path $Root $name
  if (-not (Test-Path -LiteralPath $p)) {
    throw "Missing archive: $p"
  }
  return $p
}

Require-Zip "openclaude-main.zip" | Out-Null
Require-Zip "claw-code-main.zip" | Out-Null
Require-Zip "src.zip" | Out-Null
Require-Zip "system_prompts_leaks-main.zip" | Out-Null

New-Item -ItemType Directory -Force -Path (Join-Path $Root "sources\intake") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root "sources\study") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root "sources\reference") | Out-Null

Write-Host "Unpacking openclaude-main.zip -> sources/intake/"
Expand-Archive -LiteralPath (Join-Path $Root "openclaude-main.zip") -DestinationPath (Join-Path $Root "sources\intake") -Force

Write-Host "Unpacking claw-code-main.zip -> sources/intake/"
Expand-Archive -LiteralPath (Join-Path $Root "claw-code-main.zip") -DestinationPath (Join-Path $Root "sources\intake") -Force

Write-Host "Unpacking src.zip -> sources/study/"
Expand-Archive -LiteralPath (Join-Path $Root "src.zip") -DestinationPath (Join-Path $Root "sources\study") -Force

Write-Host "Unpacking system_prompts_leaks-main.zip -> sources/reference/"
Expand-Archive -LiteralPath (Join-Path $Root "system_prompts_leaks-main.zip") -DestinationPath (Join-Path $Root "sources\reference") -Force

$inner = Join-Path $Root "sources\reference\system_prompts_leaks-main"
$dest = Join-Path $Root "sources\reference\system-prompts-leaks"
if (Test-Path -LiteralPath $inner) {
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Get-ChildItem -LiteralPath $inner -Force | ForEach-Object {
    $target = Join-Path $dest $_.Name
    if (Test-Path -LiteralPath $target) {
      Remove-Item -LiteralPath $target -Recurse -Force
    }
    Move-Item -LiteralPath $_.FullName -Destination $dest -Force
  }
  Remove-Item -LiteralPath $inner -Recurse -Force
}

Write-Host "Done. Next: npm run intake:validate"
