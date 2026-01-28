import { Hono } from 'hono';
import type { Bindings } from '../types';

const priceSettings = new Hono<{ Bindings: Bindings }>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定の取得
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
priceSettings.get('/', async (c) => {
  try {
    const userId = 'default'; // 本番環境では認証システムから取得
    
    const { results } = await c.env.DB.prepare(`
      SELECT category, min_price, max_price, popular_price, unit, duration
      FROM price_settings
      WHERE user_id = ?
      ORDER BY 
        CASE category
          WHEN 'shincho' THEN 1
          WHEN 'omote' THEN 2
          WHEN 'uragaeshi' THEN 3
          ELSE 4
        END
    `).bind(userId).all();
    
    // デフォルト値を設定
    const defaultSettings = {
      shincho: {
        category: 'shincho',
        min_price: 15000,
        max_price: 25000,
        popular_price: 18000,
        unit: '畳',
        duration: '1〜2日'
      },
      omote: {
        category: 'omote',
        min_price: 8000,
        max_price: 15000,
        popular_price: 10000,
        unit: '畳',
        duration: '半日〜1日'
      },
      uragaeshi: {
        category: 'uragaeshi',
        min_price: 5000,
        max_price: 8000,
        popular_price: 6000,
        unit: '畳',
        duration: '半日'
      }
    };
    
    // 既存設定をマージ
    const settingsMap = { ...defaultSettings };
    results.forEach((row: any) => {
      settingsMap[row.category] = row;
    });
    
    return c.json({
      success: true,
      settings: settingsMap
    });
  } catch (error) {
    console.error('価格設定取得エラー:', error);
    return c.json(
      { 
        success: false, 
        error: '価格設定の取得に失敗しました' 
      },
      500
    );
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 価格設定の保存
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
priceSettings.post('/', async (c) => {
  try {
    const userId = 'default'; // 本番環境では認証システムから取得
    const { settings } = await c.req.json();
    
    // トランザクション的な処理（既存データを削除してから挿入）
    await c.env.DB.prepare(`
      DELETE FROM price_settings WHERE user_id = ?
    `).bind(userId).run();
    
    // 各カテゴリーの設定を保存
    for (const [category, data] of Object.entries(settings)) {
      const setting: any = data;
      await c.env.DB.prepare(`
        INSERT INTO price_settings (user_id, category, min_price, max_price, popular_price, unit, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        category,
        setting.min_price,
        setting.max_price,
        setting.popular_price || 0,
        setting.unit,
        setting.duration
      ).run();
    }
    
    return c.json({
      success: true,
      message: '価格設定を保存しました'
    });
  } catch (error) {
    console.error('価格設定保存エラー:', error);
    return c.json(
      { 
        success: false, 
        error: '価格設定の保存に失敗しました' 
      },
      500
    );
  }
});

export default priceSettings;
