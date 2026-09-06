# Puts OPENAI_API_KEY into the Vercel project, redeploys and verifies the chat.
#
# Run this yourself: the key is read straight from your local .env file into
# the Vercel CLI and never passes through anything else.
#
#   pwsh scripts/set-openai-key.ps1                      # this repo's .env
#   pwsh scripts/set-openai-key.ps1 C:\path\to\.env.local
#
# PowerShell twin of set-openai-key.sh, for shells without bash on PATH.

param([string]$KeyFile = "./.env")

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path $KeyFile)) { throw "Не найден файл с ключом: $KeyFile" }

$line = Get-Content $KeyFile | Where-Object { $_ -match '^\s*OPENAI_API_KEY\s*=' } | Select-Object -First 1
if (-not $line) { throw "В $KeyFile нет OPENAI_API_KEY" }

$key = ($line -replace '^\s*OPENAI_API_KEY\s*=\s*', '').Trim().Trim('"').Trim("'")
if (-not $key) { throw "OPENAI_API_KEY в $KeyFile пустой" }

Write-Host "Беру ключ $($key.Substring(0, [Math]::Min(12, $key.Length)))… из $KeyFile"

# Remove any existing value first so re-running this is safe.
try { npx vercel env rm OPENAI_API_KEY production --yes 2>&1 | Out-Null } catch {}
$key | npx vercel env add OPENAI_API_KEY production
if ($LASTEXITCODE -ne 0) { throw "Не удалось записать переменную в Vercel" }

Write-Host "Редеплой…"
npx vercel --prod --yes | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Редеплой не удался" }

Write-Host "Проверка /api/ai-chat:"
$body = '{"question":"тест соединения","context":"проверка","pageTitle":"test"}'
$resp = Invoke-RestMethod -Uri "https://codex-goroskop.vercel.app/api/ai-chat" `
  -Method Post -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 90

Write-Host "  model: $($resp.model) | connected: $($resp.connected)"
if (-not $resp.connected) { throw "Чат всё ещё на локальном фолбэке — ключ не подхватился." }
Write-Host "Готово: чат подключён."
