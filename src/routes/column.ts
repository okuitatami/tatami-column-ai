import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getSessionIdFromCookie } from '../utils/auth';
import { getUserFromSession } from '../utils/db';
import { generateTitles, generateColumn, analyzeWebsite } from '../utils/claude';
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

    // Claude APIでウェブサイトを解析
    const analysis = await analyzeWebsite(c.env.CLAUDE_API_KEY, url, html);

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
    const { theme, websiteInfo } = await c.req.json();

    if (!theme) {
      return c.json({ error: 'テーマは必須です' }, 400);
    }

    // Claude APIでタイトル候補を生成
    const titles = await generateTitles(c.env.CLAUDE_API_KEY, theme, websiteInfo);

    return c.json({ success: true, titles });
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
    const { theme, title, websiteInfo } = await c.req.json();

    if (!theme || !title) {
      return c.json({ error: 'テーマとタイトルは必須です' }, 400);
    }

    // Claude APIでコラムを生成
    const columnData = await generateColumn(c.env.CLAUDE_API_KEY, theme, title, websiteInfo);

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

    // キーワードを抽出
    const keywords = extractKeywords(fullText, 5);
    columnData.keywords = keywords;

    return c.json({ success: true, column: columnData });
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
