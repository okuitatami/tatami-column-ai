#!/bin/bash

echo "=== Testing Column Generation ==="

# 1. ログイン
echo "1. Logging in..."
curl -s -c cookies.txt -X POST https://tatami-column-ai.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "okuitatami",
    "password": "password123"
  }' > /dev/null

# 2. コラム生成
echo "2. Generating column..."
COLUMN_RESPONSE=$(curl -s -b cookies.txt -X POST https://tatami-column-ai.pages.dev/api/column/generate-column \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["畳", "リフォーム"],
    "regions": ["神戸市"],
    "title": "神戸市で畳リフォーム！表替えと新調の費用相場を徹底比較",
    "targetAudience": "畳のリフォームを検討している神戸市在住の方"
  }')

echo "Column generation response:"
echo "$COLUMN_RESPONSE" | jq '.' 2>/dev/null || echo "$COLUMN_RESPONSE"

# クリーンアップ
rm -f cookies.txt
