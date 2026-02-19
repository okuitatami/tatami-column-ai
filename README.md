# 畳業界AIコラム生成システム（ファインチューニング対応）

奥井畳店向けAIコラム生成システム（Gemini 2.5 Flash統合）

## 📍 本番環境
- **Cloudflare Pages**: https://tatami-column-ai.pages.dev
- **GitHub Repository**: https://github.com/okuitatami/tatami-column-ai
- **Sandbox**: https://3000-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai/
- **D1 Database**: tatami-column-ai-production
- **最終更新**: 2026-02-19

## ✨ 主要機能

### 1. **AIコラム自動生成**
- **Gemini 2.5 Flash**による高品質なコラム生成
- キーワード・地域・ターゲット読者の指定に対応
- SEO最適化されたタイトル生成（7個）
- 導入文・本文（4～6セクション）・まとめ・Q&A（3～5問）を自動生成

### 2. **ファインチューニング機能** ⭐NEW
#### **プロンプト保存**
- コラム生成時に使用したプロンプトをDBに自動保存
- `column_history`テーブルの`generation_prompt`列に格納

#### **インライン訂正UI**
- 各セクション（導入文・本文・まとめ）に「訂正」ボタンを配置
- ボタンクリックでインライン訂正フォームが展開
- 訂正内容（見出し・本文・訂正理由）を入力して送信

#### **訂正データ蓄積**
- 訂正内容を`column_corrections`テーブルに保存
- ユーザーID、セクションタイプ、キーワード、地域情報と紐付け

#### **AI学習システム**
- 同じキーワードでコラム生成時に過去の訂正データを取得
- 訂正データをプロンプトに追加し、AIが学習パターンを反映
- コラムを作るたびにそのユーザー向けのAIに進化

### 3. **診断チャート**
- 7問の質問で畳の状態を診断
- 推奨工法（裏返し・表替え・新調工事）を提示
- 推奨素材（天然い草・化学表）を表示
- 概算費用を自動計算
- 緊急度判定と問い合わせボタン

### 4. **診断設定管理**
- 診断傾向（天然素材・化学表・両方）のカスタマイズ
- 価格設定（裏返し・表替え・新調工事）の個別設定
- お問い合わせURLの設定

### 5. **ユーザー認証**
- ユーザー登録・ログイン機能
- セッション管理（7日間有効）
- ユーザーごとにコラム履歴と訂正データを管理

## 🎯 ファインチューニングの仕組み

```
1. コラム生成
   ↓
2. AIが生成したコラムを確認
   ↓
3. 各セクションの「訂正」ボタンをクリック
   ↓
4. 訂正フォームで修正内容と理由を入力
   ↓
5. 訂正データがDBに保存
   ↓
6. 次回同じキーワードでコラム生成時、過去の訂正データがプロンプトに追加される
   ↓
7. AIが訂正パターンを学習し、より良いコラムを生成
```

## 📊 データ構造

### `column_history` - コラム履歴
```sql
- id, user_id, title, introduction, sections, closing, qa
- keywords, regions, target_audience
- meta_description, character_count
- generation_prompt (⭐NEW: 生成に使用したプロンプト)
- created_at
```

### `column_corrections` - 訂正データ
```sql
- id, user_id, column_id
- section_type (introduction/section/closing/qa)
- section_index
- original_heading, original_content
- corrected_heading, corrected_content
- correction_reason (訂正理由)
- keywords, regions
- created_at
```

### `diagnosis_settings` - 診断設定
```sql
- id, user_id
- diagnostic_tendency (天然素材/化学表/両方)
- contact_url
- price_urakaeshi_min/max
- price_omoteae_min/max
- price_shincho_min/max
- created_at, updated_at
```

## 🔧 技術スタック

