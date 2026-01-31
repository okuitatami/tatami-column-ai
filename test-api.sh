#!/bin/bash

echo "Testing Gemini API with production key..."

# Cloudflareから環境変数を取得（実際のキーは表示されない）
cd /home/user/webapp
export CLOUDFLARE_API_TOKEN=$(cat .cloudflare-token)

# 環境変数一覧を確認
echo "Checking environment variables..."
npx wrangler pages secret list --project-name tatami-column-ai 2>&1 | grep -E "(AI_PROVIDER|GEMINI_API_KEY|COMPANY_NAME)"

echo ""
echo "Testing title generation endpoint..."
curl -X POST https://tatami-column-ai.pages.dev/api/column/generate-titles \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["畳", "リフォーム"],
    "regions": ["神戸市"]
  }' 2>&1 | head -50
