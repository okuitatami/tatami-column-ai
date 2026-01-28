// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// グローバル変数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let titleCandidates = [];
let selectedTitle = null;
let currentColumn = null;
let goodCount = 0;
let correctionCount = 0;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タイトル生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateTitles() {
  const keyword1 = document.getElementById('keyword1').value.trim();
  const keyword2 = document.getElementById('keyword2').value.trim();
  const keyword3 = document.getElementById('keyword3').value.trim();
  const keyword4 = document.getElementById('keyword4').value.trim();

  if (!keyword1) {
    alert('キーワード1は必須です');
    return;
  }

  const keywords = [keyword1, keyword2, keyword3, keyword4].filter(k => k);

  // ローディング表示
  showLoading('タイトルを生成しています...');

  try {
    const response = await fetch('/api/training/generate-titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'タイトル生成に失敗しました');
    }

    titleCandidates = data.titles;
    renderTitles();
    showStep(2);
  } catch (error) {
    console.error('Title generation error:', error);
    alert(error.message);
  } finally {
    hideLoading();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タイトル表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderTitles() {
  const titleList = document.getElementById('title-list');
  titleList.innerHTML = titleCandidates.map((title, index) => `
    <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all"
         onclick="selectTitle('${title.id}')">
      <div class="flex items-start">
        <input type="radio" name="title" id="title-${title.id}" 
               class="mt-1 mr-3" onclick="selectTitle('${title.id}')">
        <div class="flex-1">
          <label for="title-${title.id}" class="font-bold text-lg text-gray-800 mb-2 block cursor-pointer">
            ${index + 1}. ${title.title}
          </label>
          <p class="text-sm text-gray-600">${title.description}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タイトル選択
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function selectTitle(titleId) {
  selectedTitle = titleCandidates.find(t => t.id === titleId);
  document.getElementById('generate-column-btn').disabled = false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラム生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateColumn() {
  if (!selectedTitle) {
    alert('タイトルを選択してください');
    return;
  }

  const keyword1 = document.getElementById('keyword1').value.trim();
  const keyword2 = document.getElementById('keyword2').value.trim();
  const keyword3 = document.getElementById('keyword3').value.trim();
  const keyword4 = document.getElementById('keyword4').value.trim();
  const keywords = [keyword1, keyword2, keyword3, keyword4].filter(k => k);

  // ローディング表示
  showLoading('コラムを生成しています...<br><span class="text-sm">約3000文字のコラムを作成中...</span>');

  try {
    const response = await fetch('/api/training/generate-column', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keywords, 
        title: selectedTitle.title 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'コラム生成に失敗しました');
    }

    currentColumn = data.column;
    renderColumn();
    showStep(3);
  } catch (error) {
    console.error('Column generation error:', error);
    alert(error.message);
  } finally {
    hideLoading();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラム表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderColumn() {
  const columnContent = document.getElementById('column-content');
  
  let html = `
    <!-- タイトル -->
    <div class="section-card bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
      <h1 class="text-3xl font-bold text-gray-800">${currentColumn.title}</h1>
    </div>

    <!-- 導入文 -->
    <div class="section-card bg-white rounded-xl p-6 border-2 border-gray-200" data-section-id="introduction" data-section-type="introduction">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-book-open mr-2 text-blue-600"></i>
          導入文
        </h3>
        <div class="flex gap-2">
          <button onclick="markGood('introduction')" class="good-btn text-white px-4 py-2 rounded-lg hover:opacity-90">
            <i class="fas fa-thumbs-up mr-1"></i> Good
          </button>
          <button onclick="markBad('introduction')" class="bad-btn text-white px-4 py-2 rounded-lg hover:opacity-90">
            <i class="fas fa-thumbs-down mr-1"></i> Bad
          </button>
        </div>
      </div>
      <div class="content-text">
        <p class="text-gray-700 leading-relaxed" id="introduction-text">${currentColumn.introduction}</p>
      </div>
      <div class="edit-area hidden mt-4">
        <textarea id="introduction-edit" class="w-full p-4 border-2 border-orange-300 rounded-lg" rows="4">${currentColumn.introduction}</textarea>
        <button onclick="saveCorrection('introduction')" class="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
          <i class="fas fa-save mr-1"></i> 保存
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2">${currentColumn.introduction.length}文字</p>
    </div>
  `;

  // セクション
  currentColumn.sections.forEach((section, index) => {
    html += `
    <div class="section-card bg-white rounded-xl p-6 border-2 border-gray-200" data-section-id="${section.id}" data-section-type="section">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-paragraph mr-2 text-green-600"></i>
          ${section.heading}
        </h3>
        <div class="flex gap-2">
          <button onclick="markGood('${section.id}')" class="good-btn text-white px-4 py-2 rounded-lg hover:opacity-90">
            <i class="fas fa-thumbs-up mr-1"></i> Good
          </button>
          <button onclick="markBad('${section.id}')" class="bad-btn text-white px-4 py-2 rounded-lg hover:opacity-90">
            <i class="fas fa-thumbs-down mr-1"></i> Bad
          </button>
        </div>
      </div>
      <div class="content-text">
        <p class="text-gray-700 leading-relaxed" id="${section.id}-text">${section.content}</p>
      </div>
      <div class="edit-area hidden mt-4">
        <textarea id="${section.id}-edit" class="w-full p-4 border-2 border-orange-300 rounded-lg" rows="6">${section.content}</textarea>
        <button onclick="saveCorrection('${section.id}')" class="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
          <i class="fas fa-save mr-1"></i> 保存
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2">${section.content.length}文字</p>
    </div>
    `;
  });

  // まとめ
  html += `
    <div class="section-card bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200" data-section-id="closing" data-section-type="closing">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-check-circle mr-2 text-orange-600"></i>
          ${currentColumn.closing.heading}
        </h3>
        <div class="flex gap-2">
          <button onclick="markGood('closing')" class="good-btn text-white px-4 py-2 rounded-lg hover:opacity-90">
            <i class="fas fa-thumbs-up mr-1"></i> Good
          </button>
          <button onclick="markBad('closing')" class="bad-btn text-white px-4 py-2 rounded-lg hover:opacity-90">
            <i class="fas fa-thumbs-down mr-1"></i> Bad
          </button>
        </div>
      </div>
      <div class="content-text">
        <p class="text-gray-700 leading-relaxed" id="closing-text">${currentColumn.closing.content}</p>
      </div>
      <div class="edit-area hidden mt-4">
        <textarea id="closing-edit" class="w-full p-4 border-2 border-orange-300 rounded-lg" rows="4">${currentColumn.closing.content}</textarea>
        <button onclick="saveCorrection('closing')" class="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
          <i class="fas fa-save mr-1"></i> 保存
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2">${currentColumn.closing.content.length}文字</p>
    </div>
  `;

  // Q&A
  html += `<div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
    <h3 class="text-xl font-bold text-gray-800 mb-4">
      <i class="fas fa-question-circle mr-2 text-purple-600"></i>
      よくある質問
    </h3>
    <div class="space-y-4">`;
  
  currentColumn.qa.forEach((item, index) => {
    html += `
    <div class="section-card bg-white rounded-lg p-4" data-section-id="${item.id}" data-section-type="qa">
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-bold text-gray-800">
          <i class="fas fa-q text-purple-600 mr-2"></i>
          ${item.question}
        </h4>
        <div class="flex gap-2">
          <button onclick="markGood('${item.id}')" class="good-btn text-white px-3 py-1 text-sm rounded hover:opacity-90">
            <i class="fas fa-thumbs-up"></i>
          </button>
          <button onclick="markBad('${item.id}')" class="bad-btn text-white px-3 py-1 text-sm rounded hover:opacity-90">
            <i class="fas fa-thumbs-down"></i>
          </button>
        </div>
      </div>
      <div class="content-text">
        <p class="text-gray-700 pl-8" id="${item.id}-text">
          <i class="fas fa-a text-green-600 mr-2"></i>
          ${item.answer}
        </p>
      </div>
      <div class="edit-area hidden mt-2">
        <textarea id="${item.id}-edit" class="w-full p-3 border-2 border-orange-300 rounded-lg" rows="3">${item.answer}</textarea>
        <button onclick="saveCorrection('${item.id}')" class="mt-2 bg-orange-500 text-white px-3 py-1 text-sm rounded hover:bg-orange-600">
          <i class="fas fa-save mr-1"></i> 保存
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1 pl-8">${item.answer.length}文字</p>
    </div>
    `;
  });

  html += `</div></div>`;

  // 文字数カウント
  const totalChars = 
    currentColumn.introduction.length +
    currentColumn.sections.reduce((sum, s) => sum + s.content.length, 0) +
    currentColumn.closing.content.length +
    currentColumn.qa.reduce((sum, q) => sum + q.answer.length, 0);

  html += `
    <div class="bg-gradient-to-r from-blue-100 to-green-100 rounded-xl p-6 border-2 border-blue-300">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">合計文字数</p>
          <p class="text-4xl font-bold text-blue-600">${totalChars}文字</p>
        </div>
        <div>
          <i class="fas fa-file-alt text-6xl text-blue-300"></i>
        </div>
      </div>
      <p class="text-xs text-gray-600 mt-2">
        <i class="fas fa-info-circle mr-1"></i>
        目標: 3000文字前後
      </p>
    </div>
  `;

  columnContent.innerHTML = html;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Good評価
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function markGood(sectionId) {
  goodCount++;
  document.getElementById('good-count').textContent = goodCount;
  
  // アニメーション効果
  const sectionCard = document.querySelector(`[data-section-id="${sectionId}"]`);
  sectionCard.classList.add('bg-green-50');
  setTimeout(() => {
    sectionCard.classList.remove('bg-green-50');
  }, 1000);

  showNotification('Good評価を記録しました！', 'success');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bad評価（編集モードに切り替え）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function markBad(sectionId) {
  const sectionCard = document.querySelector(`[data-section-id="${sectionId}"]`);
  const contentText = sectionCard.querySelector('.content-text');
  const editArea = sectionCard.querySelector('.edit-area');

  // 編集モードに切り替え
  contentText.classList.add('hidden');
  editArea.classList.remove('hidden');
  sectionCard.classList.add('edit-mode');

  showNotification('修正モードに切り替えました。内容を編集してください。', 'info');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 添削を保存
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function saveCorrection(sectionId) {
  const sectionCard = document.querySelector(`[data-section-id="${sectionId}"]`);
  const sectionType = sectionCard.dataset.sectionType;
  const originalText = document.getElementById(`${sectionId}-text`).textContent.trim();
  const correctedText = document.getElementById(`${sectionId}-edit`).value.trim();

  if (originalText === correctedText) {
    alert('変更がありません');
    return;
  }

  try {
    const response = await fetch('/api/training/save-correction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionId,
        sectionType,
        originalText,
        correctedText
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '保存に失敗しました');
    }

    // 表示を更新
    document.getElementById(`${sectionId}-text`).textContent = correctedText;
    
    // 編集モードを終了
    const contentText = sectionCard.querySelector('.content-text');
    const editArea = sectionCard.querySelector('.edit-area');
    contentText.classList.remove('hidden');
    editArea.classList.add('hidden');
    sectionCard.classList.remove('edit-mode');

    // カウント更新
    correctionCount++;
    document.getElementById('correction-count').textContent = correctionCount;

    showNotification('添削データを保存しました！将来のAI学習に使用されます。', 'success');
  } catch (error) {
    console.error('Save correction error:', error);
    alert(error.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ステップ表示切り替え
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showStep(step) {
  // すべてのステップを非表示
  document.getElementById('step1-content').classList.add('hidden');
  document.getElementById('step2-content').classList.add('hidden');
  document.getElementById('step3-content').classList.add('hidden');

  // インジケーター更新
  document.getElementById('step1-indicator').classList.remove('active');
  document.getElementById('step2-indicator').classList.remove('active');
  document.getElementById('step3-indicator').classList.remove('active');

  // 指定されたステップを表示
  if (step === 1) {
    document.getElementById('step1-content').classList.remove('hidden');
    document.getElementById('step1-indicator').classList.add('active');
  } else if (step === 2) {
    document.getElementById('step2-content').classList.remove('hidden');
    document.getElementById('step2-indicator').classList.add('active');
  } else if (step === 3) {
    document.getElementById('step3-content').classList.remove('hidden');
    document.getElementById('step3-indicator').classList.add('active');
  }

  // ページトップにスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// プレビュー表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showPreview() {
  if (!currentColumn) {
    alert('コラムが生成されていません');
    return;
  }

  // コラム全体のテキストを生成
  let fullText = `${currentColumn.title}\n\n`;
  fullText += `${currentColumn.introduction}\n\n`;
  
  currentColumn.sections.forEach(section => {
    fullText += `■ ${section.heading}\n\n`;
    fullText += `${section.content}\n\n`;
  });
  
  fullText += `■ ${currentColumn.closing.heading}\n\n`;
  fullText += `${currentColumn.closing.content}\n\n`;
  
  fullText += `【よくある質問】\n\n`;
  currentColumn.qa.forEach((item, index) => {
    fullText += `Q${index + 1}: ${item.question}\n`;
    fullText += `A${index + 1}: ${item.answer}\n\n`;
  });

  // モーダルを表示
  const modal = document.createElement('div');
  modal.id = 'preview-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 flex justify-between items-center">
        <h2 class="text-2xl font-bold">
          <i class="fas fa-eye mr-2"></i>
          コラムプレビュー
        </h2>
        <button onclick="closePreview()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto flex-1">
        <div class="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
          <pre id="preview-text" class="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">${fullText}</pre>
        </div>
      </div>
      
      <div class="p-6 bg-gray-50 border-t-2 border-gray-200">
        <div class="flex gap-4">
          <button onclick="copyToClipboard()" 
                  class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
            <i class="fas fa-copy mr-2"></i>
            全文をコピー
          </button>
          <button onclick="closePreview()" 
                  class="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all">
            <i class="fas fa-times mr-2"></i>
            閉じる
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-4 text-center">
          <i class="fas fa-info-circle mr-1"></i>
          合計文字数: <span class="font-bold text-blue-600">${fullText.length}文字</span>
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// プレビューを閉じる
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function closePreview() {
  const modal = document.getElementById('preview-modal');
  if (modal) {
    modal.remove();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// クリップボードにコピー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function copyToClipboard() {
  const previewText = document.getElementById('preview-text');
  if (!previewText) return;

  try {
    await navigator.clipboard.writeText(previewText.textContent);
    showNotification('コラム全文をクリップボードにコピーしました！', 'success');
    
    // ボタンのテキストを一時的に変更
    const copyBtn = event.target.closest('button');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>コピー完了！';
    copyBtn.classList.add('bg-green-600');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.classList.remove('bg-green-600');
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('コピーに失敗しました。手動で選択してコピーしてください。');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 最初に戻る（スーパーリロード）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function resetToStart() {
  if (confirm('ページを更新して最初から新しいコラムを作成しますか？\n現在のコラムデータは保存されていません。')) {
    location.reload(true);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// キーワード入力に戻る
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function backToKeywords() {
  titleCandidates = [];
  selectedTitle = null;
  document.getElementById('generate-column-btn').disabled = true;
  showStep(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ローディング表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showLoading(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-overlay';
  loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loadingDiv.innerHTML = `
    <div class="bg-white rounded-xl p-8 max-w-md text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <p class="text-lg font-semibold text-gray-800">${message}</p>
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    loading.remove();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 通知表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSSスタイル追加
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const style = document.createElement('style');
style.textContent = `
  .step-indicator {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #9ca3af;
    transition: all 0.3s ease;
  }
  .step-indicator.active {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
  }
  @keyframes slide-in {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);
