#!/bin/bash

echo "=== Testing Login and Title Generation ==="

# 1. ログイン
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST https://tatami-column-ai.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "okuitatami",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# 2. タイトル生成（ログイン後のCookieを使用）
echo ""
echo "2. Generating titles..."
TITLE_RESPONSE=$(curl -s -b cookies.txt -X POST https://tatami-column-ai.pages.dev/api/column/generate-titles \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["畳", "リフォーム"],
    "regions": ["神戸市"]
  }')

echo "Title generation response:"
echo "$TITLE_RESPONSE" | head -50

# クリーンアップ
rm -f cookies.txt
