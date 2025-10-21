# AIコラム作成ツール

## プロジェクト概要
- **名前**: AIコラム作成ツール
- **目的**: AI（OpenAI / Claude）を活用してSEO最適化されたコラム記事を自動生成するツール
- **主な機能**:
  - **🎉 AIプロバイダー切り替え機能**
    - **OpenAI（GenSpark経由・デフォルト）** - OpenAI APIを使用
    - **Claude AI（オプション）** - より自然な文章生成
  - テーマ入力による5パターンのタイトル候補生成
  - 選択したタイトルから3000文字程度のコラム自動生成
  - ウェブサイト解析機能（URLを入力してサイトの特徴を反映）
  - リアルタイム編集・プレビュー機能
  - SEO分析（文字数、キーワード密度、メタディスクリプション）
  - HTML・プレーンテキストエクスポート
  - ユーザー認証（ログイン/登録）

## 🆕 最新アップデート（2025-10-21）

### ✅ AI実装の改善

**OpenAI API経由で確実に動作するように実装を改善しました！**

#### **OpenAI（デフォルト）**
- ✅ **安定動作** - エラーなく確実に動作
- ✅ **高品質** - GPT-4oによる日本語生成
- ✅ **OpenAI APIキーが必要** - .dev.varsに設定
- 💰 **従量課金** - $0.03〜0.04 / 1コラム

#### **Claude AI（オプション）**
- 🎯 より自然で高品質な文章
- 🔑 Claude APIキーが必要
- 💰 **従量課金** - $0.03〜0.04 / 1コラム

## 📝 使用開始手順

### 1. OpenAI APIキーの取得（必須）

1. https://platform.openai.com/api-keys にアクセス
2. OpenAIアカウントでログイン（なければ新規作成）
3. 「Create new secret key」をクリック
4. APIキーをコピー

### 2. 環境変数の設定

`.dev.vars`ファイルを編集：

```bash
# AI Provider設定
AI_PROVIDER=genspark

# OpenAI API Key（必須）
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# セッション秘密鍵
SESSION_SECRET=your-secret-key-here-change-in-production
```

### 3. サービス起動

```bash
# ビルド
cd /home/user/webapp && npm run build

# サービス起動
cd /home/user/webapp && pm2 restart webapp

# 動作確認
curl http://localhost:3000/api/health
```

### 4. アプリケーション使用

1. ブラウザでアクセス: https://3000-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai
2. アカウント作成
3. テーマ入力（例: 「畳の張り替え時期の見極め方」）
4. タイトル候補を生成
5. タイトル選択してコラム生成

## 現在完了している機能

✅ **AI統合システム**
- OpenAI API連携（GPT-4o）
- Claude API連携（オプション）
- プロバイダー自動切り替え
- エラーハンドリング強化

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
3. AI（OpenAI/Claude）でタイトル候補を5つ生成
4. ユーザーがタイトルを選択
5. AI（OpenAI/Claude）でコラム全文を生成（3000文字程度）
6. リアルタイムでSEO分析を実施
7. ユーザーが編集・プレビュー
8. エクスポート（コピー or HTMLダウンロード）

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
- **OpenAI GPT-4o（デフォルト）**: 従量課金・高品質
  - タイトル生成
  - コラム生成
  - ウェブサイト解析
- **Claude 3.5 Sonnet（オプション）**: 従量課金・最高品質
  - タイトル生成
  - コラム生成
  - ウェブサイト解析

## AIプロバイダー比較

| 項目 | OpenAI GPT-4o | Claude AI |
|------|---------------|-----------|
| **料金** | 約$0.03〜0.04/コラム | 約$0.03〜0.04/コラム |
| **品質** | 高品質 | 最高品質 |
| **自然さ** | 自然 | より自然 |
| **設定** | APIキー必要 | APIキー必要 |
| **推奨** | 初期運用 | 高品質重視 |

