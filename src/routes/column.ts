import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getSessionIdFromCookie } from '../utils/auth';
import { getUserFromSession } from '../utils/db';
import { getAIProvider, getProviderFromEnv } from '../utils/ai-provider';
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

// ウェブサイトを解析
column.post('/analyze-website', async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ error: 'URLは必須です' }, 400);
    }

    // URLからHTMLを取得
    const response = await fetch(url);
    if (!response.ok) {
      return c.json({ error: 'ウェブサイトの取得に失敗しました' }, 400);
    }

    const html = await response.text();

    // AI Providerを取得してウェブサイトを解析
    const provider = getProviderFromEnv(c.env.AI_PROVIDER);
    const aiProvider = getAIProvider(provider, c.env.OPENAI_API_KEY, c.env.CLAUDE_API_KEY);
    const analysis = await aiProvider.analyzeWebsite(url, html);

    return c.json({ success: true, analysis });
  } catch (error) {
    console.error('Website analysis error:', error);
    return c.json({ 
      error: 'ウェブサイトの解析に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
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

    // AI Providerを取得してタイトル候補を生成（地域情報も渡す）
    const provider = getProviderFromEnv(c.env.AI_PROVIDER);
    const aiProvider = getAIProvider(provider, c.env.OPENAI_API_KEY, c.env.CLAUDE_API_KEY);
    const titles = await aiProvider.generateTitles(cleanedKeywords, cleanedRegions, websiteInfo);

    return c.json({ success: true, titles, provider });
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
    const { keywords, regions, title, websiteInfo } = await c.req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length < 2 || !title) {
      return c.json({ error: 'キーワード（最低2つ）とタイトルは必須です' }, 400);
    }

    // スペース削除と空要素フィルタリング
    const cleanedKeywords = keywords.map((k: string) => k.trim().replace(/\s+/g, '')).filter((k: string) => k);
    
    // 地域情報も同様に処理（任意なので空配列でもOK）
    const cleanedRegions = regions && Array.isArray(regions) 
      ? regions.map((r: string) => r.trim().replace(/\s+/g, '')).filter((r: string) => r)
      : [];

    // AI Providerを取得してコラムを生成（地域情報も渡す）
    const provider = getProviderFromEnv(c.env.AI_PROVIDER);
    const aiProvider = getAIProvider(provider, c.env.OPENAI_API_KEY, c.env.CLAUDE_API_KEY);
    const columnData = await aiProvider.generateColumn(cleanedKeywords, cleanedRegions, title, websiteInfo);

    // メタディスクリプションを生成
    const metaDescription = generateMetaDescription(columnData.introduction);
    columnData.metaDescription = metaDescription;

    // 全文を結合
    const fullText = [
      columnData.title,
      columnData.introduction,
      ...columnData.sections.map(s => s.heading + ' ' + s.content),
      columnData.closing.heading,
      columnData.closing.content,
      ...columnData.qa.map(q => q.question + ' ' + q.answer)
    ].join(' ');

    // 入力キーワードを最優先で設定し、残りを本文から抽出
    const extractedKeywords = extractKeywords(fullText, 3);
    columnData.keywords = [...cleanedKeywords, ...extractedKeywords].slice(0, 5);

    return c.json({ success: true, column: columnData, provider });
  } catch (error) {
    console.error('Column generation error:', error);
    return c.json({ 
      error: 'コラムの生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
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
