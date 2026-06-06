param(
  [switch]$Probe
)

$ErrorActionPreference = "Continue"

$root = "G:\Codex Goroskop"
$category = "12-applied-esoteric-talismans-calendar"
$extractedDir = Join-Path $root "data\extracted-text\$category"
$statusDir = Join-Path $root "data\ocr-runs\$category"
$logPath = Join-Path $statusDir ("worker-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")

New-Item -ItemType Directory -Force -Path $statusDir | Out-Null

function Write-WorkerLog {
  param([string]$Message)
  $line = ("[{0}] {1}" -f (Get-Date -Format "s"), $Message)
  Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
}

Set-Location -LiteralPath $root
Write-WorkerLog "START category=$category"

if ($Probe) {
  Write-WorkerLog "PROBE ok"
  exit 0
}

$metaFiles = Get-ChildItem -LiteralPath $extractedDir -Filter "*.json" | Sort-Object Name

foreach ($metaFile in $metaFiles) {
  $meta = Get-Content -Raw -LiteralPath $metaFile.FullName | ConvertFrom-Json
  $statusPath = Join-Path $statusDir ($metaFile.BaseName + ".json")
  $status = $null
  if (Test-Path -LiteralPath $statusPath) {
    $status = Get-Content -Raw -LiteralPath $statusPath | ConvertFrom-Json
  }

  $charCount = 0
  if ($null -ne $meta.charCount) {
    $charCount = [int64]$meta.charCount
  }

  $statusOk = $false
  if ($null -ne $status -and $status.status -eq "ok" -and $status.charCount -gt 0) {
    $statusOk = $true
  }

  if ($charCount -gt 0 -and $statusOk) {
    Write-WorkerLog "SKIP ok slug=$($metaFile.BaseName) chars=$charCount"
    continue
  }

  Write-WorkerLog "OCR_BEGIN slug=$($metaFile.BaseName) pdf=$($meta.sourcePdf)"
  & node tools\ocr-pdf-text.cjs --file $meta.sourcePdf --dpi 220 --lang rus+eng >> $logPath 2>&1
  $ocrExit = $LASTEXITCODE

  $freshMeta = Get-Content -Raw -LiteralPath $metaFile.FullName | ConvertFrom-Json
  $freshStatus = $null
  if (Test-Path -LiteralPath $statusPath) {
    $freshStatus = Get-Content -Raw -LiteralPath $statusPath | ConvertFrom-Json
  }

  if ($ocrExit -eq 0 -and $freshMeta.charCount -gt 0 -and $freshStatus.status -ne "failed") {
    Write-WorkerLog "PROFILE_BEGIN slug=$($metaFile.BaseName) txt=$($freshMeta.textFile)"
    & npm run profile:text -- --file $freshMeta.textFile >> $logPath 2>&1
    Write-WorkerLog "PROFILE_DONE slug=$($metaFile.BaseName) exit=$LASTEXITCODE"
  } else {
    Write-WorkerLog "PROFILE_SKIP slug=$($metaFile.BaseName) ocrExit=$ocrExit chars=$($freshMeta.charCount) status=$($freshStatus.status)"
  }
}

Write-WorkerLog "DONE category=$category"
