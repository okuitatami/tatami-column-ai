# AIコラム作成ツール

## プロジェクト概要
- **名前**: AIコラム作成ツール
- **目的**: Claude AIを活用してSEO最適化されたコラム記事を自動生成するツール
- **主な機能**:
  - テーマ入力による5パターンのタイトル候補生成
  - 選択したタイトルから3000文字程度のコラム自動生成
  - ウェブサイト解析機能（URLを入力してサイトの特徴を反映）
  - リアルタイム編集・プレビュー機能
  - SEO分析（文字数、キーワード密度、メタディスクリプション）
  - HTML・プレーンテキストエクスポート
  - ユーザー認証（ログイン/登録）

## 現在完了している機能

✅ **認証システム**
- ユーザー登録・ログイン機能
- セッション管理（7日間有効）
- パスワードハッシュ化（SHA-256）

✅ **AI生成機能**
- Claude API連携
- テーマからタイトル候補5つを生成
- 選択したタイトルからコラム全文を生成
- コラム構成：タイトル、導入文、見出し1-5、クロージング、Q&A 3-4個

✅ **ウェブサイト解析**
- URL入力でサイト情報を取得
- サイトの特徴・強みを抽出
- コラム生成時にサイト情報を反映

✅ **編集機能**
- 全セクションのリアルタイム編集
- プレビュー表示
- 編集内容の即時反映

✅ **SEO機能**
- 文字数カウント（リアルタイム）
- キーワード密度計算
- キーワード自動抽出（5個）
- メタディスクリプション自動生成
- SEOスコア計算（0-100）

✅ **エクスポート機能**
- クリップボードへコピー
- HTML形式でダウンロード
- SEOメタタグ付きHTML

✅ **UI/UX**
- レスポンシブデザイン（TailwindCSS）
- 3ステップのウィザード形式
- ローディング表示
- エラーハンドリング
- Font Awesomeアイコン

## 公開URL

### 開発環境
- **アプリケーション**: https://3000-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai
- **ヘルスチェック**: https://3000-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai/api/health

### APIエンドポイント
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得
- `POST /api/column/analyze-website` - ウェブサイト解析
- `POST /api/column/generate-titles` - タイトル候補生成
- `POST /api/column/generate-column` - コラム生成
- `POST /api/column/analyze-seo` - SEO分析

## データアーキテクチャ

### データモデル

**User（ユーザー）**
```sql
- id: INTEGER (主キー)
- username: TEXT (ユニーク)
- password_hash: TEXT
- email: TEXT (オプション)
- created_at: DATETIME
- updated_at: DATETIME
```

**Session（セッション）**
```sql
- id: TEXT (主キー)
- user_id: INTEGER (外部キー)
- expires_at: DATETIME
- created_at: DATETIME
```

### ストレージサービス
- **Cloudflare D1**: SQLiteベースのユーザー・セッション管理
- **ローカル開発**: `.wrangler/state/v3/d1/` にローカルSQLiteデータベース

### データフロー
1. ユーザーがテーマを入力
2. （オプション）ウェブサイトURLを入力して解析
3. Claude APIでタイトル候補を5つ生成
4. ユーザーがタイトルを選択
5. Claude APIでコラム全文を生成（3000文字程度）
6. リアルタイムでSEO分析を実施
7. ユーザーが編集・プレビュー
8. エクスポート（コピー or HTMLダウンロード）

## 使い方

### 1. 初回セットアップ

```bash
# 依存関係のインストール（済み）
npm install

# 環境変数の設定
# .dev.vars ファイルを編集してClaude APIキーを設定
CLAUDE_API_KEY=your-actual-claude-api-key
```

### 2. ローカル開発

```bash
# ビルド
npm run build

# データベースマイグレーション（初回のみ）
npm run db:migrate:local

# 開発サーバー起動（PM2）
pm2 start ecosystem.config.cjs

# サービスの確認
pm2 list
pm2 logs webapp --nostream

# サービス停止
pm2 delete webapp
```

