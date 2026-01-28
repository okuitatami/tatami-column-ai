import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import column from './routes/column-customer';
import priceSettings from './routes/price-settings';
import analytics from './routes/analytics';

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use('/api/*', cors({
  origin: '*',
  credentials: true,
}));

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }));

// アカウント停止チェックミドルウェア
app.use('*', async (c, next) => {
  const accountStatus = c.env.ACCOUNT_STATUS || 'active';
  
  // 静的ファイルはスキップ
  if (c.req.path.startsWith('/static/')) {
    return next();
  }
  
  if (accountStatus === 'disabled') {
    return c.html(getDisabledAccountPage());
  }
  
  return next();
});

// APIルート
app.route('/api/column', column);
app.route('/api/price-settings', priceSettings);
app.route('/api/analytics', analytics);

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 価格設定管理ページ
app.get('/settings', (c) => {
  const companyName = c.env.COMPANY_NAME || '株式会社サンプル';
  return c.html(getPriceSettingsPage(companyName));
});

// 診断チャートページ
app.get('/diagnosis', (c) => {
  const companyName = c.env.COMPANY_NAME || '株式会社サンプル';
  const contactUrl = c.env.CONTACT_URL || '/contact';
  const phoneNumber = c.env.PHONE_NUMBER || '';
  return c.html(getDiagnosisPage(companyName, contactUrl, phoneNumber));
});

// アクセス解析ダッシュボードページ
app.get('/analytics', (c) => {
  const companyName = c.env.COMPANY_NAME || '株式会社サンプル';
  return c.html(getAnalyticsPage(companyName));
});

// メインページ
app.get('/', (c) => {
  const companyName = c.env.COMPANY_NAME || '株式会社サンプル';
  const companyDescription = c.env.COMPANY_DESCRIPTION || '';
  
  return c.html(getMainPage(companyName, companyDescription));
});

