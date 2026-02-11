// 診断チャートアプリケーション
let currentQuestionIndex = 0;
let questions = [];
let answers = {};
let diagnosisResult = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 質問データを取得
        const response = await fetch('/api/diagnosis/questions');
        const data = await response.json();
        
        if (data.success) {
            questions = data.questions;
            showQuestion(0);
        } else {
            alert('質問データの取得に失敗しました');
        }
    } catch (error) {
        console.error('初期化エラー:', error);
        alert('初期化に失敗しました');
    }
});

// 質問を表示
function showQuestion(index) {
    currentQuestionIndex = index;
    const question = questions[index];
    
    // プログレス更新
    updateProgress();
    
    // 質問コンテナ
    const questionContainer = document.getElementById('questionContainer');
    questionContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="mb-4">
                <span class="text-sm text-gray-500">質問 ${index + 1} / ${questions.length}</span>
                <h2 class="text-2xl font-bold text-gray-800 mt-2">${question.question}</h2>
            </div>
            
            <div class="space-y-3" id="optionsContainer">
                ${renderOptions(question)}
            </div>
        </div>
    `;
    
    // ナビゲーションボタンの状態更新
    updateNavigation();
}

// 選択肢をレンダリング
function renderOptions(question) {
    const selectedAnswer = answers[question.id];
    
    return question.options.map((option, index) => `
        <label class="block cursor-pointer">
            <div class="border-2 rounded-lg p-4 transition-all hover:border-blue-500 hover:bg-blue-50 ${
                selectedAnswer === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }">
                <div class="flex items-center">
                    <input 
                        type="radio" 
                        name="question_${question.id}" 
                        value="${option.value}"
                        ${selectedAnswer === option.value ? 'checked' : ''}
                        onchange="selectOption('${question.id}', '${option.value}')"
                        class="w-4 h-4 text-blue-600"
                    >
                    <span class="ml-3 text-lg text-gray-700">${option.label}</span>
                </div>
            </div>
        </label>
    `).join('');
}

// 選択肢を選択
function selectOption(questionId, value) {
    answers[questionId] = value;
    updateNavigation();
}

// プログレスバー更新
function updateProgress() {
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;
    
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${answeredCount} / ${questions.length}`;
}

// ナビゲーションボタン更新
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // 前へボタン
    if (currentQuestionIndex === 0) {
        prevBtn.classList.add('hidden');
    } else {
        prevBtn.classList.remove('hidden');
    }
    
    // 次へ・診断ボタン
    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = answers[currentQuestion.id] !== undefined;
    
    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        submitBtn.disabled = !isAnswered;
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        nextBtn.disabled = !isAnswered;
    }
}

// 前へ
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

// 次へ
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

// 診断実行
async function submitDiagnosis() {
    try {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>診断中...';
        
        const response = await fetch('/api/diagnosis/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });
        
        const data = await response.json();
        
        if (data.success) {
            diagnosisResult = data.result;
            showResult();
        } else {
            alert(data.error || '診断に失敗しました');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>診断する';
        }
    } catch (error) {
        console.error('診断エラー:', error);
        alert('診断に失敗しました');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>診断する';
    }
}

// 結果表示
function showResult() {
    const questionContainer = document.getElementById('questionContainer');
    const navigationButtons = document.getElementById('navigationButtons');
    const resultContainer = document.getElementById('resultContainer');
    
    questionContainer.classList.add('hidden');
    navigationButtons.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    // プログレスバーを100%に
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').textContent = `${questions.length} / ${questions.length}`;
    
    // 工法名の日本語表示
    const methodNames = {
        'shincho': '新調工事',
        'omoteae': '表替え',
        'urakaeshi': '裏返し'
    };
    
    // 素材名の日本語表示
    const materialNames = {
        'igusa': '天然い草',
        'chemical': '化学表（和紙・ポリプロピレン）'
    };
    
    // 緊急度の日本語表示とスタイル
    const urgencyInfo = {
        'urgent': { label: '早急な対応が必要です', color: 'text-red-600', bgColor: 'bg-red-50', icon: 'fa-exclamation-circle' },
        'soon': { label: '近いうちに対応をお勧めします', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: 'fa-exclamation-triangle' },
        'consider': { label: '検討をお勧めします', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: 'fa-info-circle' },
        'not_urgent': { label: '今すぐの対応は不要ですが、不安があればご相談ください', color: 'text-green-600', bgColor: 'bg-green-50', icon: 'fa-check-circle' }
    };
    
    const urgency = urgencyInfo[diagnosisResult.urgencyLevel];
    
    resultContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-8">
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <i class="fas fa-clipboard-check text-3xl text-blue-600"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-800">診断結果</h2>
                <p class="text-gray-600 mt-2">あなたの畳に最適な工法をご提案します</p>
            </div>
            
            <!-- 緊急度 -->
            <div class="mb-8 p-4 rounded-lg ${urgency.bgColor}">
                <div class="flex items-center">
                    <i class="fas ${urgency.icon} text-2xl ${urgency.color} mr-3"></i>
                    <span class="text-lg font-bold ${urgency.color}">${urgency.label}</span>
                </div>
            </div>
            
            <!-- 推奨工法 -->
            <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-tools text-blue-600 mr-2"></i>
                    推奨工法
                </h3>
                <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p class="text-2xl font-bold text-blue-600">${methodNames[diagnosisResult.recommendedMethod]}</p>
                </div>
            </div>
            
            <!-- 推奨素材 -->
            <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-leaf text-green-600 mr-2"></i>
                    推奨素材
                </h3>
                <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p class="text-xl font-bold text-green-600">${materialNames[diagnosisResult.recommendedMaterial]}</p>
                </div>
            </div>
            
            <!-- 概算費用 -->
            <div class="mb-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-yen-sign text-purple-600 mr-2"></i>
                    概算費用（1畳あたり）
                </h3>
                <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <p class="text-2xl font-bold text-purple-600">
                        ${diagnosisResult.estimatedCostMin.toLocaleString()}円 〜 ${diagnosisResult.estimatedCostMax.toLocaleString()}円
                    </p>
                    <p class="text-sm text-gray-600 mt-2">※畳表・畳床の品質により変動します</p>
                </div>
            </div>
            
            <!-- 説明 -->
            <div class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-info-circle text-gray-600 mr-2"></i>
                    詳細説明
                </h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-gray-700 leading-relaxed">${diagnosisResult.explanation}</p>
                </div>
            </div>
            
            <!-- お問い合わせボタン -->
            ${diagnosisResult.inquiryUrl ? `
                <div class="text-center">
                    <a href="${diagnosisResult.inquiryUrl}" 
                       class="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl">
                        <i class="fas fa-envelope mr-2"></i>お問い合わせページはこちら
                    </a>
                    <p class="text-sm text-gray-600 mt-4">
                        無料でお見積もり・ご相談を承ります
                    </p>
                </div>
            ` : ''}
            
            <!-- もう一度診断 -->
            <div class="text-center mt-6">
                <button onclick="restartDiagnosis()" 
                        class="text-blue-600 hover:text-blue-700 font-semibold">
                    <i class="fas fa-redo mr-2"></i>もう一度診断する
                </button>
            </div>
        </div>
    `;
}

// 診断をやり直す
function restartDiagnosis() {
    currentQuestionIndex = 0;
    answers = {};
    diagnosisResult = null;
    
    const questionContainer = document.getElementById('questionContainer');
    const navigationButtons = document.getElementById('navigationButtons');
    const resultContainer = document.getElementById('resultContainer');
    
    questionContainer.classList.remove('hidden');
    navigationButtons.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    
    showQuestion(0);
}
