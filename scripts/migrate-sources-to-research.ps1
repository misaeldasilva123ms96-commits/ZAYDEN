#Requires -Version 5.1
<#
.SYNOPSIS
  One-time migration from legacy `sources/*` intake layout to `research/*`.

.NOTES
  Safe to run multiple times; no-ops if legacy folders are absent.
#>
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $Root

function Move-IfExists([string]$srcRel, [string]$dstRel) {
  $src = Join-Path $Root $srcRel
  $dst = Join-Path $Root $dstRel
  if (-not (Test-Path -LiteralPath $src)) { return }
  New-Item -ItemType Directory -Force -Path (Split-Path $dst -Parent) | Out-Null
  if (Test-Path -LiteralPath $dst) {
    Remove-Item -LiteralPath $dst -Recurse -Force
  }
  Move-Item -LiteralPath $src -Destination $dst -Force
}

# Legacy layout from earlier ZAYDEN iterations
Move-IfExists "sources\\intake\\openclaude-main" "research\\source-openclaude"
Move-IfExists "sources\\intake\\claw-code-main" "research\\source-claw-code"
Move-IfExists "sources\\study\\src" "research\\source-src-partial"

$legacyRefInner = Join-Path $Root "sources\\reference\\system-prompts-leaks"
$legacyRefZipRoot = Join-Path $Root "sources\\reference\\system_prompts_leaks-main"
if (Test-Path -LiteralPath $legacyRefInner) {
  Move-IfExists "sources\\reference\\system-prompts-leaks" "research\\source-prompts-reference"
} elseif (Test-Path -LiteralPath $legacyRefZipRoot) {
  Move-IfExists "sources\\reference\\system_prompts_leaks-main" "research\\source-prompts-reference"
}

Write-Host "Migration complete (best-effort). Next: npm run intake:validate"
