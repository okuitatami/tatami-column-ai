import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';
import trainingColumn from './routes/training-column';

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use('/api/*', cors({
  origin: '*',
  credentials: true,
}));

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }));

// APIルート
app.route('/api/training', trainingColumn);

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// メインページ
app.get('/', (c) => {
  return c.html(getTrainingPage());
});

export default app;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// トレーニングページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getTrainingPage() {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIコラム生成トレーニングシステム</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .section-card {
            transition: all 0.3s ease;
        }
        .section-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .good-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .bad-btn {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        .edit-mode {
            border: 2px solid #f59e0b;
            background: #fffbeb;
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
        <!-- ヘッダー -->
        <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-robot mr-3 text-blue-600"></i>
                        AIコラム生成システム
                    </h1>
                    <p class="text-gray-600">
                        <i class="fas fa-graduation-cap mr-2"></i>
                        AI育成プロトタイプ - 特許保持者様プレゼンテーション用
                    </p>
                </div>
                <div class="text-right">
                    <div class="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg px-4 py-2">
                        <p class="text-sm text-gray-600">AI学習モード</p>
                        <p class="text-lg font-bold text-blue-600">Genspark AI</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- ステップインジケーター -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center">
                        <div id="step1-indicator" class="step-indicator active">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="flex-1 h-1 bg-gray-200 mx-2"></div>
                        <div id="step2-indicator" class="step-indicator">
                            <i class="fas fa-heading"></i>
                        </div>
                        <div class="flex-1 h-1 bg-gray-200 mx-2"></div>
                        <div id="step3-indicator" class="step-indicator">
                            <i class="fas fa-file-alt"></i>
                        </div>
                    </div>
                    <div class="flex justify-between mt-2">
                        <span class="text-sm font-medium text-gray-700">キーワード入力</span>
                        <span class="text-sm font-medium text-gray-700">タイトル選択</span>
                        <span class="text-sm font-medium text-gray-700">コラム編集・評価</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ステップ1: キーワード入力 -->
        <div id="step1-content" class="bg-white rounded-2xl shadow-xl p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-keyboard mr-2 text-blue-600"></i>
                キーワードを入力してください
            </h2>
            
            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        キーワード1 <span class="text-red-500">*必須</span>
                    </label>
                    <input type="text" id="keyword1" 
                           class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                           placeholder="例: 畳">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        キーワード2
                    </label>
                    <input type="text" id="keyword2" 
                           class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                           placeholder="例: 張替え">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        キーワード3
                    </label>
                    <input type="text" id="keyword3" 
                           class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                           placeholder="例: 料金">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        キーワード4
                    </label>
                    <input type="text" id="keyword4" 
                           class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                           placeholder="例: 神戸">
                </div>
            </div>

            <button onclick="generateTitles()" 
                    class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                <i class="fas fa-magic mr-2"></i>
                タイトルを生成する
            </button>
        </div>

        <!-- ステップ2: タイトル選択 -->
        <div id="step2-content" class="hidden bg-white rounded-2xl shadow-xl p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-list-alt mr-2 text-blue-600"></i>
                タイトルを選択してください
            </h2>
            
            <div id="title-list" class="space-y-4 mb-6">
                <!-- タイトルがここに表示されます -->
            </div>

            <button onclick="generateColumn()" id="generate-column-btn" disabled
                    class="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl">
                <i class="fas fa-file-alt mr-2"></i>
                コラムを生成する
            </button>

            <button onclick="backToKeywords()" 
                    class="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-all">
                <i class="fas fa-arrow-left mr-2"></i>
                キーワード入力に戻る
            </button>
        </div>

        <!-- ステップ3: コラム表示・評価 -->
        <div id="step3-content" class="hidden">
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-edit mr-2 text-blue-600"></i>
                    生成されたコラム
                </h2>
                
                <div id="column-content" class="space-y-6">
                    <!-- コラムがここに表示されます -->
                </div>

                <div class="mt-8 flex gap-4">
                    <button onclick="showPreview()" 
                            class="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg">
                        <i class="fas fa-eye mr-2"></i>
                        プレビュー & コピー
                    </button>
                    <button onclick="resetToStart()" 
                            class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                        <i class="fas fa-redo mr-2"></i>
                        🔄 最初から作成する
                    </button>
                </div>
            </div>

            <!-- AI学習状況 -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                <h3 class="text-lg font-bold text-gray-800 mb-3">
                    <i class="fas fa-brain mr-2 text-green-600"></i>
                    AI学習データ
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600 mb-1">Good評価</p>
                        <p class="text-2xl font-bold text-green-600" id="good-count">0</p>
                    </div>
                    <div class="bg-white rounded-lg p-4">
                        <p class="text-sm text-gray-600 mb-1">添削回数</p>
                        <p class="text-2xl font-bold text-orange-600" id="correction-count">0</p>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mt-4">
                    <i class="fas fa-info-circle mr-1"></i>
                    将来的にOpenAI Fine-tuningでこのデータを使用して、あなた専用のAIモデルを育成します
                </p>
            </div>
        </div>
    </div>

    <script src="/static/app-training.js"></script>
</body>
</html>
  `;
}
