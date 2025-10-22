import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import auth from './routes/auth';
import column from './routes/column';

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use('/api/*', cors({
  origin: '*',
  credentials: true,
}));

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }));

// APIルート
app.route('/api/auth', auth);
app.route('/api/column', column);

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// メインページ
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIコラム作成ツール</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .btn {
            transition: all 0.2s;
        }
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-pen-fancy text-3xl"></i>
                    <h1 class="text-2xl font-bold">AIコラム作成ツール</h1>
                </div>
                <div id="userMenu" class="hidden">
                    <div class="flex items-center space-x-4">
                        <span id="username" class="font-medium"></span>
                        <button onclick="logout()" class="btn bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100">
                            <i class="fas fa-sign-out-alt mr-2"></i>ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="container mx-auto px-4 py-8">
        <!-- ログイン/登録画面 -->
        <div id="authScreen" class="max-w-md mx-auto">
            <div class="bg-white rounded-xl shadow-lg p-8 card">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
                    <i class="fas fa-user-circle mr-2"></i>
                    <span id="authTitle">ログイン</span>
                </h2>
                
                <form id="authForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">ユーザー名</label>
                        <input type="text" id="authUsername" required 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                        <input type="password" id="authPassword" required 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div id="emailField" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">メールアドレス（任意）</label>
                        <input type="email" id="authEmail" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div id="authError" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"></div>
                    
                    <button type="submit" class="btn w-full gradient-bg text-white py-3 rounded-lg font-medium">
                        <span id="authButtonText">ログイン</span>
                    </button>
                </form>
                
                <div class="mt-6 text-center">
                    <button onclick="toggleAuthMode()" class="text-purple-600 hover:text-purple-800 font-medium">
                        <span id="authToggleText">アカウントをお持ちでない方はこちら</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- メイン画面 -->
        <div id="mainScreen" class="hidden">
            <!-- ステップ表示 -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-8">
                        <div class="flex items-center" id="step1">
                            <div class="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">1</div>
                            <span class="ml-3 font-medium">テーマ入力</span>
                        </div>
                        <div class="flex items-center opacity-50" id="step2">
                            <div class="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">2</div>
                            <span class="ml-3 font-medium">タイトル選択</span>
                        </div>
                        <div class="flex items-center opacity-50" id="step3">
                            <div class="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">3</div>
                            <span class="ml-3 font-medium">コラム編集</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ステップ1: テーマ入力 -->
            <div id="themeStep" class="bg-white rounded-xl shadow-lg p-8 card">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
                        コラムのテーマを入力
                    </h2>
                    <div id="aiProviderBadge" class="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <i class="fas fa-robot mr-2"></i>
                        <span id="currentProvider">GenSpark AI</span>
                    </div>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            <i class="fas fa-tags mr-2"></i>キーワード入力（2〜5個）
                        </label>
                        <p class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                            <i class="fas fa-info-circle mr-1"></i>
                            各欄に重要なキーワードを1つずつ入力してください。これらのキーワードを基に専門的なコラムを生成します。
                        </p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <input type="text" id="keyword1" placeholder="キーワード1（必須）例: 畳" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            </div>
                            <div>
                                <input type="text" id="keyword2" placeholder="キーワード2（必須）例: カビ対策" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            </div>
                            <div>
                                <input type="text" id="keyword3" placeholder="キーワード3（任意）例: 梅雨" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            </div>
                            <div>
                                <input type="text" id="keyword4" placeholder="キーワード4（任意）例: 予防" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            </div>
                            <div class="md:col-span-2">
                                <input type="text" id="keyword5" placeholder="キーワード5（任意）例: メンテナンス" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            ウェブサイトURL（任意）
                            <span class="text-xs text-gray-500 ml-2">※サイトの特徴を反映します</span>
                        </label>
                        <div class="flex space-x-2">
                            <input type="url" id="websiteUrl" placeholder="https://example.com" 
                                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <button onclick="analyzeWebsite()" class="btn bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
                                <i class="fas fa-search mr-2"></i>解析
                            </button>
                        </div>
                        <div id="websiteAnalysisResult" class="hidden mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 class="font-medium text-blue-900 mb-2">
                                <i class="fas fa-check-circle mr-2"></i>解析完了
                            </h4>
                            <div id="websiteAnalysisContent" class="text-sm text-blue-800"></div>
                        </div>
                    </div>
                    
                    <button onclick="generateTitles()" class="btn w-full gradient-bg text-white py-4 rounded-lg font-medium text-lg">
                        <i class="fas fa-magic mr-2"></i>
                        タイトル候補を生成
                    </button>
                </div>
            </div>

            <!-- ステップ2: タイトル選択 -->
            <div id="titleStep" class="hidden bg-white rounded-xl shadow-lg p-8 card">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-list mr-2 text-green-500"></i>
                    タイトルを選択
                </h2>
                
                <div id="titleList" class="space-y-4 mb-6"></div>
                
                <div class="flex space-x-4">
                    <button onclick="backToTheme()" class="btn flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600">
                        <i class="fas fa-arrow-left mr-2"></i>戻る
                    </button>
                    <button onclick="generateColumnFromTitle()" id="generateColumnBtn" disabled 
                        class="btn flex-1 gradient-bg text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-file-alt mr-2"></i>コラムを生成
                    </button>
                </div>
            </div>

            <!-- ステップ3: コラム編集 -->
            <div id="columnStep" class="hidden space-y-6">
                <!-- ツールバー -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center space-x-4">
                            <button onclick="showEditView()" id="editViewBtn" class="btn bg-purple-600 text-white px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-edit mr-2"></i>編集
                            </button>
                            <button onclick="showPreviewView()" id="previewViewBtn" class="btn bg-gray-500 text-white px-4 py-2 rounded-lg font-medium">
                                <i class="fas fa-eye mr-2"></i>プレビュー
                            </button>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <button onclick="copyToClipboard()" class="btn bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                                <i class="fas fa-copy mr-2"></i>コピー
                            </button>
                            <button onclick="exportHTML()" class="btn bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">
                                <i class="fas fa-download mr-2"></i>HTML出力
                            </button>
                            <button onclick="backToTitles()" class="btn bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600">
                                <i class="fas fa-arrow-left mr-2"></i>戻る
                            </button>
                        </div>
                    </div>
                </div>

                <!-- SEO情報 -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-line mr-2 text-blue-500"></i>SEO分析
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-sm text-gray-600 mb-1">文字数</div>
                            <div class="text-2xl font-bold text-blue-600" id="charCount">0</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-sm text-gray-600 mb-1">SEOスコア</div>
                            <div class="text-2xl font-bold text-green-600" id="seoScore">0</div>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <div class="text-sm text-gray-600 mb-1">キーワード密度</div>
                            <div class="text-2xl font-bold text-purple-600" id="keywordDensity">0%</div>
                        </div>
                        <div class="text-center p-4 bg-yellow-50 rounded-lg">
                            <div class="text-sm text-gray-600 mb-1">推奨キーワード数</div>
                            <div class="text-2xl font-bold text-yellow-600" id="keywordCount">0</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="text-sm font-medium text-gray-700 mb-2">抽出キーワード</div>
                        <div id="extractedKeywords" class="flex flex-wrap gap-2"></div>
                    </div>
                    <div class="mt-4">
                        <div class="text-sm font-medium text-gray-700 mb-2">メタディスクリプション</div>
                        <div id="metaDescription" class="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg"></div>
                    </div>
                </div>

                <!-- 編集ビュー -->
                <div id="editView" class="bg-white rounded-xl shadow-lg p-8">
                    <div id="editContent" class="space-y-6"></div>
                </div>

                <!-- プレビュービュー -->
                <div id="previewView" class="hidden bg-white rounded-xl shadow-lg p-8">
                    <div id="previewContent" class="prose max-w-none"></div>
                </div>
            </div>
        </div>

        <!-- ローディング -->
        <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="loading mx-auto mb-4"></div>
                    <p class="text-lg font-medium text-gray-800" id="loadingText">処理中...</p>
                </div>
            </div>
        </div>
    </main>

    <script src="/static/app.js"></script>
</body>
</html>
  `);
});

export default app;
