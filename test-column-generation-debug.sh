#!/bin/bash

echo "=== ログイン ==="
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST https://tatami-column-ai.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"okuitatami","password":"password123"}')
echo "$LOGIN_RESPONSE" | jq '.'

echo ""
echo "=== コラム生成テスト ==="
COLUMN_RESPONSE=$(curl -s -b cookies.txt -X POST https://tatami-column-ai.pages.dev/api/column/generate-column \
  -H "Content-Type: application/json" \
  -d '{
    "title": "神戸市で畳リフォーム｜表替えと新調工事の費用相場を徹底比較",
    "keywords": ["畳", "リフォーム"],
    "regions": ["神戸市"]
  }')

echo "$COLUMN_RESPONSE" | jq '.' 2>&1 | head -100

rm -f cookies.txt
