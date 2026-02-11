// グローバル状態
let currentUser = null;
let isLoginMode = true;
let websiteAnalysis = null;
let titleCandidates = [];
let selectedTitle = null;
let currentColumn = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});

// 認証チェック
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainScreen();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthScreen();
    }
}

// 認証画面を表示
function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('userMenu').classList.add('hidden');
}

// メイン画面を表示
function showMainScreen() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('userMenu').classList.remove('hidden');
    document.getElementById('username').textContent = currentUser.username;
}

// 認証モード切り替え
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    document.getElementById('authTitle').textContent = isLoginMode ? 'ログイン' : '新規登録';
    document.getElementById('authButtonText').textContent = isLoginMode ? 'ログイン' : '登録';
    document.getElementById('authToggleText').textContent = isLoginMode 
        ? 'アカウントをお持ちでない方はこちら' 
        : '既にアカウントをお持ちの方はこちら';
    
    document.getElementById('emailField').classList.toggle('hidden', isLoginMode);
    document.getElementById('authError').classList.add('hidden');
}

// 認証フォーム送信
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('authUsername').value;
    const password = document.getElementById('authPassword').value;
    const email = document.getElementById('authEmail').value;
    
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginMode 
        ? { username, password }
        : { username, password, email };
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showMainScreen();
        } else {
            document.getElementById('authError').textContent = data.error || '認証に失敗しました';
            document.getElementById('authError').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Auth error:', error);
        document.getElementById('authError').textContent = 'エラーが発生しました';
        document.getElementById('authError').classList.remove('hidden');
    }
});

// ログアウト
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        websiteAnalysis = null;
        titleCandidates = [];
        selectedTitle = null;
        currentColumn = null;
        
        showAuthScreen();
        resetSteps();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ローディング表示
function showLoading(text = '処理中...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// ウェブサイト解析
async function analyzeWebsite() {
    const url = document.getElementById('websiteUrl').value;
    
    if (!url) {
        alert('URLを入力してください');
        return;
    }
    
    try {
        showLoading('ウェブサイトを解析中...');
        
        const response = await fetch('/api/column/analyze-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            websiteAnalysis = data.analysis;
            
            const resultDiv = document.getElementById('websiteAnalysisResult');
            const contentDiv = document.getElementById('websiteAnalysisContent');
            
            contentDiv.innerHTML = `
                <p><strong>サイト名:</strong> ${websiteAnalysis.title || '不明'}</p>
                <p><strong>特徴:</strong> ${websiteAnalysis.features?.join(', ') || '不明'}</p>
                <p><strong>強み:</strong> ${websiteAnalysis.strengths?.join(', ') || '不明'}</p>
            `;
            
            resultDiv.classList.remove('hidden');
        } else {
            alert(data.error || 'ウェブサイトの解析に失敗しました');
        }
    } catch (error) {
        console.error('Website analysis error:', error);
        alert('エラーが発生しました');
    } finally {
        hideLoading();
    }
}

// タイトル候補生成
async function generateTitles() {
    // 前回の状態をクリア
    titleCandidates = [];
    selectedTitle = null;
    currentColumn = null;
    websiteAnalysis = null;
    
    // キーワードを収集（スペース削除）
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
            credentials: 'include',
            body: JSON.stringify({ 
                keywords,
                regions,
                websiteInfo: websiteAnalysis 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            titleCandidates = data.titles;
            showTitleStep();
        } else {
            alert(data.error || 'タイトル候補の生成に失敗しました');
        }
    } catch (error) {
        console.error('Title generation error:', error);
        alert('エラーが発生しました');
    } finally {
        hideLoading();
    }
}

// タイトル選択ステップを表示
function showTitleStep() {
    document.getElementById('themeStep').classList.add('hidden');
    document.getElementById('titleStep').classList.remove('hidden');
    
    updateStepIndicator(2);
    
    const titleList = document.getElementById('titleList');
    titleList.innerHTML = '';
    
    titleCandidates.forEach(title => {
        const div = document.createElement('div');
        div.className = 'p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition';
        div.onclick = function() {
            // ラジオボタンを選択
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            selectTitle(title.id);
        };
        div.innerHTML = `
            <div class="flex items-start">
                <input type="radio" name="title" value="${title.id}" class="mt-1 mr-3" 
                    onchange="event.stopPropagation(); selectTitle('${title.id}')">
                <div class="flex-1">
                    <h4 class="font-bold text-lg text-gray-800 mb-2">${title.title}</h4>
                    <p class="text-sm text-gray-600">${title.description}</p>
                </div>
            </div>
        `;
        titleList.appendChild(div);
    });
}

// タイトル選択
function selectTitle(titleId) {
    selectedTitle = titleCandidates.find(t => t.id === titleId);
    document.getElementById('generateColumnBtn').disabled = false;
}

// コラム生成
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
            credentials: 'include',
            body: JSON.stringify({ 
                keywords,
                regions,
                title: selectedTitle.title,
                targetAudience: targetAudience || undefined,
                websiteInfo: websiteAnalysis 
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
            showColumnStep();
        } else {
            console.error('❌ Column generation failed:', data.error);
            alert(data.error || 'コラムの生成に失敗しました');
            // エラー時は currentColumn を null のまま保持（既にクリア済み）
        }
    } catch (error) {
        console.error('❌ Column generation error:', error);
        alert('エラーが発生しました');
        // エラー時は currentColumn を null のまま保持（既にクリア済み）
    } finally {
        hideLoading();
    }
}

