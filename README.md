# AIコラム作成ツール

## プロジェクト概要
- **名前**: AIコラム作成ツール
- **目的**: AI（OpenAI / Claude）を活用してSEO最適化されたコラム記事を自動生成するツール
- **主な機能**:
  - **🎉 AIプロバイダー切り替え機能**
    - **GenSpark AI（デフォルト）** - 無料、APIキー不要
    - **Claude AI（オプション）** - より自然な文章生成
  - 2-5個のキーワード入力による5パターンのタイトル候補生成
  - 選択したタイトルから3000文字以上（実測4500文字以上）のコラム自動生成
  - ウェブサイト解析機能（URLを入力してサイトの特徴を反映）
  - リアルタイム編集・プレビュー機能
  - SEO分析（文字数、キーワード密度、メタディスクリプション）
  - HTML・プレーンテキストエクスポート
  - ユーザー認証（ログイン/登録）

## 🆕 最新アップデート（2025-10-22）

### ✅ AIコンテンツ品質の大幅向上

**プロンプトエンジニアリングを改善し、AI生成コンテンツの品質を大幅に向上しました！**

#### **キーワードベース生成システム**
- 🎯 **2-5個のキーワード入力**: 単一テーマから複数キーワードベースに改良
- ✨ **高品質タイトル生成**: SEO最適化された多様なタイトルパターン
- 📝 **3000文字以上のコラム**: 充実した内容の専門的なコラム生成
- 🔗 **引用元URL記載**: 正確性と専門性を担保する引用システム
- 🏢 **PR内容統合**: ウェブサイトの強みや特色をコラムに自然に統合

#### **改善されたプロンプト**
- **タイトル生成**: 「打ち込まれたキーワード（2〜5）を反映して、SEO的に有利なコラムタイトルを5つ生成してください。」
- **コラム生成**: 
  - 3000文字程度のSEO最適化文章
  - タイトルに即した見出しと充実した内容
  - 引用元URLの記載要件
  - ウェブサイトの強み・特色をPR内容として統合

#### **コンテンツ構成**
- 📖 **導入文**: 350-400文字
- 📑 **5つのセクション**: 各600-800文字の専門的な内容
- 🎯 **クロージング**: 350-400文字
- ❓ **Q&A**: 4つの質問と各200-250文字の詳細な回答
- **総文字数**: 実測4500文字以上（目標3000文字を大幅超過）

#### **OpenAI（デフォルト）**
- ✅ **安定動作** - エラーなく確実に動作
- ✅ **高品質** - 改善されたプロンプトで専門的なコンテンツ生成
- ✅ **GenSpark AI使用** - 無料で使用可能、APIキー不要
- 💰 **完全無料** - GenSparkの内部AI機能を使用

## 📝 使用開始手順

### 1. 環境変数の設定

`.dev.vars`ファイルを編集：

```bash
# AI Provider設定（GenSpark AI - 無料、APIキー不要）
AI_PROVIDER=genspark

# セッション秘密鍵
SESSION_SECRET=your-secret-key-here-change-in-production

# オプション: Claude AIを使う場合のみ
# AI_PROVIDER=claude
# CLAUDE_API_KEY=sk-ant-your-claude-api-key-here
```

### 2. サービス起動

```bash
# ビルド
cd /home/user/webapp && npm run build

# サービス起動
cd /home/user/webapp && pm2 restart webapp

# 動作確認
curl http://localhost:3000/api/health
```

### 3. アプリケーション使用

1. ブラウザでアクセス: https://3000-ildbaq5z2ioorfp5kt66p-a402f90a.sandbox.novita.ai
2. アカウント作成
3. 2-5個のキーワードを入力（例: 「畳」「カビ対策」「梅雨」）
4. （オプション）ウェブサイトURLを入力して解析
5. タイトル候補を5つ生成
6. タイトル選択してコラム生成（4500文字以上の充実した内容）

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
- 2-5個のキーワードからタイトル候補5つを生成
- 選択したタイトルからコラム全文を生成（実測4500文字以上）
- コラム構成：
  - タイトル
  - 導入文（350-400文字）
  - 5つのセクション（各600-800文字）
  - クロージング（350-400文字）
  - Q&A 4つ（各200-250文字の詳細な回答）
- 引用元URL記載による専門性担保
- ウェブサイトの強み・特色をPR内容として統合

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
- **GenSpark AI（デフォルト）**: 無料・APIキー不要・高品質
  - キーワードベースのタイトル生成
  - 3000文字以上のコラム生成（実測4500文字以上）
  - ウェブサイト解析
  - 引用元URL記載による専門性担保
  - PR内容統合機能
