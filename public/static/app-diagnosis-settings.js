// 診断チャート設定管理
let currentSettings = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
});

// 設定を読み込み
async function loadSettings() {
    try {
        const response = await fetch('/api/diagnosis/settings', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            currentSettings = data.settings;
            displaySettings();
        } else {
            console.error('設定の読み込みに失敗:', data.error);
            // デフォルト設定を表示
            displaySettings();
        }
    } catch (error) {
        console.error('設定読み込みエラー:', error);
        displaySettings();
    }
}

// 設定を表示
function displaySettings() {
    const preferredMaterial = currentSettings?.preferred_material || 'both';
    const inquiryUrl = currentSettings?.inquiry_url || '';
    
    // ラジオボタンの選択状態を設定
    document.querySelectorAll('input[name="preferredMaterial"]').forEach(radio => {
        radio.checked = radio.value === preferredMaterial;
    });
    
    // URLフィールドを設定
    document.getElementById('inquiryUrl').value = inquiryUrl;
}

// 設定を保存
async function saveSettings() {
    const preferredMaterial = document.querySelector('input[name="preferredMaterial"]:checked').value;
    const inquiryUrl = document.getElementById('inquiryUrl').value.trim();
    
    // URLの検証
    if (inquiryUrl && !isValidUrl(inquiryUrl)) {
        alert('有効なURLを入力してください（例: https://example.com/contact）');
        return;
    }
    
    try {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
        
        const response = await fetch('/api/diagnosis/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                preferredMaterial: preferredMaterial,
                inquiryUrl: inquiryUrl || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ 設定を保存しました！');
            currentSettings = {
                preferred_material: preferredMaterial,
                inquiry_url: inquiryUrl
            };
        } else {
            alert('❌ ' + (data.error || '設定の保存に失敗しました'));
        }
    } catch (error) {
        console.error('保存エラー:', error);
        alert('❌ 設定の保存に失敗しました');
    } finally {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>設定を保存';
    }
}

// URL検証
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// 診断チャートをプレビュー
function previewDiagnosis() {
    window.open('/diagnosis', '_blank');
}