// コラム編集ステップを表示
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

// 編集ビューをレンダリング
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
    const qaDiv = document.createElement('div');
    qaDiv.className = 'space-y-4 p-4 bg-gray-50 rounded-lg';
    qaDiv.innerHTML = `<h4 class="font-bold text-gray-700">Q&A</h4>`;
    
    currentColumn.qa.forEach((qa, index) => {
        const qaItem = document.createElement('div');
        qaItem.className = 'space-y-2 p-3 bg-white rounded border';
        qaItem.appendChild(createEditField(`qa_${index}_question`, '質問', qa.question, 'text'));
        qaItem.appendChild(createEditField(`qa_${index}_answer`, '回答', qa.answer, 'textarea'));
        qaDiv.appendChild(qaItem);
    });
    
    editContent.appendChild(qaDiv);
}

// 編集フィールド作成
function createEditField(id, label, value, type) {
    const div = document.createElement('div');
    div.className = 'space-y-2';
    
    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium text-gray-700';
    labelEl.textContent = label;
    
    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 6;
    } else {
        input = document.createElement('input');
        input.type = type;
    }
    
    input.id = id;
    input.value = value;
    input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent';
    input.addEventListener('input', () => {
        updateColumnFromEdit();
        updateSEOInfo();
    });
    
    div.appendChild(labelEl);
    div.appendChild(input);
    
    return div;
}

// 編集内容を反映
function updateColumnFromEdit() {
    currentColumn.title = document.getElementById('title').value;
    currentColumn.introduction = document.getElementById('introduction').value;
    
    currentColumn.sections.forEach((section, index) => {
        section.heading = document.getElementById(`section_${index}_heading`).value;
        section.content = document.getElementById(`section_${index}_content`).value;
    });
    
    currentColumn.closing.heading = document.getElementById('closing_heading').value;
    currentColumn.closing.content = document.getElementById('closing_content').value;
    
    currentColumn.qa.forEach((qa, index) => {
        qa.question = document.getElementById(`qa_${index}_question`).value;
        qa.answer = document.getElementById(`qa_${index}_answer`).value;
    });
}

// SEO情報を更新
function updateSEOInfo() {
    const fullText = [
        currentColumn.title,
        currentColumn.introduction,
        ...currentColumn.sections.map(s => s.heading + ' ' + s.content),
        currentColumn.closing.heading,
        currentColumn.closing.content,
        ...currentColumn.qa.map(q => q.question + ' ' + q.answer)
    ].join(' ');
    
    const charCount = fullText.replace(/\s/g, '').length;
    document.getElementById('charCount').textContent = charCount;
    
    // キーワード抽出と表示
    if (currentColumn.keywords) {
        const keywordsDiv = document.getElementById('extractedKeywords');
        keywordsDiv.innerHTML = currentColumn.keywords.map(kw => 
            `<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">${kw}</span>`
        ).join('');
        
        document.getElementById('keywordCount').textContent = currentColumn.keywords.length;
        
        // 最初のキーワードで密度計算
        if (currentColumn.keywords.length > 0) {
            const keyword = currentColumn.keywords[0];
            const density = calculateKeywordDensity(fullText, keyword);
            document.getElementById('keywordDensity').textContent = density.toFixed(2) + '%';
        }
    }
    
    // メタディスクリプション
    if (currentColumn.metaDescription) {
        document.getElementById('metaDescription').textContent = currentColumn.metaDescription;
    }
    
    // SEOスコア（簡易計算）
    let score = 0;
    if (charCount >= 2500 && charCount <= 3500) score += 30;
    else if (charCount >= 2000 && charCount <= 4000) score += 20;
    if (currentColumn.keywords && currentColumn.keywords.length >= 3) score += 30;
    if (currentColumn.metaDescription) score += 20;
    if (currentColumn.sections.length >= 5) score += 20;
    
    document.getElementById('seoScore').textContent = score;
}

