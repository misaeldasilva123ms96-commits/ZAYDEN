#Requires -Version 5.1
<#
.SYNOPSIS
  Unpacks ZAYDEN vendor archives into governed `research/` folders (Phase 0/1 layout).

.NOTES
  Traceability: docs/runbooks/intake.md
#>
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $Root

function Require-Zip([string]$name) {
  $p = Join-Path $Root $name
  if (-not (Test-Path -LiteralPath $p)) {
    throw "Missing archive: $p"
  }
}

function MustExist([string]$p) {
  if (-not (Test-Path -LiteralPath $p)) {
    throw "Unexpected archive layout, missing: $p"
  }
}

function Ensure-Dir([string]$rel) {
  $abs = Join-Path $Root $rel
  New-Item -ItemType Directory -Force -Path $abs | Out-Null
}

function Expand-ToTemp([string]$zipName) {
  Ensure-Dir "research"
  $tmp = Join-Path $Root ("research\\_tmp_" + [Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  Expand-Archive -LiteralPath (Join-Path $Root $zipName) -DestinationPath $tmp -Force
  return $tmp
}

function Move-Children([string]$srcDir, [string]$dstRel) {
  $dstAbs = Join-Path $Root $dstRel
  New-Item -ItemType Directory -Force -Path $dstAbs | Out-Null
  Get-ChildItem -LiteralPath $srcDir -Force | ForEach-Object {
    $target = Join-Path $dstAbs $_.Name
    if (Test-Path -LiteralPath $target) {
      Remove-Item -LiteralPath $target -Recurse -Force
    }
    Move-Item -LiteralPath $_.FullName -Destination $dstAbs -Force
  }
}

Require-Zip "openclaude-main.zip"
Require-Zip "claw-code-main.zip"
Require-Zip "src.zip"
Require-Zip "system_prompts_leaks-main.zip"

Write-Host "Unpacking openclaude-main.zip -> research/source-openclaude/"
$tmp = Expand-ToTemp "openclaude-main.zip"
try {
  $inner = Join-Path $tmp "openclaude-main"
  MustExist $inner
  Move-Children $inner "research\\source-openclaude"
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Unpacking claw-code-main.zip -> research/source-claw-code/"
$tmp = Expand-ToTemp "claw-code-main.zip"
try {
  $inner = Join-Path $tmp "claw-code-main"
  MustExist $inner
  Move-Children $inner "research\\source-claw-code"
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Unpacking src.zip -> research/source-src-partial/ (flatten src/)"
$tmp = Expand-ToTemp "src.zip"
try {
  $inner = Join-Path $tmp "src"
  MustExist $inner
  Move-Children $inner "research\\source-src-partial"
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Unpacking system_prompts_leaks-main.zip -> research/source-prompts-reference/"
$tmp = Expand-ToTemp "system_prompts_leaks-main.zip"
try {
  $inner = Join-Path $tmp "system_prompts_leaks-main"
  MustExist $inner
  Move-Children $inner "research\\source-prompts-reference"
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Ensure-Dir "research\\source-models\\manifests"
Write-Host "Done. Next: npm run intake:validate"
