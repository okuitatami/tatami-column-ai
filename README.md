# webapp - AI コラム生成システム（顧客版）

## 🎉 Gemini API 統合完了

### ✅ 完了した機能

1. **Gemini API 統合 (gemini-2.5-flash)**
   - OpenAI API から Gemini API への完全移行
   - 畳業界の専門知識をシステムインストラクションとして組み込み
   - REST API方式でCloudflare Workers環境と完全互換

2. **畳業界知識の実装**
   - 用語の統一（化学表→紙素材・ポリプロピレン素材、琉球畳→琉球風畳）
   - 価格設定（店舗によって異なる、高い傾向、品質で変わる）
   - 工法と価格相場（新調工事・表替え・裏返し）
   - よくある症状と対策

3. **動作確認済み**
   - タイトル生成API: ✅ 正常動作
   - 専門用語の自動変換: ✅ 正常動作
   - レスポンス時間: 5-6秒程度

## 📊 現在の機能状態

### 実装済み
- ✅ コラム生成（Gemini 2.5-flash）
- ✅ タイトル生成（Gemini 2.5-flash）
- ✅ 価格設定管理
- ✅ 診断チャート
- ✅ アクセス解析ダッシュボード
- ✅ 月間生成数カウント

### 保留中
- 🔄 価格設定の用語変更（全面張替え→新調工事、メンテナンス→裏返し）
- 🔄 価格設定に「人気価格」の追加
- 🔄 診断チャートの質問具体化（ささくれ、シミなど）

## 🌐 アクセスURL

### サンドボックス環境
- **メインURL**: https://3001-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai
- **ヘルスチェック**: https://3001-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai/api/health

### ローカル環境
- **メインURL**: http://localhost:3001
- **API**: http://localhost:3001/api/column/*

## 🔧 技術スタック

### AI / バックエンド
- **AI Provider**: Gemini API (gemini-2.5-flash)
- **Framework**: Hono
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)

### フロントエンド
- **CSS**: Tailwind CSS (CDN)
- **Icons**: FontAwesome
- **JavaScript**: Vanilla JS

## 📝 API エンドポイント

### タイトル生成
```bash
POST /api/column/generate-titles
Content-Type: application/json

{
  "keywords": ["畳", "リフォーム"],
  "regions": ["神戸市"]
}
```

### コラム生成
```bash
POST /api/column/generate-column
Content-Type: application/json

{
  "keywords": ["畳", "リフォーム"],
  "regions": ["神戸市"],
  "title": "選択したタイトル",
  "targetAudience": "ターゲット層（任意）"
}
```

### 月間生成数取得
```bash
GET /api/column/monthly-count
```

## 🚀 開発環境セットアップ

### 環境変数 (.dev.vars)
```bash
# AI設定
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here

# アカウント設定
ACCOUNT_STATUS=active

# 会社情報
COMPANY_NAME=奥井畳店
COMPANY_DESCRIPTION=神戸市を中心に畳のリフォーム・張替えを行う創業50年の老舗畳店です。
COMPANY_STRENGTHS=創業50年の実績と信頼,熟練の職人による高品質な施工
COMPANY_FEATURES=国産い草使用,伝統技術継承
COMPANY_REGIONS=神戸市,兵庫県,阪神間
COMPANY_WEBSITE=https://example.com
```

### ビルドと起動
```bash
# ビルド
npm run build

# ローカル開発サーバー起動
npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3001

# データベースマイグレーション（初回のみ）
npm run db:migrate:local
```

## 🗄️ データベース構造

### テーブル
- `users`: ユーザー情報
- `sessions`: セッション管理
- `column_generation_logs`: コラム生成履歴
- `price_settings`: 価格設定
- `analytics_pageviews`: ページビュー追跡
- `analytics_diagnosis`: 診断チャート追跡
- `analytics_conversions`: コンバージョン追跡

## 📈 次のステップ

1. **価格設定機能の更新**
   - 用語変更（新調工事、裏返し）
   - 人気価格の追加

2. **診断チャート機能の強化**
   - 質問の具体化（7問）
   - 化学畳表に関する質問追加

3. **本番デプロイ**
   - Cloudflare Pagesへのデプロイ
   - 環境変数の設定
   - カスタムドメインの設定

## ⚙️ Gemini API について

### モデル選択
- **現在使用**: `gemini-2.5-flash`
- **理由**: 安定版、高い無料枠、高速レスポンス

### 無料枠の制限
- **リクエスト制限**: 1日あたりの制限あり
- **トークン制限**: 1分あたりの制限あり
- **推奨**: 本番環境では有料プランを検討

### 有料プランへの移行
- 高頻度の利用が必要な場合
- より高いレート制限が必要な場合
- `gemini-2.5-pro`などの高度なモデルが必要な場合

## 📚 畳業界知識ドキュメント

詳細な畳業界知識は以下のファイルに記載：
- `/home/user/webapp/knowledge/tatami-industry.md`

## 🎯 プロジェクト目標

神戸市の奥井畳店向けに、SEOに強いコラムを自動生成し、顧客獲得を支援するシステム。

## 📞 サポート

問題が発生した場合は、以下を確認：
1. Gemini APIキーが正しく設定されているか
2. データベースマイグレーションが完了しているか
3. `.dev.vars`ファイルが正しく設定されているか

---

**最終更新**: 2026-01-28
**バージョン**: 1.0.0（Gemini統合版）
**ステータス**: ✅ 動作確認済み