// キーワード密度計算
function calculateKeywordDensity(text, keyword) {
    const normalizedText = text.toLowerCase();
    const normalizedKeyword = keyword.toLowerCase();
    
    const words = normalizedText.split(/\s+/);
    const matches = words.filter(w => w.includes(normalizedKeyword)).length;
    
    if (words.length === 0) return 0;
    return (matches / words.length) * 100;
}

// 編集ビューを表示
function showEditView() {
    document.getElementById('editView').classList.remove('hidden');
    document.getElementById('previewView').classList.add('hidden');
    document.getElementById('editViewBtn').classList.remove('bg-gray-500');
    document.getElementById('editViewBtn').classList.add('bg-purple-600');
    document.getElementById('previewViewBtn').classList.remove('bg-purple-600');
    document.getElementById('previewViewBtn').classList.add('bg-gray-500');
}

// プレビュービューを表示
function showPreviewView() {
    document.getElementById('editView').classList.add('hidden');
    document.getElementById('previewView').classList.remove('hidden');
    document.getElementById('editViewBtn').classList.remove('bg-purple-600');
    document.getElementById('editViewBtn').classList.add('bg-gray-500');
    document.getElementById('previewViewBtn').classList.remove('bg-gray-500');
    document.getElementById('previewViewBtn').classList.add('bg-purple-600');
    
    renderPreview();
}

// プレビューをレンダリング
function renderPreview() {
    const previewContent = document.getElementById('previewContent');
    
    let html = `
        <h1 class="text-3xl font-bold mb-6">${currentColumn.title}</h1>
        <div class="lead text-lg mb-8">${currentColumn.introduction}</div>
    `;
    
    currentColumn.sections.forEach((section, index) => {
        html += `
            <h2 class="text-2xl font-bold mt-8 mb-4">${section.heading}</h2>
            <p class="mb-4 whitespace-pre-wrap">${section.content}</p>
        `;
        
        // セクションの中間（2番目のセクション後）に診断チャートボタンを挿入
        if (index === 1 && currentColumn.sections.length > 2) {
            html += `
            <div class="my-8 p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white text-center">
                <h3 class="text-2xl font-bold mb-3">🔍 あなたの畳に最適な工法を診断</h3>
                <p class="mb-4 text-white opacity-90">簡単な質問に答えるだけで、あなたの畳に最適な工法と素材をご提案します。</p>
                <a href="/diagnosis" target="_blank" class="inline-block bg-white text-purple-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-all">
                    <i class="fas fa-clipboard-check mr-2"></i>無料診断を始める
                </a>
            </div>
            `;
        }
    });
    
    html += `
        <h2 class="text-2xl font-bold mt-8 mb-4">${currentColumn.closing.heading}</h2>
        <p class="mb-4 whitespace-pre-wrap">${currentColumn.closing.content}</p>
        
        <h2 class="text-2xl font-bold mt-8 mb-4">よくある質問</h2>
        <div class="space-y-4">
    `;
    
    currentColumn.qa.forEach(qa => {
        html += `
            <div class="border-l-4 border-purple-500 pl-4 py-2">
                <h3 class="font-bold text-lg mb-2">Q: ${qa.question}</h3>
                <p class="text-gray-700">A: ${qa.answer}</p>
            </div>
        `;
    });
    
    html += `</div>`;
    
    previewContent.innerHTML = html;
}

// クリップボードにコピー
async function copyToClipboard() {
    const text = generatePlainText();
    
    try {
        await navigator.clipboard.writeText(text);
        alert('コラムをクリップボードにコピーしました！');
    } catch (error) {
        console.error('Copy error:', error);
        alert('コピーに失敗しました');
    }
}

// プレーンテキスト生成
function generatePlainText() {
    let text = `${currentColumn.title}\n\n`;
    text += `${currentColumn.introduction}\n\n`;
    
    currentColumn.sections.forEach(section => {
        text += `${section.heading}\n${section.content}\n\n`;
    });
    
    text += `${currentColumn.closing.heading}\n${currentColumn.closing.content}\n\n`;
    text += `よくある質問\n\n`;
    
    currentColumn.qa.forEach(qa => {
        text += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
    });
    
    return text;
}

