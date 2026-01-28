// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析ダッシュボード
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let analyticsData = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 Analytics Dashboard initialized');
    loadAnalytics('7d');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析データの読み込み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function loadAnalytics(period = '7d') {
    try {
        showLoading('データを読み込んでいます...');
        
        const response = await fetch(`/api/analytics/report?period=${period}`);
        const data = await response.json();
        
        if (response.ok) {
            analyticsData = data;
            renderAnalytics();
            showNotification('データを読み込みました', 'success');
        } else {
            showNotification('データの読み込みに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
        showNotification('エラーが発生しました', 'error');
    } finally {
        hideLoading();
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// アクセス解析データの描画
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderAnalytics() {
    if (!analyticsData) return;
    
    // サマリーカードの更新
    renderSummaryCards();
    
    // コンバージョンファネルの更新
    renderConversionFunnel();
    
    // 人気コラムランキングの更新
    renderPopularColumns();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// サマリーカードの描画
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderSummaryCards() {
    const { summary } = analyticsData;
    
    // 総訪問者数
    document.getElementById('totalPageviews').textContent = summary.total_pageviews.toLocaleString();
    
    // 診断開始数
    document.getElementById('diagnosisStarts').textContent = summary.diagnosis_starts.toLocaleString();
    
    // 診断完了数
    document.getElementById('diagnosisCompletes').textContent = summary.diagnosis_completes.toLocaleString();
    
    // お問い合わせ数
    const totalContacts = summary.contact_clicks + summary.phone_clicks;
    document.getElementById('totalContacts').textContent = totalContacts.toLocaleString();
    
    // 診断完了率
    const diagnosisRate = summary.diagnosis_starts > 0 
        ? ((summary.diagnosis_completes / summary.diagnosis_starts) * 100).toFixed(1)
        : 0;
    document.getElementById('diagnosisRate').textContent = `${diagnosisRate}%`;
    
    // コンバージョン率
    const conversionRate = summary.total_pageviews > 0
        ? ((totalContacts / summary.total_pageviews) * 100).toFixed(1)
        : 0;
    document.getElementById('conversionRate').textContent = `${conversionRate}%`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コンバージョンファネルの描画
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderConversionFunnel() {
    const { funnel } = analyticsData;
    const funnelContainer = document.getElementById('funnelChart');
    
    const maxValue = funnel.total_pageviews || 1;
    
    funnelContainer.innerHTML = `
        <div class="space-y-4">
            ${renderFunnelBar('訪問者数', funnel.total_pageviews, maxValue, 'bg-blue-500')}
            ${renderFunnelBar('診断開始', funnel.diagnosis_starts, maxValue, 'bg-purple-500')}
            ${renderFunnelBar('診断完了', funnel.diagnosis_completes, maxValue, 'bg-green-500')}
            ${renderFunnelBar('お問い合わせ', funnel.contact_clicks + funnel.phone_clicks, maxValue, 'bg-orange-500')}
        </div>
    `;
}

function renderFunnelBar(label, value, maxValue, colorClass) {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    return `
        <div>
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">${label}</span>
                <span class="text-sm font-bold text-gray-800">${value.toLocaleString()}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4">
                <div class="${colorClass} h-4 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 人気コラムランキングの描画
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderPopularColumns() {
    const { popular_columns } = analyticsData;
    const listContainer = document.getElementById('popularColumnsList');
    
    if (popular_columns.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>まだデータがありません</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = popular_columns.map((column, index) => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-4 flex-1">
                <div class="flex-shrink-0 w-8 h-8 rounded-full ${getRankColor(index)} text-white flex items-center justify-center font-bold">
                    ${index + 1}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${column.title || column.path}</p>
                    <p class="text-xs text-gray-500">${column.path}</p>
                </div>
            </div>
            <div class="flex items-center space-x-6 text-right">
                <div>
                    <p class="text-xs text-gray-500">訪問数</p>
                    <p class="text-lg font-bold text-blue-600">${column.pageviews.toLocaleString()}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function getRankColor(index) {
    const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-400', 'bg-purple-500', 'bg-blue-500'];
    return colors[index] || 'bg-gray-300';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSVエクスポート
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function exportCSV() {
    try {
        showLoading('CSVを生成しています...');
        
        const period = document.getElementById('periodSelector').value;
        const response = await fetch(`/api/analytics/export?period=${period}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('CSVをダウンロードしました', 'success');
        } else {
            showNotification('エクスポートに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Failed to export CSV:', error);
        showNotification('エラーが発生しました', 'error');
    } finally {
        hideLoading();
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 期間変更
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function changePeriod(period) {
    loadAnalytics(period);
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
