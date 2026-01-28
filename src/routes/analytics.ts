import { Hono } from 'hono';
import type { Bindings } from '../types';

const analytics = new Hono<{ Bindings: Bindings }>();

const userId = 'default'; // 本番環境では認証システムから取得

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ページビューの記録
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.post('/pageview', async (c) => {
  try {
    const { article_id, article_title, timestamp } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO analytics_pageviews (user_id, article_id, article_title, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(userId, article_id, article_title, timestamp).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('ページビュー記録エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断開始の記録
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.post('/diagnosis-start', async (c) => {
  try {
    const { timestamp } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO analytics_diagnosis (user_id, event_type, timestamp)
      VALUES (?, 'start', ?)
    `).bind(userId, timestamp).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('診断開始記録エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 診断完了の記録
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.post('/diagnosis-complete', async (c) => {
  try {
    const { result, timestamp } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO analytics_diagnosis (user_id, event_type, result, timestamp)
      VALUES (?, 'complete', ?, ?)
    `).bind(userId, result, timestamp).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('診断完了記録エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 問い合わせクリックの記録
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.post('/contact-click', async (c) => {
  try {
    const { timestamp } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO analytics_conversions (user_id, event_type, timestamp)
      VALUES (?, 'contact_click', ?)
    `).bind(userId, timestamp).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('問い合わせクリック記録エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 電話タップの記録
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.post('/phone-click', async (c) => {
  try {
    const { timestamp, device } = await c.req.json();
    
    await c.env.DB.prepare(`
      INSERT INTO analytics_conversions (user_id, event_type, device, timestamp)
      VALUES (?, 'phone_click', ?, ?)
    `).bind(userId, device, timestamp).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('電話タップ記録エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 分析レポートの取得
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.get('/report', async (c) => {
  try {
    const period = c.req.query('period') || '30'; // デフォルト30日
    
    // 1. コラム別訪問数
    const pageviews = await c.env.DB.prepare(`
      SELECT 
        article_id,
        article_title,
        COUNT(*) as views
      FROM analytics_pageviews
      WHERE user_id = ?
        AND timestamp >= datetime('now', '-${period} days')
      GROUP BY article_id, article_title
      ORDER BY views DESC
    `).bind(userId).all();
    
    // 2. 総ページビュー数
    const totalPageviews = pageviews.results.reduce((sum: number, row: any) => sum + row.views, 0);
    
    // 3. 診断チャートの指標
    const diagnosisStats = await c.env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN event_type = 'start' THEN 1 ELSE 0 END) as starts,
        SUM(CASE WHEN event_type = 'complete' THEN 1 ELSE 0 END) as completes
      FROM analytics_diagnosis
      WHERE user_id = ?
        AND timestamp >= datetime('now', '-${period} days')
    `).bind(userId).first();
    
    // 4. コンバージョン指標
    const conversionStats = await c.env.DB.prepare(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM analytics_conversions
      WHERE user_id = ?
        AND timestamp >= datetime('now', '-${period} days')
      GROUP BY event_type
    `).bind(userId).all();
    
    // 計算
    const starts = diagnosisStats?.starts || 0;
    const completes = diagnosisStats?.completes || 0;
    const completionRate = starts > 0
      ? ((completes / starts) * 100).toFixed(1)
      : '0';
    
    const contactClicks = conversionStats.results.find((r: any) => r.event_type === 'contact_click')?.count || 0;
    const phoneClicks = conversionStats.results.find((r: any) => r.event_type === 'phone_click')?.count || 0;
    
    const contactRate = completes > 0
      ? ((contactClicks / completes) * 100).toFixed(1)
      : '0';
    
    const phoneRate = completes > 0
      ? ((phoneClicks / completes) * 100).toFixed(1)
      : '0';
    
    const totalConversions = contactClicks + phoneClicks;
    const totalConversionRate = completes > 0
      ? ((totalConversions / completes) * 100).toFixed(1)
      : '0';
    
    return c.json({
      success: true,
      period: `過去${period}日間`,
      summary: {
        totalPageviews,
        diagnosisStarts: starts,
        diagnosisCompletes: completes,
        completionRate: `${completionRate}%`,
        totalConversions,
        conversionRate: `${totalConversionRate}%`
      },
      pageviews: pageviews.results,
      diagnosis: {
        starts,
        completes,
        completionRate: `${completionRate}%`
      },
      conversions: {
        contactClicks,
        phoneClicks,
        contactRate: `${contactRate}%`,
        phoneRate: `${phoneRate}%`,
        totalConversions,
        totalConversionRate: `${totalConversionRate}%`
      }
    });
  } catch (error) {
    console.error('レポート取得エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSV出力
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
analytics.get('/export-csv', async (c) => {
  try {
    const period = c.req.query('period') || '30';
    
    // ページビューデータ取得
    const pageviews = await c.env.DB.prepare(`
      SELECT 
        article_id,
        article_title,
        timestamp
      FROM analytics_pageviews
      WHERE user_id = ?
        AND timestamp >= datetime('now', '-${period} days')
      ORDER BY timestamp DESC
    `).bind(userId).all();
    
    // CSV形式に変換
    let csv = 'タイプ,記事ID,記事タイトル,日時\n';
    pageviews.results.forEach((row: any) => {
      csv += `ページビュー,"${row.article_id}","${row.article_title}","${row.timestamp}"\n`;
    });
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('CSV出力エラー:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

export default analytics;
