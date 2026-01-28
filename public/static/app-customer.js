// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// グローバル変数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let titleCandidates = [];
let selectedTitle = null;
let currentColumn = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 App initialized');
    
    // 今月の生成数を取得
    fetchMonthlyCount();
    
    // 初回チュートリアル表示チェック
    showTutorialIfNeeded();
});

// 今月の生成数を取得
async function fetchMonthlyCount() {
    try {
        const response = await fetch('/api/column/monthly-count');
        const data = await response.json();
        document.getElementById('monthlyCount').textContent = data.count || 0;
    } catch (error) {
        console.error('Failed to fetch monthly count:', error);
        document.getElementById('monthlyCount').textContent = '—';
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 通知メッセージ表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white font-medium`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒後に自動削除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// チュートリアル機能
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showTutorialIfNeeded() {
    // localStorageで「次回から表示しない」をチェック
    const dontShowAgain = localStorage.getItem('hideTutorial');
    if (!dontShowAgain) {
        document.getElementById('tutorialModal').classList.add('active');
    }
}

function closeTutorial() {
    const dontShowAgain = document.getElementById('dontShowAgain').checked;
    if (dontShowAgain) {
        localStorage.setItem('hideTutorial', 'true');
    }
    document.getElementById('tutorialModal').classList.remove('active');
}

function showKeywordHelp() {
    document.getElementById('keywordHelpModal').classList.add('active');
}

function closeKeywordHelp() {
    document.getElementById('keywordHelpModal').classList.remove('active');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ステップインジケーター
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateStepIndicator(step) {
    const steps = [
        { id: 'step1Indicator', num: 1, label: 'キーワード入力' },
        { id: 'step2Indicator', num: 2, label: 'タイトル選択' },
        { id: 'step3Indicator', num: 3, label: 'コラム編集' }
    ];
    
    steps.forEach(s => {
        const el = document.getElementById(s.id);
        const circle = el.querySelector('div');
        const text = el.querySelector('span');
        
        if (s.num === step) {
            el.classList.remove('opacity-50');
            circle.classList.remove('bg-gray-300');
            circle.classList.add('bg-purple-600');
            text.classList.remove('text-gray-500');
            text.classList.add('text-gray-700', 'font-medium');
        } else if (s.num < step) {
            el.classList.remove('opacity-50');
            circle.classList.remove('bg-gray-300');
            circle.classList.add('bg-green-600');
            text.classList.remove('text-gray-500');
            text.classList.add('text-gray-700');
        } else {
            el.classList.add('opacity-50');
            circle.classList.remove('bg-purple-600', 'bg-green-600');
            circle.classList.add('bg-gray-300');
            text.classList.remove('text-gray-700', 'font-medium');
            text.classList.add('text-gray-500');
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ローディング表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showLoading(message = '処理中...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    messageEl.textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タイトル生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateTitles() {
    // 前回の状態をクリア
    titleCandidates = [];
    selectedTitle = null;
    currentColumn = null;
    
    // キーワードを収集（4つに変更）
    const keywords = [];
    for (let i = 1; i <= 4; i++) {
        const keyword = document.getElementById(`keyword${i}`).value.trim().replace(/\s+/g, '');
        if (keyword) {
            keywords.push(keyword);
        }
    }
    
    if (keywords.length < 2) {
        alert('キーワードを最低2つ入力してください');
        return;
    }
    
    // 地域情報を収集（スペース削除、任意）
    const regions = [];
    for (let i = 1; i <= 3; i++) {
        const region = document.getElementById(`region${i}`).value.trim().replace(/\s+/g, '');
        if (region) {
            regions.push(region);
        }
    }
    
    try {
        showLoading(`キーワード${regions.length > 0 ? '・地域' : ''}を分析してタイトル候補を生成中... (30秒程度かかります)`);
        
        const response = await fetch('/api/column/generate-titles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, regions })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            titleCandidates = data.titles;
            renderTitles();
            
            document.getElementById('themeStep').classList.add('hidden');
            document.getElementById('titleStep').classList.remove('hidden');
            updateStepIndicator(2);
        } else {
            alert(data.error || 'タイトルの生成に失敗しました');
        }
    } catch (error) {
        console.error('Title generation error:', error);
        alert('エラーが発生しました');
    } finally {
        hideLoading();
    }
}

// タイトル候補を表示
function renderTitles() {
    const titleList = document.getElementById('titleList');
    titleList.innerHTML = '';
    
    titleCandidates.forEach((title, index) => {
        const card = document.createElement('div');
        card.className = 'card bg-white p-6 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all';
        card.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span class="text-purple-600 font-bold">${index + 1}</span>
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">${title.title}</h3>
                    <p class="text-sm text-gray-600">${title.description}</p>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            selectTitle(title.id);
            
            // すべてのカードの選択状態をリセット
            document.querySelectorAll('#titleList .card').forEach(c => {
                c.classList.remove('border-purple-500', 'bg-purple-50');
                c.classList.add('border-transparent');
            });
            
            // 選択されたカードをハイライト
            card.classList.remove('border-transparent');
            card.classList.add('border-purple-500', 'bg-purple-50');
        });
        
        titleList.appendChild(card);
    });
}

function selectTitle(titleId) {
    selectedTitle = titleCandidates.find(t => t.id === titleId);
    document.getElementById('generateColumnBtn').disabled = false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラム生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateColumnFromTitle() {
    if (!selectedTitle) {
        alert('タイトルを選択してください');
        return;
    }
    
    // 前回のコラムをクリア
    currentColumn = null;
    
    // キーワードを収集
    const keywords = [];
    for (let i = 1; i <= 4; i++) {
        const keyword = document.getElementById(`keyword${i}`).value.trim().replace(/\s+/g, '');
        if (keyword) {
            keywords.push(keyword);
        }
    }
    
    // 地域情報を収集（スペース削除、任意）
    const regions = [];
    for (let i = 1; i <= 3; i++) {
        const region = document.getElementById(`region${i}`).value.trim().replace(/\s+/g, '');
        if (region) {
            regions.push(region);
        }
    }
    
    // ターゲット層を収集（任意）
    const targetAudienceRadio = document.querySelector('input[name="targetAudience"]:checked');
    const targetAudience = targetAudienceRadio ? targetAudienceRadio.value : '';
    
    try {
        let loadingMessage = '高品質なコラムを生成中（1/3）...';
        if (regions.length > 0) loadingMessage = '地域最適化コラムを生成中（1/3）...';
        if (targetAudience) loadingMessage += ` [${targetAudience}向け]`;
        showLoading(loadingMessage);
        
        const response = await fetch('/api/column/generate-column', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                keywords,
                regions,
                title: selectedTitle.title,
                targetAudience: targetAudience || undefined
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Column generated successfully:', {
                title: data.column.title,
                sectionsCount: data.column.sections.length,
                qaCount: data.column.qa.length
            });
            currentColumn = data.column;
            
            // 今月の生成数を更新
            fetchMonthlyCount();
            
            showColumnStep();
        } else {
            console.error('❌ Column generation failed:', data.error);
            alert(data.error || 'コラムの生成に失敗しました');
        }
    } catch (error) {
        console.error('❌ Column generation error:', error);
        alert('エラーが発生しました');
    } finally {
        hideLoading();
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラム編集ステップを表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showColumnStep() {
    // currentColumn が存在するか確認
    if (!currentColumn) {
        console.error('❌ currentColumn is null! Cannot render column.');
        alert('コラムデータが見つかりません。もう一度生成してください。');
        return;
    }
    
    console.log('📝 Rendering column:', currentColumn.title);
    
    document.getElementById('titleStep').classList.add('hidden');
    document.getElementById('columnStep').classList.remove('hidden');
    
    updateStepIndicator(3);
    
    renderEditView();
    updateSEOInfo();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 編集ビュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderEditView() {
    // currentColumn が存在するか確認
    if (!currentColumn) {
        console.error('❌ renderEditView: currentColumn is null!');
        return;
    }
    
    console.log('📝 renderEditView: Rendering column:', currentColumn.title);
    
    const editContent = document.getElementById('editContent');
    editContent.innerHTML = '';
    
    // タイトル
    editContent.appendChild(createEditField('title', 'タイトル', currentColumn.title, 'text'));
    
    // 導入文
    editContent.appendChild(createEditField('introduction', '導入文', currentColumn.introduction, 'textarea'));
    
    // 見出しと本文
    currentColumn.sections.forEach((section, index) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'space-y-4 p-4 bg-gray-50 rounded-lg';
        sectionDiv.innerHTML = `<h4 class="font-bold text-gray-700">セクション ${index + 1}</h4>`;
        
        sectionDiv.appendChild(createEditField(`section_${index}_heading`, '見出し', section.heading, 'text'));
        sectionDiv.appendChild(createEditField(`section_${index}_content`, '本文', section.content, 'textarea'));
        
        editContent.appendChild(sectionDiv);
    });
    
    // クロージング
    const closingDiv = document.createElement('div');
    closingDiv.className = 'space-y-4 p-4 bg-gray-50 rounded-lg';
    closingDiv.innerHTML = `<h4 class="font-bold text-gray-700">クロージング</h4>`;
    closingDiv.appendChild(createEditField('closing_heading', '見出し', currentColumn.closing.heading, 'text'));
    closingDiv.appendChild(createEditField('closing_content', '本文', currentColumn.closing.content, 'textarea'));
    editContent.appendChild(closingDiv);
    
    // Q&A
    currentColumn.qa.forEach((qa, index) => {
        const qaDiv = document.createElement('div');
        qaDiv.className = 'space-y-4 p-4 bg-blue-50 rounded-lg';
        qaDiv.innerHTML = `<h4 class="font-bold text-gray-700">Q&A ${index + 1}</h4>`;
        
        qaDiv.appendChild(createEditField(`qa_${index}_question`, '質問', qa.question, 'text'));
        qaDiv.appendChild(createEditField(`qa_${index}_answer`, '回答', qa.answer, 'textarea'));
        
        editContent.appendChild(qaDiv);
    });
}

function createEditField(id, label, value, type) {
    const container = document.createElement('div');
    container.className = 'space-y-2';
    
    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium text-gray-700';
    labelEl.textContent = label;
    container.appendChild(labelEl);
    
    let inputEl;
    if (type === 'textarea') {
        inputEl = document.createElement('textarea');
        inputEl.rows = 6;
        inputEl.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent';
    } else {
        inputEl = document.createElement('input');
        inputEl.type = type;
        inputEl.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent';
    }
    
    inputEl.id = id;
    inputEl.value = value;
    inputEl.addEventListener('input', () => {
        updateColumnFromEdit();
        updateSEOInfo();
    });
    
    container.appendChild(inputEl);
    return container;
}

function updateColumnFromEdit() {
    if (!currentColumn) return;
    
    currentColumn.title = document.getElementById('title').value;
    currentColumn.introduction = document.getElementById('introduction').value;
    
    currentColumn.sections = currentColumn.sections.map((section, index) => ({
        heading: document.getElementById(`section_${index}_heading`).value,
        content: document.getElementById(`section_${index}_content`).value
    }));
    
    currentColumn.closing = {
        heading: document.getElementById('closing_heading').value,
        content: document.getElementById('closing_content').value
    };
    
    currentColumn.qa = currentColumn.qa.map((qa, index) => ({
        question: document.getElementById(`qa_${index}_question`).value,
        answer: document.getElementById(`qa_${index}_answer`).value
    }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// プレビュービュー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showEditView() {
    document.getElementById('editView').classList.remove('hidden');
    document.getElementById('previewView').classList.add('hidden');
    
    document.getElementById('editViewBtn').classList.remove('bg-gray-500');
    document.getElementById('editViewBtn').classList.add('bg-purple-600');
    document.getElementById('previewViewBtn').classList.remove('bg-purple-600');
    document.getElementById('previewViewBtn').classList.add('bg-gray-500');
}

function showPreviewView() {
    updateColumnFromEdit();
    renderPreview();
    
    document.getElementById('editView').classList.add('hidden');
    document.getElementById('previewView').classList.remove('hidden');
    
    document.getElementById('editViewBtn').classList.remove('bg-purple-600');
    document.getElementById('editViewBtn').classList.add('bg-gray-500');
    document.getElementById('previewViewBtn').classList.remove('bg-gray-500');
    document.getElementById('previewViewBtn').classList.add('bg-purple-600');
}

function renderPreview() {
    if (!currentColumn) return;
    
    const previewContent = document.getElementById('previewContent');
    
    let html = `<h1 class="text-3xl font-bold mb-6">${currentColumn.title}</h1>`;
    html += `<p class="text-lg leading-relaxed mb-8">${currentColumn.introduction}</p>`;
    
    currentColumn.sections.forEach(section => {
        html += `<h2 class="text-2xl font-bold mt-8 mb-4">${section.heading}</h2>`;
        html += `<p class="leading-relaxed mb-6">${section.content}</p>`;
    });
    
    html += `<h2 class="text-2xl font-bold mt-8 mb-4">${currentColumn.closing.heading}</h2>`;
    html += `<p class="leading-relaxed mb-6">${currentColumn.closing.content}</p>`;
    
    html += `<h2 class="text-2xl font-bold mt-8 mb-4">よくある質問（Q&A）</h2>`;
    html += `<div class="space-y-4">`;
    currentColumn.qa.forEach(qa => {
        html += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="font-bold text-lg mb-2">Q: ${qa.question}</p>
                <p class="text-gray-700">A: ${qa.answer}</p>
            </div>
        `;
    });
    html += `</div>`;
    
    previewContent.innerHTML = html;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEO情報
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateSEOInfo() {
    if (!currentColumn) return;
    
    const fullText = `${currentColumn.title} ${currentColumn.introduction} ${currentColumn.sections.map(s => s.heading + ' ' + s.content).join(' ')} ${currentColumn.closing.heading} ${currentColumn.closing.content}`;
    const charCount = fullText.length;
    const headingCount = currentColumn.sections.length + 1; // sections + closing
    const qaCount = currentColumn.qa.length;
    
    document.getElementById('charCount').textContent = charCount.toLocaleString();
    document.getElementById('headingCount').textContent = headingCount;
    document.getElementById('qaCount').textContent = qaCount;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート機能
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function copyToClipboard() {
    updateColumnFromEdit();
    
    let text = `${currentColumn.title}\n\n`;
    text += `${currentColumn.introduction}\n\n`;
    
    currentColumn.sections.forEach(section => {
        text += `■ ${section.heading}\n${section.content}\n\n`;
    });
    
    text += `■ ${currentColumn.closing.heading}\n${currentColumn.closing.content}\n\n`;
    
    text += `■ よくある質問（Q&A）\n`;
    currentColumn.qa.forEach(qa => {
        text += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('コラムをクリップボードにコピーしました！');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('コピーに失敗しました');
    });
}

function exportHTML() {
    updateColumnFromEdit();
    
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentColumn.title}</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; }
        h1 { font-size: 2em; margin-bottom: 1em; }
        h2 { font-size: 1.5em; margin-top: 1.5em; margin-bottom: 0.5em; border-left: 4px solid #667eea; padding-left: 10px; }
        p { margin-bottom: 1em; }
        .qa { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .qa .question { font-weight: bold; margin-bottom: 5px; }
    </style>
</head>
<body>
    <h1>${currentColumn.title}</h1>
    <p>${currentColumn.introduction}</p>
`;
    
    currentColumn.sections.forEach(section => {
        html += `    <h2>${section.heading}</h2>\n`;
        html += `    <p>${section.content}</p>\n`;
    });
    
    html += `    <h2>${currentColumn.closing.heading}</h2>\n`;
    html += `    <p>${currentColumn.closing.content}</p>\n`;
    
    html += `    <h2>よくある質問（Q&A）</h2>\n`;
    currentColumn.qa.forEach(qa => {
        html += `    <div class="qa">\n`;
        html += `        <div class="question">Q: ${qa.question}</div>\n`;
        html += `        <div class="answer">A: ${qa.answer}</div>\n`;
        html += `    </div>\n`;
    });
    
    html += `</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentColumn.title.substring(0, 30)}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ナビゲーション
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function backToTheme() {
    // 確認モーダルを表示してスーパーリロード
    if (confirm('新たなコラムを作成するためにトップページに戻ります')) {
        location.reload(true);
    }
}

function backToTitles() {
    // 確認モーダルを表示してスーパーリロード
    if (confirm('新たなコラムを作成するためにトップページに戻ります')) {
        location.reload(true);
    }
}

function resetSteps() {
    document.getElementById('themeStep').classList.remove('hidden');
    document.getElementById('titleStep').classList.add('hidden');
    document.getElementById('columnStep').classList.add('hidden');
    updateStepIndicator(1);
}
