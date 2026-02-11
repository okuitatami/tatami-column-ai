import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getSessionIdFromCookie } from '../utils/auth';
import { getUserFromSession } from '../utils/db';
import { getAIClient } from '../lib/gemini-client';
import { 
  generateMetaDescription, 
  extractKeywords, 
  countCharacters,
  calculateKeywordDensity,
  calculateSEOScore 
} from '../utils/seo';

const column = new Hono<{ Bindings: Bindings }>();

// 認証ミドルウェア
column.use('*', async (c, next) => {
  const sessionId = getSessionIdFromCookie(c.req.header('Cookie') || '');
  
  if (!sessionId) {
    return c.json({ error: '認証が必要です' }, 401);
  }

  const user = await getUserFromSession(c.env.DB, sessionId);
  if (!user) {
    return c.json({ error: 'セッションが無効です' }, 401);
  }

  // ユーザー情報をコンテキストに保存
  c.set('user', user);
  await next();
});

// ウェブサイトを解析（一時的に無効化）
column.post('/analyze-website', async (c) => {
  return c.json({ error: 'この機能は現在メンテナンス中です' }, 503);
});

// タイトル候補を生成
column.post('/generate-titles', async (c) => {
  try {
    const { keywords, regions, websiteInfo } = await c.req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length < 2) {
      return c.json({ error: 'キーワードを最低2つ入力してください' }, 400);
    }

    // スペース削除と空要素フィルタリング
    const cleanedKeywords = keywords.map((k: string) => k.trim().replace(/\s+/g, '')).filter((k: string) => k);
    
    // 地域情報も同様に処理（任意なので空配列でもOK）
    const cleanedRegions = regions && Array.isArray(regions) 
      ? regions.map((r: string) => r.trim().replace(/\s+/g, '')).filter((r: string) => r)
      : [];

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
    const titles = await aiClient.generateTitles(cleanedKeywords, cleanedRegions, companyInfo);

    // タイトルをオブジェクト形式に変換（フロントエンド互換性のため）
    const formattedTitles = titles.map((title, index) => ({
      id: `title-${Date.now()}-${index}`,
      title: title,
      description: `${cleanedKeywords.join('、')}に関するコラム${cleanedRegions.length > 0 ? `（対象地域：${cleanedRegions.join('、')}）` : ''}`
    }));

    return c.json({ success: true, titles: formattedTitles, provider: 'gemini' });
  } catch (error) {
    console.error('Title generation error:', error);
    return c.json({ 
      error: 'タイトル候補の生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// コラムを生成
column.post('/generate-column', async (c) => {
  try {
    const { keywords, regions, title, targetAudience, websiteInfo } = await c.req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length < 2 || !title) {
      return c.json({ error: 'キーワード（最低2つ）とタイトルは必須です' }, 400);
    }

    // スペース削除と空要素フィルタリング
    const cleanedKeywords = keywords.map((k: string) => k.trim().replace(/\s+/g, '')).filter((k: string) => k);
    
    // 地域情報も同様に処理（任意なので空配列でもOK）
    const cleanedRegions = regions && Array.isArray(regions) 
      ? regions.map((r: string) => r.trim().replace(/\s+/g, '')).filter((r: string) => r)
      : [];

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

    // AI学習データを取得
    const user = c.get('user');
    let learningContext = '';
    if (user) {
      try {
        const { getRecentCorrections, formatCorrectionsForPrompt } = await import('../utils/ai-learning');
        const corrections = await getRecentCorrections(c.env.DB, user.id, cleanedKeywords, 5);
        learningContext = formatCorrectionsForPrompt(corrections);
      } catch (learningError) {
        console.error('Failed to fetch learning data:', learningError);
        // 学習データ取得失敗してもコラム生成は続行
      }
    }

    // コラムを生成
    const columnData = await aiClient.generateColumn(
      title,
      cleanedKeywords,
      cleanedRegions,
      companyInfo,
      targetAudience,
      learningContext
    );

    // メタディスクリプションを生成
    const metaDescription = generateMetaDescription(columnData.introduction);
    columnData.metaDescription = metaDescription;

    // closingをオブジェクト形式に変換（フロントエンド互換性のため）
    if (typeof columnData.closing === 'string') {
      columnData.closing = {
        heading: 'まとめ',
        content: columnData.closing
      };
    }

    // 全文を結合
    const fullText = [
      columnData.title,
      columnData.introduction,
      ...columnData.sections.map(s => s.heading + ' ' + s.content),
      typeof columnData.closing === 'string' ? columnData.closing : columnData.closing.content,
      ...columnData.qa.map(q => q.question + ' ' + q.answer)
    ].join(' ');

    // 入力キーワードを最優先で設定し、残りを本文から抽出
    const extractedKeywords = extractKeywords(fullText, 3);
    columnData.keywords = [...cleanedKeywords, ...extractedKeywords].slice(0, 5);

    // コラム履歴を保存（userは既に123行目で宣言済み）
    if (user) {
      const { saveColumnHistory } = await import('../utils/db');
      try {
        await saveColumnHistory(
          c.env.DB,
          user.id,
          columnData,
          cleanedKeywords,
          cleanedRegions,
          targetAudience
        );
      } catch (historyError) {
        console.error('Failed to save column history:', historyError);
        // 履歴保存失敗してもコラム生成は成功とする
      }
    }

    return c.json({ success: true, column: columnData, provider: 'gemini' });
  } catch (error) {
    console.error('Column generation error:', error);
    return c.json({ 
      error: 'コラムの生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// コラム履歴を取得
column.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const { getColumnHistoryByUser } = await import('../utils/db');
    
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const history = await getColumnHistoryByUser(c.env.DB, user.id, limit, offset);
    
    return c.json({ success: true, history });
  } catch (error) {
    console.error('Get history error:', error);
    return c.json({ error: '履歴の取得に失敗しました' }, 500);
  }
});

// コラム履歴を検索
column.get('/history/search', async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query('q') || '';
    
    if (!query) {
      return c.json({ error: '検索クエリは必須です' }, 400);
    }
    
    const { searchColumnHistory } = await import('../utils/db');
    const history = await searchColumnHistory(c.env.DB, user.id, query);
    
    return c.json({ success: true, history });
  } catch (error) {
    console.error('Search history error:', error);
    return c.json({ error: '履歴の検索に失敗しました' }, 500);
  }
});

// コラム履歴を取得（ID指定）
column.get('/history/:id', async (c) => {
  try {
    const user = c.get('user');
    const historyId = parseInt(c.req.param('id'));
    
    const { getColumnHistoryById, columnHistoryToStructure } = await import('../utils/db');
    const history = await getColumnHistoryById(c.env.DB, historyId, user.id);
    
    if (!history) {
      return c.json({ error: '履歴が見つかりません' }, 404);
    }
    
    const column = columnHistoryToStructure(history);
    
    return c.json({ success: true, history, column });
  } catch (error) {
    console.error('Get history by ID error:', error);
    return c.json({ error: '履歴の取得に失敗しました' }, 500);
  }
});

// コラム履歴を削除
column.delete('/history/:id', async (c) => {
  try {
    const user = c.get('user');
    const historyId = parseInt(c.req.param('id'));
    
    const { deleteColumnHistory } = await import('../utils/db');
    await deleteColumnHistory(c.env.DB, historyId, user.id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete history error:', error);
    return c.json({ error: '履歴の削除に失敗しました' }, 500);
  }
});

// SEO分析
column.post('/analyze-seo', async (c) => {
  try {
    const { text, keyword } = await c.req.json();

    if (!text) {
      return c.json({ error: 'テキストは必須です' }, 400);
    }

    const characterCount = countCharacters(text);
    const keywordDensity = keyword ? calculateKeywordDensity(text, keyword) : 0;
    const keywords = extractKeywords(text, 5);
    const metaDescription = generateMetaDescription(text.substring(0, 500));
    const seoScore = calculateSEOScore(
      characterCount, 
      keywordDensity, 
      metaDescription.length > 0,
      keywords.length
    );

    return c.json({
      success: true,
      analysis: {
        characterCount,
        keywordDensity,
        keywords,
        metaDescription,
        seoScore
      }
    });
  } catch (error) {
    console.error('SEO analysis error:', error);
    return c.json({ error: 'SEO分析に失敗しました' }, 500);
  }
});

export default column;
