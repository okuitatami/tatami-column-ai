#!/bin/bash

# ログイン
curl -s -c cookies.txt -X POST https://tatami-column-ai.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "okuitatami", "password": "password123"}' > /dev/null

# タイトル生成（詳細版）
RESPONSE=$(curl -s -b cookies.txt -X POST https://tatami-column-ai.pages.dev/api/column/generate-titles \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["畳", "リフォーム"], "regions": ["神戸市"]}')

echo "=== タイトル生成結果 ==="
echo "$RESPONSE" | jq '.titles | length' 2>/dev/null && echo "個のタイトルが生成されました"
echo ""
echo "=== 生成されたタイトル一覧 ==="
echo "$RESPONSE" | jq -r '.titles[] | "- \(.title)"' 2>/dev/null

rm -f cookies.txt
