import { Hono } from 'hono';
import type { Bindings, WebsiteAnalysis } from '../types';
import { getAIClient } from '../lib/gemini-client';
import { 
  generateMetaDescription, 
  extractKeywords, 
  countCharacters,
  calculateKeywordDensity,
  calculateSEOScore 
} from '../utils/seo';

const column = new Hono<{ Bindings: Bindings }>();

// 今月の生成数を取得
column.get('/monthly-count', async (c) => {
  try {
    const db = c.env.DB;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startOfMonth = `${year}-${month}-01 00:00:00`;
    
    // 今月の生成数をカウント
    const result = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM column_generation_logs 
      WHERE created_at >= ?
    `).bind(startOfMonth).first<{ count: number }>();
    
    return c.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Monthly count error:', error);
    return c.json({ count: 0 });
  }
});

// タイトル候補を生成
column.post('/generate-titles', async (c) => {
  try {
    const { keywords, regions } = await c.req.json();

    if (!keywords || keywords.length < 2) {
      return c.json({ error: 'キーワードを最低2つ入力してください' }, 400);
    }

    // Gemini AIクライアントを取得
    const aiClient = getAIClient(c.env);
    if (!aiClient) {
      return c.json({ error: 'AI設定が不正です' }, 500);
    }

    // 会社情報を取得
    const companyInfo = {
      name: c.env.COMPANY_NAME || '御社',
      description: c.env.COMPANY_DESCRIPTION || '',
      strengths: c.env.COMPANY_STRENGTHS?.split(',').map((s: string) => s.trim()) || [],
      features: c.env.COMPANY_FEATURES?.split(',').map((s: string) => s.trim()) || [],
    };
    
    // タイトル候補を生成
    const titles = await aiClient.generateTitles(keywords, regions || [], companyInfo);

    return c.json({ titles });
  } catch (error) {
    console.error('Title generation error:', error);
    return c.json({ error: 'タイトルの生成に失敗しました' }, 500);
  }
});

// コラムを生成
column.post('/generate-column', async (c) => {
  try {
    const { keywords, regions, title, targetAudience } = await c.req.json();

    if (!keywords || keywords.length < 2) {
      return c.json({ error: 'キーワードを最低2つ入力してください' }, 400);
    }

    if (!title) {
      return c.json({ error: 'タイトルを選択してください' }, 400);
    }

    // Gemini AIクライアントを取得
    const aiClient = getAIClient(c.env);
    if (!aiClient) {
      return c.json({ error: 'AI設定が不正です' }, 500);
    }

    // 会社情報を取得
    const companyInfo = {
      name: c.env.COMPANY_NAME || '御社',
      description: c.env.COMPANY_DESCRIPTION || '',
      strengths: c.env.COMPANY_STRENGTHS?.split(',').map((s: string) => s.trim()) || [],
      features: c.env.COMPANY_FEATURES?.split(',').map((s: string) => s.trim()) || [],
      website: c.env.COMPANY_WEBSITE || '',
    };
    
    // コラムを生成
    const columnData = await aiClient.generateColumn(
      title,
      keywords,
      regions || [],
      companyInfo,
      targetAudience
    );

    // メタディスクリプション生成
    const metaDescription = generateMetaDescription(columnData.introduction, keywords);
    
    // SEO情報計算
    const fullText = `${columnData.title} ${columnData.introduction} ${columnData.sections.map(s => s.heading + ' ' + s.content).join(' ')} ${columnData.closing}`;
    const charCount = countCharacters(fullText);
    const extractedKeywords = extractKeywords(fullText);
    const keywordDensity = calculateKeywordDensity(fullText, keywords);
    const seoScore = calculateSEOScore(charCount, keywordDensity, !!metaDescription, keywords.length);

    // 今月の生成数をログに記録
    try {
      await c.env.DB.prepare(`
        INSERT INTO column_generation_logs (title, keywords, created_at)
        VALUES (?, ?, datetime('now'))
      `).bind(title, JSON.stringify(keywords)).run();
    } catch (logError) {
      console.error('Failed to log generation:', logError);
      // ログ失敗はエラーにしない
    }

    return c.json({
      column: columnData,
      seo: {
        metaDescription,
        charCount,
        extractedKeywords,
        keywordDensity,
        seoScore
      }
    });
  } catch (error) {
    console.error('Column generation error:', error);
    return c.json({ error: 'コラムの生成に失敗しました' }, 500);
  }
});

export default column;
