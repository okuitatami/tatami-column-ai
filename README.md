# AIコラム作成ツール

## プロジェクト概要
- **名前**: AIコラム作成ツール
- **目的**: AI（GenSpark / Claude）を活用してSEO最適化されたコラム記事を自動生成するツール
- **主な機能**:
  - **🎉 AIプロバイダー切り替え機能（NEW!）**
    - GenSpark AI（無料・デフォルト）
    - Claude AI（有料・高品質）
  - テーマ入力による5パターンのタイトル候補生成
  - 選択したタイトルから3000文字程度のコラム自動生成
  - ウェブサイト解析機能（URLを入力してサイトの特徴を反映）
  - リアルタイム編集・プレビュー機能
  - SEO分析（文字数、キーワード密度、メタディスクリプション）
  - HTML・プレーンテキストエクスポート
  - ユーザー認証（ログイン/登録）

## 🆕 最新アップデート（2025-10-21）

### ✅ AIプロバイダーハイブリッド対応

**GenSpark AI と Claude AI の両方に対応しました！**

#### **GenSpark AI（デフォルト）**
- ✅ **完全無料**
- ✅ 無制限にコラム生成可能
- ✅ GenSparkサブスクリプションに含まれる
- ✅ 高品質な日本語生成
- ✅ APIキー不要

#### **Claude AI（オプション）**
- 💰 従量課金制（$0.03〜0.04 / 1コラム）
- 🎯 より自然で高品質な文章
- 🔑 Claude APIキーが必要
- 📊 1000本: 約$30〜40 (約4,500〜6,000円)

#### **切り替え方法**

**方法1: 環境変数で切り替え（推奨）**

`.dev.vars`ファイルを編集：
```bash
# GenSpark AI使用（無料・デフォルト）
AI_PROVIDER=genspark

# Claude AI使用（有料・高品質）
# AI_PROVIDER=claude
# CLAUDE_API_KEY=sk-ant-your-api-key-here
```

**方法2: 本番環境での切り替え**

```bash
# GenSpark AIに設定（デフォルト）
npx wrangler pages secret put AI_PROVIDER --project-name webapp
# 入力: genspark

# Claude AIに切り替え
npx wrangler pages secret put AI_PROVIDER --project-name webapp
# 入力: claude

# Claude APIキーも設定
npx wrangler pages secret put CLAUDE_API_KEY --project-name webapp
# 入力: sk-ant-your-api-key-here
```

## 現在完了している機能

✅ **AIハイブリッドシステム（NEW!）**
- GenSpark AI連携（無料）
- Claude AI連携（有料・オプション）
- プロバイダー自動切り替え
- UI上でAIモデル表示

✅ **認証システム**
- ユーザー登録・ログイン機能
- セッション管理（7日間有効）
- パスワードハッシュ化（SHA-256）

✅ **AI生成機能**
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
- AIモデル表示バッジ
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
3. AI（GenSpark/Claude）でタイトル候補を5つ生成
4. ユーザーがタイトルを選択
5. AI（GenSpark/Claude）でコラム全文を生成（3000文字程度）
6. リアルタイムでSEO分析を実施
7. ユーザーが編集・プレビュー
8. エクスポート（コピー or HTMLダウンロード）

## 使い方

### 1. 初回セットアップ