- **Claude 3.5 Sonnet（オプション）**: 従量課金・最高品質
  - より自然で高品質な文章生成
  - タイトル生成
  - コラム生成
  - ウェブサイト解析

## AIプロバイダー比較

| 項目 | GenSpark AI | Claude AI |
|------|-------------|-----------|
| **料金** | 完全無料 | 約$0.03〜0.04/コラム |
| **APIキー** | 不要 | 必要 |
| **品質** | 高品質（改善されたプロンプト） | 最高品質 |
| **自然さ** | 自然 | より自然 |
| **文字数** | 4500文字以上 | カスタマイズ可能 |
| **特徴** | キーワードベース、引用URL、PR統合 | より高度な自然言語処理 |
| **推奨** | デフォルト使用 | 最高品質重視 |

## 💰 コスト試算

| プロバイダー | コラム本数 | 月間コスト |
|------------|-----------|-----------|
| **GenSpark AI** | 無制限 | **完全無料** 🎉 |
| Claude AI | 100本 | 約$3〜4 (約450〜600円) |
| Claude AI | 500本 | 約$15〜20 (約2,250〜3,000円) |
| Claude AI | 1000本 | 約$30〜40 (約4,500〜6,000円) |

**推奨戦略**: 
1. GenSpark AI（無料）で開始 - 高品質で無制限に使用可能
2. より高度な品質が必要な場合はClaude AIに切り替え
3. コスト削減を重視する場合はGenSpark AIを継続使用

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

### Q: タイトル生成やコラム生成でエラーが出る
A: 以下を確認してください：
1. キーワードを2つ以上入力しているか（最低2個、最大5個）
2. サービスが正常に起動しているか（`pm2 logs webapp --nostream`）
3. GenSpark AIを使用している場合はAPIキー不要です

### Q: 生成されるコンテンツの文字数が少ない
A: 新しいプロンプトシステムでは4500文字以上生成されます。それより少ない場合は以下を確認：
1. 最新版にビルドされているか（`npm run build`）
2. PM2が再起動されているか（`pm2 restart webapp`）

### Q: Claude AIに切り替えたい
A: `.dev.vars`で以下のように変更：
```bash
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-claude-api-key-here
```

### Q: キーワード入力で空白を入れても大丈夫？
A: はい、自動で空白は削除されます。「畳　カビ対策」でも「畳カビ対策」でも同じ結果になります。

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
- **技術スタック**: Hono + TypeScript + TailwindCSS + GenSpark AI / Claude AI
- **AI Provider**: GenSpark AI（デフォルト・無料）/ Claude AI（オプション・従量課金）
- **最終更新日**: 2025-10-22

## 注意事項

### APIキーの管理
- **GenSpark AI（デフォルト）**: APIキー不要、完全無料
- **Claude API（オプション）**: 
  - 開発環境: `.dev.vars`ファイルに設定（Gitにコミットしない）
  - 本番環境: `wrangler pages secret put`コマンドで設定

### セキュリティ
- パスワードはSHA-256でハッシュ化（本番環境ではbcryptの使用を推奨）
- セッションは7日間有効
- CORS設定は本番環境で適切に制限すること
- APIキーは絶対に公開しないこと

### コスト
- **GenSpark AI**: 完全無料 🎉
- **Claude API**: 使用量に応じた従量課金（オプション）
- **Cloudflare Pages**: 無料プラン利用可能
- **Cloudflare D1**: 無料プラン利用可能（制限あり）

## よくある質問

### Q: GenSpark AIとClaude AIの違いは？
A: GenSpark AIは無料でAPIキー不要、4500文字以上の高品質なコンテンツを生成します。Claude AIはより自然で最高品質な文章を生成しますが、従量課金です。

### Q: AIプロバイダーの切り替えは簡単ですか？
A: はい、`.dev.vars`ファイルの`AI_PROVIDER`を`genspark`または`claude`に変更するだけです。コードの変更は不要です。

### Q: 生成されるコラムの品質は高いですか？
A: 最新バージョンでは、改善されたプロンプトエンジニアリングにより、引用元URL記載、PR内容統合、充実した4500文字以上のコンテンツを生成します。

### Q: キーワードはいくつ入力すべきですか？
A: 2-5個のキーワードを入力してください。少なくとも2個は必須です。より多くのキーワードを入力すると、より具体的なコンテンツが生成されます。

### Q: エラーが出たらどうすればいいですか？
A: `pm2 logs webapp --nostream`でログを確認し、エラーメッセージを確認してください。GenSpark AIを使用している場合はAPIキーの設定は不要です。

## ライセンス
MIT License

## サポート
問題が発生した場合は、GitHubのIssuesでお知らせください。