### 3. 使用手順

1. **アカウント作成**
   - 初回訪問時に新規登録
   - ユーザー名（3文字以上）とパスワード（6文字以上）を設定

2. **テーマ入力**
   - コラムのテーマを入力（例: 「畳の張り替え時期の見極め方」）
   - （オプション）ウェブサイトURLを入力して「解析」ボタンをクリック

3. **タイトル選択**
   - 生成された5つのタイトル候補から1つを選択
   - 「コラムを生成」ボタンをクリック

4. **編集・プレビュー**
   - 生成されたコラムを自由に編集
   - 「プレビュー」ボタンで実際の表示を確認
   - SEO情報をリアルタイムで確認

5. **エクスポート**
   - 「コピー」ボタンでクリップボードにコピー
   - 「HTML出力」ボタンでHTMLファイルをダウンロード

## デプロイ方法

### Cloudflare Pagesへのデプロイ

```bash
# 1. Cloudflare APIトークンを設定
# setup_cloudflare_api_key ツールを使用

# 2. 本番データベースを作成
npx wrangler d1 create webapp-production
# 出力されたdatabase_idをwrangler.jsoncに設定

# 3. マイグレーション適用
npm run db:migrate:prod

# 4. 環境変数を設定
npx wrangler pages secret put CLAUDE_API_KEY --project-name webapp
npx wrangler pages secret put SESSION_SECRET --project-name webapp

# 5. デプロイ
npm run deploy
```

## 技術スタック

### バックエンド
- **Hono**: 軽量高速なWebフレームワーク
- **Cloudflare Workers**: エッジコンピューティング
- **Cloudflare D1**: SQLiteベースのサーバーレスデータベース
- **TypeScript**: 型安全な開発

### フロントエンド
- **Vanilla JavaScript**: フレームワークレス
- **TailwindCSS**: ユーティリティファーストCSS
- **Font Awesome**: アイコンライブラリ

### AI
- **Claude 3.5 Sonnet**: Anthropic API
  - タイトル生成
  - コラム生成
  - ウェブサイト解析

## 未実装機能（将来の拡張案）

- [ ] コラム履歴保存機能
- [ ] コラムテンプレート機能
- [ ] 複数のAIモデル選択
- [ ] 画像生成・挿入機能
- [ ] チーム共有機能
- [ ] CSVエクスポート
- [ ] WordPress連携
- [ ] 定期的なコラム生成スケジュール

## 推奨される次のステップ

1. **Claude APIキーの設定**
   - `.dev.vars`ファイルに実際のClaude APIキーを設定
   - Anthropicのウェブサイトでアカウント作成・APIキー取得

2. **本番デプロイ**
   - Cloudflare Pagesにデプロイ
   - カスタムドメインの設定

3. **機能拡張**
   - コラム履歴保存機能の追加
   - お気に入り機能
   - エクスポート形式の追加（Markdown、Word等）

4. **UI改善**
   - ダークモード対応
   - 多言語対応
   - アクセシビリティ向上

## デプロイ状況
- **プラットフォーム**: Cloudflare Pages（予定）
- **現在の状態**: ✅ 開発環境で動作中
- **技術スタック**: Hono + TypeScript + TailwindCSS + Claude API
- **最終更新日**: 2025-10-20

## 注意事項

### APIキーの管理
- **開発環境**: `.dev.vars`ファイルに設定（Gitにコミットしない）
- **本番環境**: `wrangler pages secret put`コマンドで設定

### セキュリティ
- パスワードはSHA-256でハッシュ化（本番環境ではbcryptの使用を推奨）
- セッションは7日間有効
- CORS設定は本番環境で適切に制限すること

### コスト
- Claude API: 使用量に応じた従量課金
- Cloudflare Pages: 無料プラン利用可能
- Cloudflare D1: 無料プラン利用可能（制限あり）

## ライセンス
MIT License

## サポート
問題が発生した場合は、GitHubのIssuesでお知らせください。
