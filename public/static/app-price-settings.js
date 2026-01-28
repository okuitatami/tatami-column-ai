// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定管理画面
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentSettings = {};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 Price Settings Page initialized');
    loadPriceSettings();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定の読み込み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function loadPriceSettings() {
    try {
        showLoading('価格設定を読み込んでいます...');
        
        const response = await fetch('/api/price-settings');
        const data = await response.json();
        
        if (response.ok) {
            currentSettings = data.settings || {};
            renderPriceSettings();
            showNotification('価格設定を読み込みました', 'success');
        } else {
            showNotification('価格設定の読み込みに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Failed to load price settings:', error);
        showNotification('エラーが発生しました', 'error');
    } finally {
        hideLoading();
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定の表示
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderPriceSettings() {
    const categories = [
        { key: 'shincho', label: '新調工事', icon: 'fa-home' },
        { key: 'omote', label: '表替え', icon: 'fa-layer-group' },
        { key: 'uragaeshi', label: '裏返し', icon: 'fa-sync-alt' }
    ];
    
    categories.forEach(category => {
        const setting = currentSettings[category.key] || {};
        
        // 価格の表示
        document.getElementById(`${category.key}_min`).value = setting.min_price || '';
        document.getElementById(`${category.key}_max`).value = setting.max_price || '';
        document.getElementById(`${category.key}_popular`).value = setting.popular_price || '';
        document.getElementById(`${category.key}_unit`).value = setting.unit || '畳';
        
        // 工期の表示
        document.getElementById(`${category.key}_duration`).value = setting.duration || '';
        
        // プレビューの更新
        updatePreview(category.key);
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// プレビューの更新
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updatePreview(categoryKey) {
    const min = parseInt(document.getElementById(`${categoryKey}_min`).value) || 0;
    const max = parseInt(document.getElementById(`${categoryKey}_max`).value) || 0;
    const popular = parseInt(document.getElementById(`${categoryKey}_popular`).value) || 0;
    const unit = document.getElementById(`${categoryKey}_unit`).value || '畳';
    const duration = document.getElementById(`${categoryKey}_duration`).value || '—';
    
    const previewEl = document.getElementById(`${categoryKey}_preview`);
    
    if (min > 0 && max > 0) {
        previewEl.innerHTML = `
            <div class="text-sm text-gray-700">
                <p class="font-medium mb-1">診断結果での表示例：</p>
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    ${popular > 0 ? `
                        <div class="mb-2 inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                            <i class="fas fa-star mr-1"></i>人気プラン
                        </div>
                        <p class="font-bold text-2xl text-orange-600 mb-1">${popular.toLocaleString()}円<span class="text-sm text-gray-600">/${unit}</span></p>
                    ` : ''}
                    <p class="text-sm text-gray-600">${min.toLocaleString()}円 〜 ${max.toLocaleString()}円（/${unit}）</p>
                    <p class="text-sm text-gray-600 mt-1">工期の目安：${duration}</p>
                </div>
            </div>
        `;
    } else {
        previewEl.innerHTML = `
            <div class="text-sm text-gray-500">
                <p>価格を入力するとプレビューが表示されます</p>
            </div>
        `;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定の保存
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function savePriceSettings() {
    try {
        showLoading('価格設定を保存しています...');
        
        const categories = ['shincho', 'omote', 'uragaeshi'];
        const settings = {};
        
        categories.forEach(categoryKey => {
            settings[categoryKey] = {
                min_price: parseInt(document.getElementById(`${categoryKey}_min`).value) || 0,
                max_price: parseInt(document.getElementById(`${categoryKey}_max`).value) || 0,
                popular_price: parseInt(document.getElementById(`${categoryKey}_popular`).value) || 0,
                unit: document.getElementById(`${categoryKey}_unit`).value || '畳',
                duration: document.getElementById(`${categoryKey}_duration`).value || ''
            };
        });
        
        const response = await fetch('/api/price-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentSettings = settings;
            showNotification('価格設定を保存しました！', 'success');
            renderPriceSettings();
        } else {
            showNotification(data.error || '保存に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Failed to save price settings:', error);
        showNotification('エラーが発生しました', 'error');
    } finally {
        hideLoading();
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
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