export default app;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アカウント停止ページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getDisabledAccountPage() {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ご利用停止中 - AIコラム作成ツール</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
    <div class="max-w-md w-full mx-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div class="mb-6">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">ご利用停止中</h1>
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <p class="text-gray-700 mb-4">
                    お支払いが確認できておりません。<br>
                    ご利用を再開するには、月額料金のお支払いをお願いいたします。
                </p>
                <p class="text-sm text-gray-600">
                    <i class="fas fa-envelope mr-2"></i>
                    お問い合わせ：<a href="mailto:okuitatami@gmail.com" class="text-blue-600 underline">okuitatami@gmail.com</a>
                </p>
            </div>
            <p class="text-xs text-gray-500">
                お支払い確認後、通常1営業日以内にご利用を再開いたします。
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getMainPage(companyName: string, companyDescription: string) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyName} - AIコラム作成ツール</title>
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
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.5);
        }
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-content {
            background-color: #fefefe;
            padding: 0;
            border-radius: 1rem;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-pen-fancy text-3xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">AIコラム作成ツール</h1>
                        <p class="text-sm text-purple-100">${companyName}</p>
                    </div>
                </div>
                <nav class="flex space-x-3">
                    <a href="/" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-home mr-2"></i>ホーム
                    </a>
                    <a href="/diagnosis" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-clipboard-check mr-2"></i>診断チャート
                    </a>
                    <a href="/settings" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-cog mr-2"></i>価格設定
                    </a>
                    <a href="/analytics" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-chart-line mr-2"></i>アクセス解析
                    </a>
                </nav>
            </div>
        </div>
    </header>

    <!-- コンテンツエリア -->
    <div class="container mx-auto px-4 py-8 max-w-5xl">
        <!-- おかえりなさいメッセージ -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6 fade-in">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-home text-purple-600 mr-2"></i>
                        ${companyName}様、おかえりなさい
                    </h2>
                    <p class="text-gray-600">${companyDescription}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-500 mb-1">今月の生成数</p>
                    <p class="text-3xl font-bold text-purple-600" id="monthlyCount">
                        <span class="loading"></span>
                    </p>
                    <p class="text-xs text-gray-400 mt-1">推奨：週2回（月8回）</p>
                </div>
            </div>
        </div>

        <!-- 重要なお知らせ -->
        <div class="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg">
            <div class="flex items-start">
                <i class="fas fa-info-circle text-orange-500 text-xl mr-3 mt-1"></i>
                <div>
                    <p class="font-medium text-orange-800 mb-1">質より量を重視しましょう</p>
                    <p class="text-sm text-orange-700">
                        推奨される使用頻度：<strong>週2回</strong><br>
                        ※量よりも、一つの記事に正確性を持たせ質を向上させましょう。
                    </p>
                </div>
            </div>
        </div>

        <!-- ステップインジケーター -->
        <div class="flex items-center justify-center space-x-4 mb-8">
            <div id="step1Indicator" class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">1</div>
                <span class="ml-2 font-medium text-gray-700">キーワード入力</span>
            </div>
            <div class="w-12 h-1 bg-gray-300"></div>
            <div id="step2Indicator" class="flex items-center opacity-50">
                <div class="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">2</div>
                <span class="ml-2 font-medium text-gray-500">タイトル選択</span>
            </div>
            <div class="w-12 h-1 bg-gray-300"></div>
            <div id="step3Indicator" class="flex items-center opacity-50">
                <div class="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold">3</div>
                <span class="ml-2 font-medium text-gray-500">コラム編集</span>
            </div>
        </div>

        <!-- ステップ1: キーワード入力 -->
        <div id="themeStep" class="fade-in">
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    <i class="fas fa-tags text-purple-600 mr-3"></i>
                    キーワード入力
                </h2>
                <p class="text-gray-600 mb-6">コラムの主題となるキーワードを2〜4個入力してください。</p>
                
                <!-- キーワード選びのヘルプボタン -->
                <button onclick="showKeywordHelp()" class="btn bg-blue-100 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm hover:bg-blue-200">
                    <i class="fas fa-question-circle mr-2"></i>
                    キーワード選びのコツ
                </button>
                
                <div class="space-y-4 mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        <i class="fas fa-tags mr-2"></i>キーワード入力（2〜4個）
                    </label>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" id="keyword1" placeholder="例: 畳" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <input type="text" id="keyword2" placeholder="例: リフォーム" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <input type="text" id="keyword3" placeholder="例: 神戸（任意）" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <input type="text" id="keyword4" placeholder="例: ダニ対策（任意）" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                </div>

                <!-- 地域入力 -->
                <div class="space-y-4 mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        <i class="fas fa-map-marker-alt mr-2"></i>地域情報（任意・最大3つ）
                    </label>
                    <p class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <i class="fas fa-info-circle mr-1"></i>
                        地域を指定すると、地域SEOに最適化されたタイトルとコラムが生成されます。
                    </p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" id="region1" placeholder="例: 神戸市" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <input type="text" id="region2" placeholder="例: 兵庫県（任意）" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <input type="text" id="region3" placeholder="例: 阪神間（任意）" 
                            class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                </div>

                <!-- ターゲット層選択 -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        <i class="fas fa-users mr-2"></i>ターゲット層（任意）
                    </label>
                    <p class="mb-4 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                        <i class="fas fa-info-circle mr-1"></i>
                        ターゲット層を選択すると、世代に合わせた言葉遣いや漢字レベルに調整されます。
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <label class="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                            <input type="radio" name="targetAudience" value="" checked class="mr-2">
                            <span class="text-sm">選択しない</span>
                        </label>
                        <label class="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                            <input type="radio" name="targetAudience" value="若者世代" class="mr-2">
                            <span class="text-sm text-center w-full">若者世代<br><span class="text-xs text-gray-500">(10-20代)</span></span>
                        </label>
                        <label class="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                            <input type="radio" name="targetAudience" value="青年世代" class="mr-2">
                            <span class="text-sm text-center w-full">青年世代<br><span class="text-xs text-gray-500">(30-40代)</span></span>
                        </label>
                        <label class="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                            <input type="radio" name="targetAudience" value="引退世代" class="mr-2">
                            <span class="text-sm text-center w-full">引退世代<br><span class="text-xs text-gray-500">(50-60代)</span></span>
                        </label>
                        <label class="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                            <input type="radio" name="targetAudience" value="高齢世代" class="mr-2">
                            <span class="text-sm text-center w-full">高齢世代<br><span class="text-xs text-gray-500">(70代以降)</span></span>
                        </label>
                    </div>
                </div>

                <button onclick="generateTitles()" 
                    class="btn w-full gradient-bg text-white py-4 rounded-lg font-bold text-lg mt-8 hover:shadow-xl">
                    <i class="fas fa-magic mr-2"></i>タイトル候補を生成
                </button>
            </div>
        </div>

        <!-- ステップ2: タイトル選択 -->
        <div id="titleStep" class="hidden space-y-6">
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-list-ul text-purple-600 mr-3"></i>
                    タイトル選択
                </h2>
                
                <div id="titleList" class="space-y-4 mb-6"></div>
                
                <div class="flex space-x-4">
                    <button onclick="backToTheme()" class="btn flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600">
                        <i class="fas fa-redo mr-2"></i>最初から作成
                    </button>
                    <button onclick="generateColumnFromTitle()" id="generateColumnBtn" disabled 
                        class="btn flex-1 gradient-bg text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-file-alt mr-2"></i>コラムを生成
                    </button>
                </div>
            </div>
        </div>

        <!-- ステップ3: コラム編集 -->
        <div id="columnStep" class="hidden space-y-6">
            <!-- 校正メッセージ -->
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-4 mt-1"></i>
                    <div>
                        <p class="font-bold text-red-800 text-lg mb-2">⚠️ 重要：必ず校正してください</p>
                        <p class="text-red-700">
                            <strong>このまま投稿はせず、必ず最初から最後まで目を通して校正してください。</strong><br>
                            AIが生成した文章には誤りがある可能性があります。事実確認、表現の適切性、貴社の方針との整合性を必ずご確認ください。
                        </p>
                    </div>
                </div>
            </div>

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
                            <i class="fas fa-redo mr-2"></i>最初から作成
                        </button>
                    </div>
                </div>
            </div>

            <!-- SEO情報 -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-line text-green-600 mr-2"></i>SEO情報
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">文字数</p>
                        <p id="charCount" class="text-2xl font-bold text-blue-600">0</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">見出し数</p>
                        <p id="headingCount" class="text-2xl font-bold text-green-600">0</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Q&A数</p>
                        <p id="qaCount" class="text-2xl font-bold text-purple-600">0</p>
                    </div>
                </div>
            </div>

            <!-- 編集エリア -->
            <div id="editView" class="bg-white rounded-xl shadow-lg p-8">
                <div id="editContent" class="space-y-6"></div>
            </div>

            <!-- プレビューエリア -->
            <div id="previewView" class="hidden bg-white rounded-xl shadow-lg p-8">
                <div id="previewContent" class="prose max-w-none"></div>
            </div>
        </div>

        <!-- 利用規約 -->
        <div class="mt-12 mb-8">
            <div class="bg-white rounded-xl shadow-lg p-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-file-contract text-purple-600 mr-2"></i>
                    利用規約
                </h3>
                <div class="prose max-w-none text-sm text-gray-700 space-y-3">
                    <p><strong>本システムのご利用にあたり、以下の規約をご確認ください：</strong></p>
                    
                    <ol class="list-decimal list-inside space-y-2 pl-4">
                        <li><strong>利用目的</strong><br>
                        本システムは貴社のSEO強化のためのコラム作成にのみご使用ください。</li>
                        
                        <li><strong>譲渡・販売の禁止</strong><br>
                        本システムおよび生成されたコンテンツを他社に譲渡、販売することは禁止です。</li>
                        
                        <li><strong>不正利用の禁止</strong><br>
                        本システムを使った再販売、他社へのサービス提供など、本来の目的以外での商業利用は禁止です。<br>
                        <span class="text-green-600">※自社商品・サービスのPRは積極的にご活用ください。</span></li>
                        
                        <li><strong>コンテンツの責任</strong><br>
                        生成されたコラムの内容に誤りがあった場合、その責任は投稿者（貴社）にあります。<br>
                        必ず校正・事実確認を行ってから公開してください。</li>
                        
                        <li><strong>サービスの継続性</strong><br>
                        本システムは告知なく終了する可能性があります。<br>
                        終了時は月額支払いを停止いたします。万一停止されていない場合は下記までお問い合わせください。<br>
                        📧 <a href="mailto:okuitatami@gmail.com" class="text-blue-600 underline">okuitatami@gmail.com</a></li>
                        
                        <li><strong>支払い停止後の利用禁止</strong><br>
                        月額支払いをキャンセルされた後、本システムを継続して使用することは禁止です。</li>
                        
                        <li><strong>著作権</strong><br>
                        生成されたコラムの著作権は貴社に帰属します。自由に編集・公開いただけます。</li>
                        
                        <li><strong>個人情報の取り扱い</strong><br>
                        本システムは個人情報を収集しません。入力されたキーワード等は一時的に処理され、保存されません。</li>
                        
                        <li><strong>システムの保証</strong><br>
                        本システムの動作を保証するものではありません。不具合が発生した場合はお問い合わせください。</li>
                        
                        <li><strong>規約の変更</strong><br>
                        本規約は予告なく変更される場合があります。最新の規約は本ページでご確認ください。</li>
                    </ol>
                    
                    <p class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                        本システムをご利用いただくことで、上記規約に同意したものとみなします。<br>
                        ご不明な点がございましたら、お気軽にお問い合わせください。
                    </p>
                </div>
            </div>
        </div>

        <!-- フッター -->
        <footer class="text-center text-gray-500 text-sm py-6">
            <p>&copy; 2024 ${companyName}. All rights reserved.</p>
            <p class="mt-2">
                お問い合わせ: <a href="mailto:okuitatami@gmail.com" class="text-blue-600 underline">okuitatami@gmail.com</a>
            </p>
        </footer>
    </div>

    <!-- ローディングオーバーレイ -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center" style="z-index: 9999;">
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div class="loading mx-auto mb-4" style="width: 40px; height: 40px; border-width: 4px;"></div>
            <p id="loadingMessage" class="text-gray-700 font-medium">処理中...</p>
        </div>
    </div>

    <!-- 初回チュートリアルモーダル -->
    <div id="tutorialModal" class="modal">
        <div class="modal-content">
            <div class="gradient-bg text-white p-6 rounded-t-xl">
                <h3 class="text-2xl font-bold flex items-center">
                    <i class="fas fa-graduation-cap mr-3"></i>
                    はじめてのご利用ガイド
                </h3>
            </div>
            <div class="p-6 space-y-4">
                <p class="text-gray-700 leading-relaxed">
                    <strong>${companyName}様専用のAIコラム作成ツールへようこそ！</strong><br>
                    このツールは貴社の情報を既に組み込んでおり、簡単に高品質なSEOコラムを生成できます。
                </p>
                
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-bold text-blue-900 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>使い方の流れ
                    </h4>
                    <ol class="list-decimal list-inside space-y-2 text-sm text-gray-700 pl-2">
                        <li><strong>キーワード入力</strong>：コラムの主題となるキーワードを2〜4個入力</li>
                        <li><strong>タイトル選択</strong>：AIが生成した5つのタイトル候補から1つを選択</li>
                        <li><strong>コラム編集</strong>：生成されたコラムを確認・編集して完成！</li>
                    </ol>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-bold text-green-900 mb-2">
                        <i class="fas fa-tags mr-2"></i>キーワード選びのコツ
                    </h4>
                    <ul class="space-y-2 text-sm text-gray-700 pl-2">
                        <li>✅ 何かしら調べたいと思っている検索者が、どんなキーワードで検索するかを想像して選出してください</li>
                        <li>✅ 同じキーワードでもアプローチを変えたコラムは、違うターゲットが読む可能性が高いです</li>
                        <li>✅ 具体的なキーワードほど、ニッチなターゲットに刺さります</li>
                        <li>✅ 地域名を含めると、地域SEOに効果的です</li>
                        <li>✅ 「悩み」「問題」「解決方法」などの言葉を含めると、検索意図にマッチします</li>
                    </ul>
                </div>
                
                <div class="bg-orange-50 p-4 rounded-lg">
                    <h4 class="font-bold text-orange-900 mb-2">
                        <i class="fas fa-exclamation-circle mr-2"></i>重要な注意事項
                    </h4>
                    <p class="text-sm text-gray-700">
                        推奨使用頻度：<strong>週2回（月8回程度）</strong><br>
                        ※量よりも質を重視し、一つ一つの記事に正確性を持たせましょう。<br>
                        生成後は<strong>必ず校正</strong>してから公開してください。
                    </p>
                </div>
            </div>
            <div class="p-6 pt-0 flex space-x-3">
                <label class="flex items-center flex-1 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" id="dontShowAgain" class="mr-2">
                    次回から表示しない
                </label>
                <button onclick="closeTutorial()" class="btn gradient-bg text-white px-6 py-2 rounded-lg font-medium">
                    <i class="fas fa-check mr-2"></i>始める
                </button>
            </div>
        </div>
    </div>

    <!-- キーワード選びのコツモーダル -->
    <div id="keywordHelpModal" class="modal">
        <div class="modal-content">
            <div class="bg-blue-600 text-white p-6 rounded-t-xl flex items-center justify-between">
                <h3 class="text-2xl font-bold">
                    <i class="fas fa-lightbulb mr-3"></i>
                    キーワード選びのコツ
                </h3>
                <button onclick="closeKeywordHelp()" class="text-white hover:text-gray-200 text-2xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6 space-y-4 text-gray-700">
                <div class="bg-green-50 border-l-4 border-green-500 p-4">
                    <h4 class="font-bold text-green-900 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>基本原則
                    </h4>
                    <ul class="space-y-2 text-sm pl-2">
                        <li>✅ <strong>検索者の視点で考える</strong><br>
                        何かしら調べたいと思っている人が、どんなキーワードで検索するかを想像してください。</li>
                        
                        <li>✅ <strong>多様なアプローチを試す</strong><br>
                        同じキーワードでもアプローチを変えたコラムは、違うターゲットが読む可能性が高いです。</li>
                    </ul>
                </div>
                
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <h4 class="font-bold text-blue-900 mb-2">
                        <i class="fas fa-star mr-2"></i>効果的なキーワード選択
                    </h4>
                    <ul class="space-y-2 text-sm pl-2">
                        <li>🎯 <strong>具体的であるほど効果的</strong><br>
                        「リフォーム」より「畳リフォーム 神戸」の方がニッチなターゲットに刺さります。</li>
                        
                        <li>📍 <strong>地域名を活用</strong><br>
                        地域ビジネスの場合、地域名を含めると地域SEOに非常に効果的です。<br>
                        例：「神戸市」「兵庫県」「〇〇区」</li>
                        
                        <li>❓ <strong>悩み・問題を含める</strong><br>
                        「ダニ対策」「カビ予防」「費用」など、検索意図にマッチするキーワードを含めましょう。</li>
                        
                        <li>🔢 <strong>数字を活用</strong><br>
                        「5つの方法」「3ステップ」など、数字を含めると具体性が増します。</li>
                    </ul>
                </div>
                
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <h4 class="font-bold text-yellow-900 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>避けるべきこと
                    </h4>
                    <ul class="space-y-2 text-sm pl-2">
                        <li>❌ あまりに抽象的なキーワード（「サービス」「商品」など）</li>
                        <li>❌ 競合が多すぎるビッグキーワードのみ</li>
                        <li>❌ 関連性のないキーワードの組み合わせ</li>
                    </ul>
                </div>
                
                <div class="bg-purple-50 border-l-4 border-purple-500 p-4">
                    <h4 class="font-bold text-purple-900 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>キーワード組み合わせ例
                    </h4>
                    <div class="space-y-2 text-sm">
                        <p><strong>パターン1：地域 + サービス + 特徴</strong><br>
                        「神戸」「畳リフォーム」「即日対応」</p>
                        
                        <p><strong>パターン2：商品 + 悩み + 解決</strong><br>
                        「畳」「ダニ」「対策方法」</p>
                        
                        <p><strong>パターン3：サービス + 比較 + 地域</strong><br>
                        「壁紙張替え」「費用」「大阪」</p>
                    </div>
                </div>
            </div>
            <div class="p-6 pt-0">
                <button onclick="closeKeywordHelp()" class="btn w-full gradient-bg text-white py-3 rounded-lg font-medium">
                    <i class="fas fa-check mr-2"></i>理解しました
                </button>
            </div>
        </div>
    </div>

    <script src="/static/app-customer.js"></script>
</body>
</html>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定管理ページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getPriceSettingsPage(companyName: string) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>価格設定管理 - ${companyName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-cog text-3xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">価格設定管理</h1>
                        <p class="text-sm text-purple-100">${companyName}</p>
                    </div>
                </div>
                <a href="/" class="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                    <i class="fas fa-home mr-2"></i>ホームに戻る
                </a>
            </div>
        </div>
    </header>

    <!-- コンテンツ -->
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p class="text-sm text-blue-800">
                <i class="fas fa-info-circle mr-2"></i>
                診断チャート結果ページで表示される価格情報を設定します。
            </p>
        </div>

        <!-- 全面張替え -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-home text-purple-600 mr-3"></i>
                全面張替え
            </h2>
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最小価格（円）</label>
                        <input type="number" id="zenmen_harikae_min" oninput="updatePreview('zenmen_harikae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="例: 15000">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最大価格（円）</label>
                        <input type="number" id="zenmen_harikae_max" oninput="updatePreview('zenmen_harikae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="例: 25000">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">単位</label>
                        <input type="text" id="zenmen_harikae_unit" value="畳" oninput="updatePreview('zenmen_harikae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">工期の目安</label>
                        <input type="text" id="zenmen_harikae_duration" oninput="updatePreview('zenmen_harikae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="例: 1〜2日">
                    </div>
                </div>
                <div id="zenmen_harikae_preview" class="mt-4 p-4 bg-gray-50 rounded-lg"></div>
            </div>
        </div>

        <!-- 表替え -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-layer-group text-green-600 mr-3"></i>
                表替え
            </h2>
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最小価格（円）</label>
                        <input type="number" id="omote_gae_min" oninput="updatePreview('omote_gae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="例: 8000">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最大価格（円）</label>
                        <input type="number" id="omote_gae_max" oninput="updatePreview('omote_gae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="例: 15000">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">単位</label>
                        <input type="text" id="omote_gae_unit" value="畳" oninput="updatePreview('omote_gae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">工期の目安</label>
                        <input type="text" id="omote_gae_duration" oninput="updatePreview('omote_gae')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="例: 半日〜1日">
                    </div>
                </div>
                <div id="omote_gae_preview" class="mt-4 p-4 bg-gray-50 rounded-lg"></div>
            </div>
        </div>

        <!-- メンテナンス -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-tools text-blue-600 mr-3"></i>
                メンテナンス
            </h2>
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最小価格（円）</label>
                        <input type="number" id="maintenance_min" oninput="updatePreview('maintenance')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="例: 3000">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">最大価格（円）</label>
                        <input type="number" id="maintenance_max" oninput="updatePreview('maintenance')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="例: 8000">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">単位</label>
                        <input type="text" id="maintenance_unit" value="畳" oninput="updatePreview('maintenance')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">工期の目安</label>
                        <input type="text" id="maintenance_duration" oninput="updatePreview('maintenance')" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="例: 1〜2時間">
                    </div>
                </div>
                <div id="maintenance_preview" class="mt-4 p-4 bg-gray-50 rounded-lg"></div>
            </div>
        </div>

        <!-- 保存ボタン -->
        <button onclick="savePriceSettings()" class="w-full gradient-bg text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl">
            <i class="fas fa-save mr-2"></i>設定を保存
        </button>
    </div>

    <!-- ローディングオーバーレイ -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center" style="z-index: 9999;">
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div class="loading mx-auto mb-4" style="width: 40px; height: 40px; border-width: 4px;"></div>
            <p id="loadingMessage" class="text-gray-700 font-medium">処理中...</p>
        </div>
    </div>

    <script src="/static/app-price-settings.js"></script>
</body>
</html>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断チャートページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getDiagnosisPage(companyName: string, contactUrl: string, phoneNumber: string) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>畳診断チャート - ${companyName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .btn { transition: all 0.2s; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-clipboard-check text-3xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">畳診断チャート</h1>
                        <p class="text-sm text-purple-100">${companyName}</p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- コンテンツ -->
    <div class="container mx-auto px-4 py-8 max-w-3xl">
        <!-- 診断開始画面 -->
        <div id="diagnosisStart" class="bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="mb-6">
                <i class="fas fa-clipboard-list text-6xl text-purple-600"></i>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-4">畳診断スタート</h2>
            <p class="text-gray-600 mb-8">
                簡単な質問に答えるだけで、<br>
                あなたの畳に最適なサービスをご提案します。
            </p>
            <button onclick="startDiagnosis()" class="btn gradient-bg text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl">
                <i class="fas fa-play mr-2"></i>診断を開始する
            </button>
        </div>

        <!-- 診断質問 -->
        <div id="diagnosisQuestions" class="hidden space-y-6">
            <!-- 進行状況バー -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-2">
                    <span id="progressText" class="text-sm font-medium text-gray-700">質問 1 / 7</span>
                    <span class="text-sm text-gray-500">もう少しで完了！</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div id="progressBar" class="bg-purple-600 h-3 rounded-full transition-all duration-500" style="width: 14.3%"></div>
                </div>
            </div>

            <!-- 質問1: 畳の状態 -->
            <div id="question1" class="bg-white rounded-xl shadow-lg p-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-question-circle text-purple-600 mr-2"></i>
                    畳の状態はどうですか？
                </h3>
                <div class="space-y-3">
                    <button onclick="answerQuestion(1, 'good')" class="btn w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-4 rounded-lg font-medium text-left px-6">
                        <i class="fas fa-check-circle mr-3"></i>良好（変色やささくれなし）
                    </button>
                    <button onclick="answerQuestion(1, 'medium')" class="btn w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-4 rounded-lg font-medium text-left px-6">
                        <i class="fas fa-exclamation-circle mr-3"></i>やや劣化（変色や小さなささくれあり）
                    </button>
                    <button onclick="answerQuestion(1, 'bad')" class="btn w-full bg-gradient-to-r from-red-400 to-red-600 text-white py-4 rounded-lg font-medium text-left px-6">
                        <i class="fas fa-times-circle mr-3"></i>劣化が進行（大きなささくれ、穴、カビ等）
                    </button>
                </div>
            </div>

            <!-- 質問2: 使用年数 -->
            <div id="question2" class="hidden bg-white rounded-xl shadow-lg p-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-calendar-alt text-purple-600 mr-2"></i>
                    畳を使い始めてどのくらいですか？
                </h3>
                <div class="space-y-3">
                    <button onclick="answerQuestion(2, 'under5')" class="btn w-full bg-blue-500 text-white py-4 rounded-lg font-medium">
                        5年未満
                    </button>
                    <button onclick="answerQuestion(2, '5to10')" class="btn w-full bg-blue-500 text-white py-4 rounded-lg font-medium">
                        5〜10年
                    </button>
                    <button onclick="answerQuestion(2, 'over10')" class="btn w-full bg-blue-500 text-white py-4 rounded-lg font-medium">
                        10年以上
                    </button>
                </div>
            </div>

            <!-- 質問3〜7はシンプルな実装のため省略、必要に応じて追加 -->
            <div id="question3" class="hidden bg-white rounded-xl shadow-lg p-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-bullseye text-purple-600 mr-2"></i>
                    主な目的は何ですか？
                </h3>
                <div class="space-y-3">
                    <button onclick="answerQuestion(3, 'beauty')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg font-medium">
                        見た目を美しくしたい
                    </button>
                    <button onclick="answerQuestion(3, 'function')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg font-medium">
                        機能を回復させたい
                    </button>
                    <button onclick="answerQuestion(3, 'both')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg font-medium">
                        両方
                    </button>
                </div>
            </div>

            <div id="question4" class="hidden bg-white rounded-xl shadow-lg p-8">
                <button onclick="answerQuestion(4, 'yes')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg">次へ</button>
            </div>

            <div id="question5" class="hidden bg-white rounded-xl shadow-lg p-8">
                <button onclick="answerQuestion(5, 'yes')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg">次へ</button>
            </div>

            <div id="question6" class="hidden bg-white rounded-xl shadow-lg p-8">
                <button onclick="answerQuestion(6, 'yes')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg">次へ</button>
            </div>

            <div id="question7" class="hidden bg-white rounded-xl shadow-lg p-8">
                <button onclick="answerQuestion(7, 'yes')" class="btn w-full bg-purple-500 text-white py-4 rounded-lg">診断結果を見る</button>
            </div>
        </div>

        <!-- 診断結果 -->
        <div id="diagnosisResult" class="hidden space-y-6">
            <div class="bg-white rounded-xl shadow-lg p-8">
                <div id="resultContent"></div>

                <div class="flex flex-col space-y-3 mt-8">
                    ${contactUrl ? `
                        <a href="${contactUrl}" onclick="trackContactClick()" target="_blank" 
                            class="btn bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-lg font-bold text-center">
                            <i class="fas fa-envelope mr-2"></i>お問い合わせフォームへ
                        </a>
                    ` : ''}
                    ${phoneNumber ? `
                        <a href="tel:${phoneNumber}" onclick="trackPhoneClick()" 
                            class="btn bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-lg font-bold text-center">
                            <i class="fas fa-phone mr-2"></i>${phoneNumber}に電話する
                        </a>
                    ` : ''}
                    <button onclick="restartDiagnosis()" class="btn bg-gray-500 text-white py-3 rounded-lg font-medium">
                        <i class="fas fa-redo mr-2"></i>もう一度診断する
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="/static/app-diagnosis.js"></script>
</body>
</html>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析ダッシュボードページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getAnalyticsPage(companyName: string) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>アクセス解析ダッシュボード - ${companyName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-chart-line text-3xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">アクセス解析ダッシュボード</h1>
                        <p class="text-sm text-purple-100">${companyName}</p>
                    </div>
                </div>
                <a href="/" class="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                    <i class="fas fa-home mr-2"></i>ホームに戻る
                </a>
            </div>
        </div>
    </header>

    <!-- コンテンツ -->
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <!-- 期間選択 -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">集計期間</h2>
                </div>
                <div class="flex space-x-2">
                    <button onclick="changePeriod('7d')" class="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                        直近7日
                    </button>
                    <button onclick="changePeriod('30d')" class="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600">
                        直近30日
                    </button>
                    <button onclick="changePeriod('90d')" class="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600">
                        直近90日
                    </button>
                    <button onclick="exportCSV()" class="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                        <i class="fas fa-download mr-2"></i>CSV出力
                    </button>
                </div>
            </div>
        </div>

        <!-- サマリーカード -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">総訪問者数</p>
                        <p id="totalPageviews" class="text-3xl font-bold text-blue-600">0</p>
                    </div>
                    <i class="fas fa-users text-4xl text-blue-500 opacity-20"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">診断開始数</p>
                        <p id="diagnosisStarts" class="text-3xl font-bold text-purple-600">0</p>
                    </div>
                    <i class="fas fa-play text-4xl text-purple-500 opacity-20"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">診断完了数</p>
                        <p id="diagnosisCompletes" class="text-3xl font-bold text-green-600">0</p>
                    </div>
                    <i class="fas fa-check-circle text-4xl text-green-500 opacity-20"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">お問い合わせ数</p>
                        <p id="totalContacts" class="text-3xl font-bold text-orange-600">0</p>
                    </div>
                    <i class="fas fa-envelope text-4xl text-orange-500 opacity-20"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">診断完了率</p>
                        <p id="diagnosisRate" class="text-3xl font-bold text-indigo-600">0%</p>
                    </div>
                    <i class="fas fa-percentage text-4xl text-indigo-500 opacity-20"></i>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">コンバージョン率</p>
                        <p id="conversionRate" class="text-3xl font-bold text-pink-600">0%</p>
                    </div>
                    <i class="fas fa-bullseye text-4xl text-pink-500 opacity-20"></i>
                </div>
            </div>
        </div>

        <!-- コンバージョンファネル -->
        <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-6">
                <i class="fas fa-filter text-purple-600 mr-2"></i>
                コンバージョンファネル
            </h3>
            <div id="funnelChart"></div>
        </div>

        <!-- 人気コラムランキング -->
        <div class="bg-white rounded-xl shadow-lg p-8">
            <h3 class="text-xl font-bold text-gray-800 mb-6">
                <i class="fas fa-star text-yellow-500 mr-2"></i>
                人気コラムランキング
            </h3>
            <div id="popularColumnsList" class="space-y-3"></div>
        </div>
    </div>

    <!-- ローディングオーバーレイ -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center" style="z-index: 9999;">
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div class="loading mx-auto mb-4" style="width: 40px; height: 40px; border-width: 4px;"></div>
            <p id="loadingMessage" class="text-gray-700 font-medium">処理中...</p>
        </div>
    </div>

    <script src="/static/app-analytics.js"></script>
</body>
</html>
  `;
}
