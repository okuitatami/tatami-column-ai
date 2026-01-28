// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断チャート機能
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentStep = 1;
let priceSettings = {};
let answers = {};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 Diagnosis Page initialized');
    loadPriceSettings();
    trackPageView();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析: ページビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function trackPageView() {
    try {
        await fetch('/api/analytics/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: '/diagnosis',
                title: '畳診断チャート'
            })
        });
    } catch (error) {
        console.error('Failed to track pageview:', error);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析: 診断開始
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function trackDiagnosisStart() {
    try {
        await fetch('/api/analytics/diagnosis-start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: '/diagnosis'
            })
        });
    } catch (error) {
        console.error('Failed to track diagnosis start:', error);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析: 診断完了
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function trackDiagnosisComplete(result) {
    try {
        await fetch('/api/analytics/diagnosis-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: '/diagnosis',
                result_type: result
            })
        });
    } catch (error) {
        console.error('Failed to track diagnosis complete:', error);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定の読み込み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function loadPriceSettings() {
    try {
        const response = await fetch('/api/price-settings');
        const data = await response.json();
        
        if (response.ok) {
            priceSettings = data.settings || {};
        }
    } catch (error) {
        console.error('Failed to load price settings:', error);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断開始
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function startDiagnosis() {
    currentStep = 1;
    answers = {};
    
    document.getElementById('diagnosisStart').classList.add('hidden');
    document.getElementById('diagnosisQuestions').classList.remove('hidden');
    
    showQuestion(1);
    trackDiagnosisStart();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 質問の表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showQuestion(questionNum) {
    // すべての質問を非表示
    for (let i = 1; i <= 7; i++) {
        document.getElementById(`question${i}`).classList.add('hidden');
    }
    
    // 現在の質問を表示
    document.getElementById(`question${questionNum}`).classList.remove('hidden');
    
    // 進行状況を更新
    updateProgress(questionNum);
    
    currentStep = questionNum;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 進行状況の更新
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateProgress(step) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const percentage = (step / 7) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `質問 ${step} / 7`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 回答の処理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function answerQuestion(questionNum, answer) {
    answers[`q${questionNum}`] = answer;
    
    if (questionNum < 7) {
        // 次の質問へ
        showQuestion(questionNum + 1);
    } else {
        // 診断完了
        showResult();
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断結果の表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showResult() {
    document.getElementById('diagnosisQuestions').classList.add('hidden');
    document.getElementById('diagnosisResult').classList.remove('hidden');
    
    // 診断ロジック
    const result = calculateResult();
    
    // 結果表示
    renderResult(result);
    
    // アクセス解析: 診断完了
    trackDiagnosisComplete(result.type);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断結果の計算
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function calculateResult() {
    // 診断ロジック
    const q1 = answers.q1; // 畳の状態
    const q2 = answers.q2; // 使用年数
    const q3 = answers.q3; // 具体的な問題
    const q4 = answers.q4; // 化学畳表の有無
    const q5 = answers.q5; // 目的
    
    // 新調工事が必要なケース
    if (q1 === 'bad' || q2 === 'over15' || q3 === 'hole' || q3 === 'mold') {
        return {
            type: 'shincho',
            title: '新調工事（畳の全交換）をおすすめします',
            description: '畳床から新しくする必要があります。',
            icon: 'fa-home',
            explanation: '畳床（芯材）が劣化している、または大きな損傷がある場合は、新調工事が最適です。'
        };
    }
    
    // 表替えが適切なケース
    if (q1 === 'medium' || q2 === '8to15' || q3 === 'stain' || q3 === 'fading') {
        return {
            type: 'omote',
            title: '表替えをおすすめします',
            description: '畳表（ゴザ）のみ新しくします。',
            icon: 'fa-layer-group',
            explanation: '畳床は問題なく、表面（畳表）のみ劣化している場合に適しています。'
        };
    }
    
    // 裏返しが適切なケース（比較的新しい畳）
    if (q2 === 'under5' || q3 === 'minor') {
        return {
            type: 'uragaeshi',
            title: '裏返しをおすすめします',
            description: '現在の畳表を裏返して使用します。',
            icon: 'fa-sync-alt',
            explanation: '畳表の裏面がまだ使える状態であれば、経済的な選択肢です。'
        };
    }
    
    // デフォルトは表替え
    return {
        type: 'omote',
        title: '表替えをおすすめします',
        description: '畳表（ゴザ）のみ新しくします。',
        icon: 'fa-layer-group',
        explanation: '畳床は問題なく、表面（畳表）のみ劣化している場合に適しています。'
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断結果の描画
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderResult(result) {
    const resultContainer = document.getElementById('resultContent');
    const priceInfo = priceSettings[result.type] || {};
    
    const minPrice = priceInfo.min_price || 0;
    const maxPrice = priceInfo.max_price || 0;
    const popularPrice = priceInfo.popular_price || 0;
    const unit = priceInfo.unit || '畳';
    const duration = priceInfo.duration || '—';
    
    // カテゴリー別の説明と図解
    const categoryInfo = getCategoryInfo(result.type);
    
    resultContainer.innerHTML = `
        <div class="text-center mb-8">
            <div class="inline-block bg-purple-100 rounded-full p-6 mb-4">
                <i class="fas ${result.icon} text-6xl text-purple-600"></i>
            </div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${result.title}</h2>
            <p class="text-gray-600">${result.description}</p>
        </div>
        
        <!-- カテゴリー説明 -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8">
            <h3 class="font-bold text-blue-900 mb-3 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                ${categoryInfo.title}とは？
            </h3>
            <p class="text-sm text-blue-800 mb-4">${categoryInfo.description}</p>
            ${categoryInfo.diagram}
        </div>
        
        <!-- 料金情報 -->
        <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 mb-8">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-yen-sign text-purple-600 mr-2"></i>
                料金の目安
            </h3>
            ${minPrice > 0 && maxPrice > 0 ? `
                <div class="space-y-4">
                    ${popularPrice > 0 ? `
                        <div class="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-6 shadow-md border-2 border-orange-300">
                            <div class="flex items-center justify-between mb-2">
                                <span class="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    <i class="fas fa-star mr-1"></i>お客様に人気のプラン
                                </span>
                            </div>
                            <p class="text-4xl font-bold text-orange-600 mb-1">
                                ${popularPrice.toLocaleString()}<span class="text-xl text-gray-600">円</span>
                            </p>
                            <p class="text-gray-600">/${unit}</p>
                        </div>
                    ` : ''}
                    <div class="bg-white rounded-lg p-6 shadow-md">
                        <p class="text-gray-600 mb-2">価格帯</p>
                        <p class="text-2xl font-bold text-purple-600">
                            ${minPrice.toLocaleString()}円 〜 ${maxPrice.toLocaleString()}円
                        </p>
                        <p class="text-gray-600">/${unit}</p>
                    </div>
                </div>
            ` : `
                <p class="text-gray-600">料金については直接お問い合わせください</p>
            `}
            
            <div class="mt-6 bg-white rounded-lg p-6 shadow-md">
                <h4 class="font-bold text-gray-700 mb-2">
                    <i class="fas fa-clock text-blue-600 mr-2"></i>
                    工期の目安
                </h4>
                <p class="text-xl font-bold text-blue-600">${duration}</p>
            </div>
        </div>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
            <h4 class="font-bold text-yellow-800 mb-2">
                <i class="fas fa-info-circle mr-2"></i>
                ご注意
            </h4>
            <p class="text-sm text-yellow-700">
                この診断結果はあくまで目安です。実際の状況により異なる場合がございます。<br>
                正確なお見積もりは、現地調査の上でご提案させていただきます。
            </p>
        </div>
    `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// カテゴリー別の説明情報
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getCategoryInfo(type) {
    const infoMap = {
        shincho: {
            title: '新調工事（しんちょうこうじ）',
            description: '畳床（芯材）から新しく作り直す工事です。畳全体を新品に交換するため、最も長持ちします。畳床の沈み込みや大きな損傷がある場合に適しています。',
            diagram: `
                <div class="bg-white p-4 rounded-lg">
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="p-3 bg-gray-800 text-white rounded">畳表（新品）</div>
                        <div class="text-2xl flex items-center justify-center">→</div>
                        <div class="p-3 bg-green-600 text-white rounded font-bold">新品</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center mt-2">
                        <div class="p-3 bg-gray-600 text-white rounded">畳床（新品）</div>
                        <div class="text-2xl flex items-center justify-center">→</div>
                        <div class="p-3 bg-green-600 text-white rounded font-bold">新品</div>
                    </div>
                    <p class="text-xs text-gray-600 mt-3">※畳表も畳床も全て新しくします</p>
                </div>
            `
        },
        omote: {
            title: '表替え（おもてがえ）',
            description: '畳表（ゴザ部分）だけを新しいものに交換する工事です。畳床はそのまま使用するため、費用を抑えられます。表面の変色や小さな傷がある場合に適しています。',
            diagram: `
                <div class="bg-white p-4 rounded-lg">
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="p-3 bg-gray-800 text-white rounded">畳表（古い）</div>
                        <div class="text-2xl flex items-center justify-center">→</div>
                        <div class="p-3 bg-green-600 text-white rounded font-bold">新品</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center mt-2">
                        <div class="p-3 bg-blue-600 text-white rounded">畳床（そのまま）</div>
                        <div class="text-2xl flex items-center justify-center">→</div>
                        <div class="p-3 bg-blue-600 text-white rounded">そのまま使用</div>
                    </div>
                    <p class="text-xs text-gray-600 mt-3">※畳表のみ交換します</p>
                </div>
            `
        },
        uragaeshi: {
            title: '裏返し（うらがえし）',
            description: '現在の畳表を一度はがし、裏面を表にして張り直す工事です。最も経済的な選択肢で、畳表が比較的新しい場合（3〜5年以内）に適しています。',
            diagram: `
                <div class="bg-white p-4 rounded-lg">
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="p-3 bg-gray-700 text-white rounded">畳表（表面）</div>
                        <div class="text-2xl flex items-center justify-center">→</div>
                        <div class="p-3 bg-green-500 text-white rounded font-bold">裏面を使用</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center mt-2">
                        <div class="p-3 bg-blue-600 text-white rounded">畳床（そのまま）</div>
                        <div class="text-2xl flex items-center justify-center">→</div>
                        <div class="p-3 bg-blue-600 text-white rounded">そのまま使用</div>
                    </div>
                    <p class="text-xs text-gray-600 mt-3">※畳表を裏返して再利用します</p>
                </div>
            `
        }
    };
    
    return infoMap[type] || infoMap.omote;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// お問い合わせ（アクセス解析付き）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function trackContactClick() {
    try {
        await fetch('/api/analytics/contact-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: '/diagnosis',
                contact_type: 'form'
            })
        });
    } catch (error) {
        console.error('Failed to track contact click:', error);
    }
}

async function trackPhoneClick() {
    try {
        await fetch('/api/analytics/phone-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: '/diagnosis',
                contact_type: 'phone'
            })
        });
    } catch (error) {
        console.error('Failed to track phone click:', error);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// やり直し
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function restartDiagnosis() {
    location.reload();
}
