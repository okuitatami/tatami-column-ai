import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import auth from './routes/auth';
import column from './routes/column';
import aiLearning from './routes/ai-learning';
import diagnosis from './routes/diagnosis';

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
app.route('/api/ai-learning', aiLearning);
app.route('/api/diagnosis', diagnosis);

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 診断チャート設定ページ
app.get('/diagnosis-settings', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>診断チャート設定</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-cog text-3xl mr-3"></i>
                    <h1 class="text-2xl font-bold">診断チャート設定</h1>
                </div>
                <a href="/" class="text-white hover:text-gray-200 transition-colors">
                    <i class="fas fa-home mr-2"></i>ホームに戻る
                </a>
            </div>
        </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-sliders-h mr-2 text-blue-600"></i>
                    診断チャートの設定
                </h2>
                <p class="text-gray-600">
                    畳診断チャートの動作と表示内容をカスタマイズできます。
                </p>
            </div>

            <!-- 診断傾向設定 -->
            <div class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-bullseye mr-2 text-green-600"></i>
                    進めたい診断傾向
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                    診断結果で優先的に推奨する素材を選択してください。
                </p>
                
                <div class="space-y-3">
                    <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                        <input type="radio" name="preferredMaterial" value="natural" class="w-5 h-5 text-green-600">
                        <div class="ml-4">
                            <div class="font-bold text-gray-800">天然素材（い草）を優先</div>
                            <div class="text-sm text-gray-600">天然い草の香りや質感を重視したお客様向け</div>
                        </div>
                    </label>
                    
                    <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <input type="radio" name="preferredMaterial" value="chemical" class="w-5 h-5 text-blue-600">
                        <div class="ml-4">
                            <div class="font-bold text-gray-800">化学表（和紙・ポリプロピレン）を優先</div>
                            <div class="text-sm text-gray-600">耐久性・お手入れのしやすさを重視したお客様向け</div>
                        </div>
                    </label>
                    
                    <label class="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                        <input type="radio" name="preferredMaterial" value="both" class="w-5 h-5 text-purple-600" checked>
                        <div class="ml-4">
                            <div class="font-bold text-gray-800">どちらもバランスよく提案</div>
                            <div class="text-sm text-gray-600">お客様の回答内容に応じて最適な素材を提案</div>
                        </div>
                    </label>
                </div>
            </div>

            <!-- お問い合わせURL設定 -->
            <div class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-link mr-2 text-orange-600"></i>
                    お問い合わせページURL
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                    診断結果画面に表示される「お問い合わせページはこちら」ボタンのリンク先を設定してください。
                </p>
                
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i class="fas fa-globe text-gray-400"></i>
                    </div>
                    <input 
                        type="url" 
                        id="inquiryUrl" 
                        placeholder="https://example.com/contact" 
                        class="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                </div>
                <p class="text-xs text-gray-500 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    入力しない場合は、お問い合わせボタンは表示されません
                </p>
            </div>

            <!-- プレビューと保存 -->
            <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                <button 
                    onclick="previewDiagnosis()" 
                    class="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                    <i class="fas fa-eye mr-2"></i>診断チャートをプレビュー
                </button>
                
                <button 
                    id="saveBtn"
                    onclick="saveSettings()" 
                    class="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                >
                    <i class="fas fa-save mr-2"></i>設定を保存
                </button>
            </div>
        </div>

        <!-- 設定済み価格について -->
        <div class="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 class="text-lg font-bold text-blue-900 mb-3">
                <i class="fas fa-yen-sign mr-2"></i>
                概算費用について
            </h3>
            <p class="text-blue-800 mb-4">
                診断結果に表示される概算費用は、以下の標準価格に基づいて自動計算されます：
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white rounded-lg p-4 border border-blue-200">
                    <div class="text-sm text-gray-600 mb-1">裏返し</div>
                    <div class="text-xl font-bold text-blue-600">5,000〜8,000円</div>
                    <div class="text-xs text-gray-500 mt-1">1畳あたり</div>
                </div>
                <div class="bg-white rounded-lg p-4 border border-blue-200">
                    <div class="text-sm text-gray-600 mb-1">表替え</div>
                    <div class="text-xl font-bold text-blue-600">8,000〜15,000円</div>
                    <div class="text-xs text-gray-500 mt-1">1畳あたり</div>
                </div>
                <div class="bg-white rounded-lg p-4 border border-blue-200">
                    <div class="text-sm text-gray-600 mb-1">新調</div>
                    <div class="text-xl font-bold text-blue-600">15,000〜25,000円</div>
                    <div class="text-xs text-gray-500 mt-1">1畳あたり</div>
                </div>
            </div>
            <p class="text-sm text-blue-700 mt-4">
                <i class="fas fa-info-circle mr-1"></i>
                価格は畳表・畳床の品質により変動することが診断結果画面に自動で表示されます。
            </p>
        </div>
    </main>

    <script src="/static/app-diagnosis-settings.js"></script>
</body>
</html>
  `);
});

// 診断チャートページ
app.get('/diagnosis', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>畳診断チャート</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-center">
                <i class="fas fa-clipboard-check text-3xl mr-3"></i>
                <h1 class="text-2xl font-bold">畳診断チャート</h1>
            </div>
        </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="container mx-auto px-4 py-8 max-w-3xl">
        <!-- プログレスバー -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">診断進捗</span>
                <span class="text-sm font-medium text-gray-700" id="progressText">0 / 7</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
                <div id="progressBar" class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>

        <!-- 質問コンテナ -->
        <div id="questionContainer"></div>

        <!-- ナビゲーションボタン -->
        <div id="navigationButtons" class="flex space-x-4 mt-6">
            <button id="prevBtn" onclick="prevQuestion()" class="hidden flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all">
                <i class="fas fa-arrow-left mr-2"></i>前へ
            </button>
            <button id="nextBtn" onclick="nextQuestion()" disabled class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                次へ<i class="fas fa-arrow-right ml-2"></i>
            </button>
            <button id="submitBtn" onclick="submitDiagnosis()" class="hidden flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all">
                <i class="fas fa-check-circle mr-2"></i>診断する
            </button>
        </div>

        <!-- 結果コンテナ -->
        <div id="resultContainer" class="hidden"></div>
    </main>

    <script src="/static/app-diagnosis.js"></script>
</body>
</html>
  `);
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
                        <a href="/diagnosis-settings" class="text-white hover:text-gray-200 transition-colors" title="診断チャート設定">
                            <i class="fas fa-cog text-xl"></i>
                        </a>
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
                </div>
                
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            <i class="fas fa-tags mr-2"></i>キーワード入力（2〜4個）
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
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            <i class="fas fa-map-marker-alt mr-2"></i>地域入力（1〜3個、任意）
                        </label>
                        <p class="mb-4 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                            <i class="fas fa-info-circle mr-1"></i>
                            地域を指定すると、地域SEOに最適化されたコンテンツを生成します。（例: 東京都、渋谷区、新宿）
                        </p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <input type="text" id="region1" placeholder="地域1（任意）例: 東京都" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            </div>
                            <div>
                                <input type="text" id="region2" placeholder="地域2（任意）例: 渋谷区" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            </div>
                            <div>
                                <input type="text" id="region3" placeholder="地域3（任意）例: 新宿" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">
                            <i class="fas fa-users mr-2"></i>ターゲット層（任意）
                        </label>
                        <p class="mb-4 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                            <i class="fas fa-info-circle mr-1"></i>
                            ターゲット層を選択すると、世代に合わせた言葉遣いや漢字レベルに調整されます。選択しない場合は標準的な文体になります。
                        </p>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                <input type="radio" name="targetAudience" value="" class="mr-2" checked>
                                <span class="text-sm font-medium">選択しない</span>
                            </label>
                            <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                <input type="radio" name="targetAudience" value="若者世代" class="mr-2">
                                <span class="text-sm font-medium">若者世代<br><span class="text-xs text-gray-500">(10-20代)</span></span>
                            </label>
                            <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                <input type="radio" name="targetAudience" value="青年世代" class="mr-2">
                                <span class="text-sm font-medium">青年世代<br><span class="text-xs text-gray-500">(30-40代)</span></span>
                            </label>
                            <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                <input type="radio" name="targetAudience" value="引退世代" class="mr-2">
                                <span class="text-sm font-medium">引退世代<br><span class="text-xs text-gray-500">(50-60代)</span></span>
                            </label>
                            <label class="flex items-center justify-center px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                                <input type="radio" name="targetAudience" value="高齢世代" class="mr-2">
                                <span class="text-sm font-medium">高齢世代<br><span class="text-xs text-gray-500">(70代以降)</span></span>
                            </label>
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
                            <button onclick="evaluateColumn(true)" class="btn bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700" title="このコラムは良質です">
                                <i class="fas fa-thumbs-up mr-2"></i>承認
                            </button>
                            <button onclick="evaluateColumn(false)" class="btn bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700" title="改善が必要です">
                                <i class="fas fa-thumbs-down mr-2"></i>改善必要
                            </button>
                            <button onclick="copyToClipboard()" class="btn bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                                <i class="fas fa-copy mr-2"></i>コピー
                            </button>
                            <button onclick="exportHTML()" class="btn bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700">
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