- **Runtime**: Cloudflare Workers/Pages
- **Framework**: Hono (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **AI Provider**: Google Gemini 2.5 Flash
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: npm
- **Version Control**: Git + GitHub
- **Process Manager**: PM2 (サンドボックス開発環境)

## 🚀 開発環境

### 必要な環境変数
```bash
# .dev.vars ファイル
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here

# 会社情報（任意）
COMPANY_NAME=奥井畳店
COMPANY_DESCRIPTION=兵庫県神戸市の畳専門店
COMPANY_STRENGTHS=伝統技術,高品質素材,迅速対応
COMPANY_FEATURES=創業60年,職人の技,無料見積もり
COMPANY_WEBSITE=https://example.com
```

### ローカル開発
```bash
# 依存関係のインストール
npm install

# D1マイグレーション適用
npm run db:migrate:local

# 開発サーバー起動
npm run dev:sandbox
# または PM2 を使用
npm run build
pm2 start ecosystem.config.cjs
```

### サンドボックスURL
```
https://3000-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai/
```

## 📝 使い方

### 1. **コラム生成**
1. ログイン: https://tatami-column-ai.pages.dev/
2. キーワードを2つ以上入力（例：畳、リフォーム）
3. 地域を入力（例：神戸市）
4. 「タイトルを生成」をクリック
5. 表示された7つのタイトルから1つを選択
6. 「コラムを生成」をクリック

### 2. **訂正とファインチューニング**
1. 生成されたコラムの各セクションに「承認」「訂正」ボタンが表示
2. 訂正が必要なセクションの「訂正」ボタンをクリック
3. インライン訂正フォームが展開
4. 訂正後の見出し・本文・訂正理由を入力
5. 「訂正を送信」ボタンをクリック
6. 訂正データがDBに保存され、次回から学習に活用

### 3. **診断チャート**
1. https://tatami-column-ai.pages.dev/diagnosis にアクセス
2. 7問の質問に回答
3. 診断結果（推奨工法・素材・概算費用）を確認
4. 「お問い合わせはこちら」ボタンで連絡

### 4. **診断設定**
1. ヘッダー右上の⚙️（設定アイコン）をクリック
2. または https://tatami-column-ai.pages.dev/diagnosis-settings にアクセス
3. 診断傾向、価格設定、お問い合わせURLを入力
4. 「設定を保存」ボタンをクリック

## 🗂️ ディレクトリ構造

```
webapp/
├── src/
│   ├── index.tsx              # メインエントリポイント
│   ├── routes/
│   │   ├── auth.ts            # 認証API
│   │   ├── column.ts          # コラム生成API
│   │   ├── ai-learning.ts     # AI学習API（⭐NEW: 訂正機能）
│   │   └── diagnosis.ts       # 診断チャートAPI
│   ├── utils/
│   │   ├── db.ts              # データベースユーティリティ
│   │   ├── auth.ts            # 認証ユーティリティ
│   │   ├── ai-learning.ts     # AI学習ユーティリティ（⭐NEW）
│   │   ├── seo.ts             # SEOユーティリティ
│   │   └── diagnosis.ts       # 診断ユーティリティ
│   └── lib/
│       └── gemini-client.ts   # Gemini APIクライアント
├── public/
│   └── static/
│       ├── app.js             # フロントエンドJS（⭐NEW: 訂正UI）
│       ├── app-diagnosis.js   # 診断チャートJS
│       └── app-diagnosis-settings.js # 診断設定JS
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0006_add_ai_learning_system.sql
│   ├── 0008_add_pricing_to_diagnosis_settings.sql
│   └── 0009_add_prompt_to_column_history.sql ⭐NEW
├── wrangler.jsonc             # Cloudflare設定
├── package.json
└── README.md
```

## 🔐 セキュリティ

- 環境変数による機密情報管理
- `.dev.vars`ファイルは`.gitignore`に追加
- セッションベース認証
- SQLインジェクション対策（プリペアドステートメント）
- XSS対策（入力サニタイゼーション）

## 📈 今後の拡張予定

### ✅ 完了済み
- [x] プロンプト保存機能
- [x] インライン訂正UI
- [x] 訂正データ保存
- [x] 過去訂正データ取得関数
- [x] ファインチューニング（プロンプトに訂正データを追加）

### 🎯 次のステップ
- [ ] プロンプト表示機能（生成時のプロンプトをUI上で確認）
- [ ] 訂正データの統計・分析機能
- [ ] 訂正パターンの可視化
- [ ] 多言語対応
- [ ] 画像生成機能
- [ ] 顧客チューニング機能の強化

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesをご利用ください。

---

**最終更新**: 2026-02-19  
**バージョン**: 2.0.0 (ファインチューニング機能追加)
