#!/usr/bin/env bash
# Puts OPENAI_API_KEY into the Vercel project, redeploys and verifies the chat.
#
# Run this yourself: the key is read straight from your local .env file into
# the Vercel CLI and never passes through anything else.
#
#   bash scripts/set-openai-key.sh                 # this repo's .env
#   bash scripts/set-openai-key.sh /path/to/.env   # any other env file

set -euo pipefail
cd "$(dirname "$0")/.."

KEY_FILE="${1:-./.env}"

[ -f "$KEY_FILE" ] || { echo "Не найден файл с ключом: $KEY_FILE"; exit 1; }

KEY=$(grep -E '^OPENAI_API_KEY=' "$KEY_FILE" | head -1 | sed 's/^OPENAI_API_KEY=//' | tr -d '"'"'"'\r')
[ -n "$KEY" ] || { echo "В $KEY_FILE нет OPENAI_API_KEY"; exit 1; }

echo "Беру ключ ${KEY:0:12}… из $KEY_FILE"

# Remove any existing value first so re-running this is safe.
npx vercel env rm OPENAI_API_KEY production --yes >/dev/null 2>&1 || true
printf '%s' "$KEY" | npx vercel env add OPENAI_API_KEY production

echo "Редеплой…"
npx vercel --prod --yes >/dev/null

echo "Проверка /api/ai-chat:"
curl -s -m 90 -X POST https://codex-goroskop.vercel.app/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"question":"тест соединения","context":"проверка","pageTitle":"test"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);console.log('  model:',j.model,'| connected:',j.connected);process.exit(j.connected?0:1)}catch(e){console.log('  RAW:',d.slice(0,200));process.exit(1)}})"

echo "Готово: чат подключён."