// HTML出力
function exportHTML() {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'column.html';
    a.click();
    URL.revokeObjectURL(url);
}

// HTML生成
function generateHTML() {
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${currentColumn.metaDescription || ''}">
    <meta name="keywords" content="${currentColumn.keywords?.join(', ') || ''}">
    <title>${currentColumn.title}</title>
    <style>
        body {
            font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            font-size: 2em;
            margin-bottom: 0.5em;
            border-bottom: 3px solid #667eea;
            padding-bottom: 0.3em;
        }
        h2 {
            font-size: 1.5em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #667eea;
        }
        h3 {
            font-size: 1.2em;
            margin-top: 1em;
            margin-bottom: 0.3em;
        }
        p {
            margin-bottom: 1em;
        }
        .lead {
            font-size: 1.1em;
            margin-bottom: 2em;
            padding: 1em;
            background: #f7f7f7;
            border-left: 4px solid #667eea;
        }
        .qa-item {
            margin-bottom: 1.5em;
            padding: 1em;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .qa-item h3 {
            margin-top: 0;
            color: #667eea;
        }
        .diagnosis-cta {
            margin: 2em 0;
            padding: 2em;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            text-align: center;
        }
        .diagnosis-cta h3 {
            color: white;
            margin-top: 0;
            margin-bottom: 0.5em;
        }
        .diagnosis-cta p {
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 1.5em;
        }
        .diagnosis-btn {
            display: inline-block;
            padding: 1em 2em;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .diagnosis-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <article>
        <h1>${currentColumn.title}</h1>
        <div class="lead">${currentColumn.introduction}</div>
`;
    
    currentColumn.sections.forEach((section, index) => {
        html += `
        <h2>${section.heading}</h2>
        <p>${section.content.replace(/\n/g, '<br>')}</p>
`;
        
        // セクションの中間（2番目のセクション後）に診断チャートボタンを挿入
        if (index === 1 && currentColumn.sections.length > 2) {
            html += `
        <div class="diagnosis-cta">
            <h3>🔍 あなたの畳に最適な工法を診断</h3>
            <p>簡単な質問に答えるだけで、あなたの畳に最適な工法と素材をご提案します。</p>
            <a href="/diagnosis" class="diagnosis-btn">
                <i class="fas fa-clipboard-check"></i> 無料診断を始める
            </a>
        </div>
`;
        }
    });
    
    html += `
        <h2>${currentColumn.closing.heading}</h2>
        <p>${currentColumn.closing.content.replace(/\n/g, '<br>')}</p>
        
        <h2>よくある質問</h2>
`;
    
    currentColumn.qa.forEach(qa => {
        html += `
        <div class="qa-item">
            <h3>Q: ${qa.question}</h3>
            <p>A: ${qa.answer}</p>
        </div>
`;
    });
    
    html += `
    </article>
</body>
</html>`;
    
    return html;
}

// ステップインジケーター更新
function updateStepIndicator(step) {
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step${i}`);
        if (i === step) {
            stepEl.classList.remove('opacity-50');
            stepEl.querySelector('div').className = 'w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold';
        } else if (i < step) {
            stepEl.classList.remove('opacity-50');
            stepEl.querySelector('div').className = 'w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold';
        } else {
            stepEl.classList.add('opacity-50');
            stepEl.querySelector('div').className = 'w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center font-bold';
        }
    }
}

// ステップ移動
function backToTheme() {
    // 前回の状態を完全にクリア
    currentColumn = null;
    selectedTitle = null;
    titleCandidates = [];
    websiteAnalysis = null;
    
    // キーワード入力欄はクリアしない（ユーザーが編集したい場合があるため）
    
    // タイトル選択ボタンを無効化
    document.getElementById('generateColumnBtn').disabled = true;
    
    // UIを切り替え
    document.getElementById('titleStep').classList.add('hidden');
    document.getElementById('themeStep').classList.remove('hidden');
    updateStepIndicator(1);
}

function backToTitles() {
    // 前回のコラムデータをクリア
    currentColumn = null;
    
    // UIを切り替え
    document.getElementById('columnStep').classList.add('hidden');
    document.getElementById('titleStep').classList.remove('hidden');
    updateStepIndicator(2);
}

function resetSteps() {
    document.getElementById('themeStep').classList.remove('hidden');
    document.getElementById('titleStep').classList.add('hidden');
    document.getElementById('columnStep').classList.add('hidden');
    updateStepIndicator(1);
}