```bash
# 依存関係のインストール（済み）
npm install

# 環境変数の設定
# .dev.vars ファイルを編集
# デフォルトはGenSpark AI（無料）なので何も設定不要
# Claudeを使う場合のみAPIキーを設定
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
   - 右上のバッジで使用中のAIモデルを確認

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
npx wrangler pages secret put AI_PROVIDER --project-name webapp
# 入力: genspark (デフォルト)

npx wrangler pages secret put SESSION_SECRET --project-name webapp
# 入力: ランダムな文字列

# Claudeを使う場合のみ
# npx wrangler pages secret put CLAUDE_API_KEY --project-name webapp
# npx wrangler pages secret put AI_PROVIDER --project-name webapp
# 入力: claude

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
- **GenSpark AI（デフォルト）**: 無料・高品質
  - タイトル生成
  - コラム生成
  - ウェブサイト解析
- **Claude 3.5 Sonnet（オプション）**: 従量課金・最高品質
  - タイトル生成
  - コラム生成
  - ウェブサイト解析

## AIプロバイダー比較

| 項目 | GenSpark AI | Claude AI |
|------|-------------|-----------|
| **料金** | 完全無料 | 約$0.03〜0.04/コラム |
| **制限** | 無制限 | 従量課金 |
| **品質** | 高品質 | 最高品質 |
| **自然さ** | 自然 | より自然 |
| **設定** | 不要 | APIキー必要 |
| **推奨** | 初期運用 | 商用・高品質ニーズ |

## 💰 コスト試算（Claude使用時）

| コラム本数 | 月間コスト（概算） |
|-----------|------------------|
| 100本 | 約$3〜4 (約450〜600円) |
| 500本 | 約$15〜20 (約2,250〜3,000円) |
| 1000本 | 約$30〜40 (約4,500〜6,000円) |
| 5000本 | 約$150〜200 (約22,500〜30,000円) |

**推奨戦略**: 
1. 初期はGenSpark AI（無料）で運用
2. ユーザー増加後にClaude AIに切り替え
3. 両方を併用して比較テスト

## プロジェクト構造

```
webapp/
├── src/
│   ├── index.tsx          # メインアプリケーション
│   ├── types.ts           # TypeScript型定義
│   ├── routes/
│   │   ├── auth.ts        # 認証API
│   │   └── column.ts      # コラム生成API
│   └── utils/
│       ├── ai-provider.ts # AI統一インターフェース（NEW!）
│       ├── genspark-ai.ts # GenSpark AI実装（NEW!）
│       ├── claude.ts      # Claude API実装
│       ├── auth.ts        # 認証ユーティリティ
│       ├── db.ts          # データベース操作
│       └── seo.ts         # SEO分析
├── public/static/
│   ├── app.js            # フロントエンドJavaScript
│   └── style.css         # カスタムスタイル
├── migrations/
│   └── 0001_initial_schema.sql
├── .dev.vars             # 環境変数（ローカル）
├── ecosystem.config.cjs   # PM2設定
├── wrangler.jsonc        # Cloudflare設定
└── README.md             # ドキュメント
```

## 未実装機能（将来の拡張案）

- [ ] コラム履歴保存機能
- [ ] コラムテンプレート機能
- [ ] UIでのAIモデル選択機能
- [ ] 画像生成・挿入機能
- [ ] チーム共有機能
- [ ] CSVエクスポート
- [ ] WordPress連携
- [ ] 定期的なコラム生成スケジュール

## 推奨される次のステップ

1. **GenSpark AIで運用開始（推奨）**
   - 追加設定不要で即利用可能
   - 完全無料・無制限
   - 高品質なコンテンツ生成

2. **必要に応じてClaude AIに切り替え**
   - ユーザーが増えた後
   - より高品質が必要になった時
   - 環境変数1行変更のみ

3. **本番デプロイ**
   - Cloudflare Pagesにデプロイ
   - カスタムドメインの設定

4. **機能拡張**
   - コラム履歴保存機能の追加
   - お気に入り機能
   - エクスポート形式の追加（Markdown、Word等）

## デプロイ状況
- **プラットフォーム**: Cloudflare Pages（予定）
- **現在の状態**: ✅ 開発環境で動作中
- **技術スタック**: Hono + TypeScript + TailwindCSS + GenSpark AI / Claude AI
- **AI Provider**: GenSpark AI（デフォルト）/ Claude AI（オプション）
- **最終更新日**: 2025-10-21

## 注意事項

### AIプロバイダーの選択
- **デフォルト**: GenSpark AI（無料）
- **切り替え**: `.dev.vars`の`AI_PROVIDER`を変更
- **本番環境**: `wrangler pages secret put`で設定

### APIキーの管理
- **GenSpark AI**: APIキー不要
- **Claude AI**: 
  - 開発環境: `.dev.vars`ファイルに設定（Gitにコミットしない）
  - 本番環境: `wrangler pages secret put`コマンドで設定

### セキュリティ
- パスワードはSHA-256でハッシュ化（本番環境ではbcryptの使用を推奨）
- セッションは7日間有効
- CORS設定は本番環境で適切に制限すること

### コスト
- **GenSpark AI**: 完全無料
- **Claude AI**: 使用量に応じた従量課金
- **Cloudflare Pages**: 無料プラン利用可能
- **Cloudflare D1**: 無料プラン利用可能（制限あり）

## よくある質問

### Q: GenSpark AIとClaude AIの違いは？
A: GenSpark AIは無料で無制限に使用可能です。Claude AIはより自然で高品質な文章を生成しますが、従量課金制です。初期運用はGenSpark AIで、ユーザー増加後にClaude AIへの切り替えを推奨します。

### Q: AIプロバイダーの切り替えは簡単ですか？
A: はい、`.dev.vars`ファイルの`AI_PROVIDER`を`genspark`または`claude`に変更するだけです。コードの変更は不要です。

### Q: 両方のAIを同時に使えますか？
A: 現在は環境変数で一つのプロバイダーを選択する仕様です。将来的にUIで選択できる機能を追加予定です。

### Q: GenSpark AIの品質は十分ですか？
A: はい、GenSpark AIは高品質な日本語コンテンツを生成します。多くのユースケースで十分な品質です。

## ライセンス
MIT License

## サポート
問題が発生した場合は、GitHubのIssuesでお知らせください。