## 💰 コスト試算

| コラム本数 | 月間コスト（概算） |
|-----------|------------------|
| 100本 | 約$3〜4 (約450〜600円) |
| 500本 | 約$15〜20 (約2,250〜3,000円) |
| 1000本 | 約$30〜40 (約4,500〜6,000円) |
| 5000本 | 約$150〜200 (約22,500〜30,000円) |

**推奨戦略**: 
1. OpenAI APIで開始（安定・高品質）
2. 必要に応じてClaude AIに切り替え
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
│       ├── ai-provider.ts # AI統一インターフェース
│       ├── genspark-ai.ts # OpenAI実装
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

## トラブルシューティング

### Q: 「OpenAI APIキーが設定されていません」エラー
A: `.dev.vars`ファイルに有効なOpenAI APIキーを設定してください。

### Q: タイトル生成やコラム生成でエラーが出る
A: 以下を確認してください：
1. OpenAI APIキーが正しく設定されているか
2. OpenAIアカウントに十分なクレジットがあるか
3. サービスが正常に起動しているか（`pm2 logs webapp`）

### Q: Claude AIに切り替えたい
A: `.dev.vars`で以下のように変更：
```bash
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-claude-api-key-here
```

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

npx wrangler pages secret put OPENAI_API_KEY --project-name webapp
# 入力: sk-proj-your-openai-api-key

npx wrangler pages secret put SESSION_SECRET --project-name webapp
# 入力: ランダムな文字列

# Claudeを使う場合のみ
# npx wrangler pages secret put CLAUDE_API_KEY --project-name webapp
# npx wrangler pages secret put AI_PROVIDER --project-name webapp
# 入力: claude

# 5. デプロイ
npm run deploy
```

## デプロイ状況
- **プラットフォーム**: Cloudflare Pages（予定）
- **現在の状態**: ✅ 開発環境で動作中
- **技術スタック**: Hono + TypeScript + TailwindCSS + OpenAI / Claude AI
- **AI Provider**: OpenAI GPT-4o（デフォルト）/ Claude AI（オプション）
- **最終更新日**: 2025-10-21

## 注意事項

### APIキーの管理
- **OpenAI API**: 
  - 開発環境: `.dev.vars`ファイルに設定（Gitにコミットしない）
  - 本番環境: `wrangler pages secret put`コマンドで設定
- **Claude API**: 
  - 開発環境: `.dev.vars`ファイルに設定（Gitにコミットしない）
  - 本番環境: `wrangler pages secret put`コマンドで設定

### セキュリティ
- パスワードはSHA-256でハッシュ化（本番環境ではbcryptの使用を推奨）
- セッションは7日間有効
- CORS設定は本番環境で適切に制限すること
- APIキーは絶対に公開しないこと

### コスト
- **OpenAI API**: 使用量に応じた従量課金
- **Claude API**: 使用量に応じた従量課金
- **Cloudflare Pages**: 無料プラン利用可能
- **Cloudflare D1**: 無料プラン利用可能（制限あり）

## よくある質問

### Q: OpenAI APIとClaude APIの違いは？
A: どちらも高品質なコンテンツを生成します。Claude AIはより自然で高品質な文章を生成しますが、コスト的にはほぼ同じです。

### Q: AIプロバイダーの切り替えは簡単ですか？
A: はい、`.dev.vars`ファイルの`AI_PROVIDER`を`genspark`または`claude`に変更するだけです。コードの変更は不要です。

### Q: OpenAI APIキーはどこで取得できますか？
A: https://platform.openai.com/api-keys で取得できます。クレジットカードの登録が必要です。

### Q: エラーが出たらどうすればいいですか？
A: `pm2 logs webapp --nostream`でログを確認し、エラーメッセージを確認してください。APIキーの設定ミスが最も一般的です。

## ライセンス
MIT License

## サポート
問題が発生した場合は、GitHubのIssuesでお知らせください。
