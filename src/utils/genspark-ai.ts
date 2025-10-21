import type { TitleCandidate, ColumnStructure, WebsiteAnalysis } from '../types';

// GenSpark AI APIエンドポイント（内部API）
// GenSparkのAI機能を直接利用
const GENSPARK_AI_ENDPOINT = 'https://api.genspark.ai/v1/chat/completions';

// GenSpark AIを呼び出す基本関数
async function callGenSparkAI(prompt: string, systemPrompt?: string): Promise<string> {
  // GenSpark AIの内部APIを使用
  // 注: 実際の実装ではGenSparkの認証トークンが必要な場合があります
  
  const response = await fetch(GENSPARK_AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',  // GenSparkが提供するモデル
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    // エラー時の詳細ログ
    const errorText = await response.text();
    console.error('GenSpark AI Error:', response.status, errorText);
    throw new Error(`GenSpark AI Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}

// タイトル候補を生成
export async function generateTitles(
  theme: string,
  websiteInfo?: WebsiteAnalysis
): Promise<TitleCandidate[]> {
  const websiteContext = websiteInfo 
    ? `\n\n参考情報：このコラムは以下のウェブサイト向けです：\n- サイト名: ${websiteInfo.title || '不明'}\n- 説明: ${websiteInfo.description || '不明'}\n- 特徴: ${websiteInfo.features?.join(', ') || '不明'}\n- 強み: ${websiteInfo.strengths?.join(', ') || '不明'}`
    : '';

  const prompt = `以下のテーマについて、SEO最適化されたコラムタイトルを5つ提案してください。

テーマ: ${theme}${websiteContext}

要件:
- 検索されやすいキーワードを含める
- 読者の興味を引く表現
- 30文字前後
- 畳・襖などの和室関連キーワードに対応

JSON形式で以下のように出力してください：
[
  {
    "id": "1",
    "title": "タイトル1",
    "description": "このタイトルの特徴や狙い"
  },
  ...
]`;

  const systemPrompt = 'あなたはSEOとコンテンツマーケティングの専門家です。日本語で回答してください。';
  
  const response = await callGenSparkAI(prompt, systemPrompt);
  
  // JSONを抽出（マークダウンのコードブロックを削除）
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('タイトル候補の生成に失敗しました');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// コラムを生成
export async function generateColumn(
  theme: string,
  selectedTitle: string,
  websiteInfo?: WebsiteAnalysis
): Promise<ColumnStructure> {
  const websiteContext = websiteInfo 
    ? `\n\n【サイト情報を反映】\n以下のウェブサイトの特徴や強みを自然に盛り込んでください：\n- サイト名: ${websiteInfo.title || '不明'}\n- 説明: ${websiteInfo.description || '不明'}\n- 主要コンテンツ: ${websiteInfo.mainContent || '不明'}\n- 特徴: ${websiteInfo.features?.join(', ') || '不明'}\n- 強み: ${websiteInfo.strengths?.join(', ') || '不明'}`
    : '';

  const prompt = `以下の条件でSEO最適化されたコラム記事を作成してください。

テーマ: ${theme}
タイトル: ${selectedTitle}${websiteContext}

記事構成:
1. 導入文（200-300文字）
2. 見出し1〜5（各見出しに400-600文字の本文）
3. クロージング見出し + 本文（300-400文字）
4. Q&A（3-4個、各質問に150-200文字の回答）

要件:
- 合計3000文字程度
- SEOを意識したキーワード配置
- 読みやすく、わかりやすい文章
- 専門的だが親しみやすいトーン
- 畳・襖などの和室関連であれば、専門知識を盛り込む

JSON形式で以下のように出力してください：
{
  "title": "タイトル",
  "introduction": "導入文",
  "sections": [
    {
      "heading": "見出し1",
      "content": "本文1"
    },
    ...（見出し5まで）
  ],
  "closing": {
    "heading": "クロージング見出し",
    "content": "クロージング本文"
  },
  "qa": [
    {
      "question": "質問1",
      "answer": "回答1"
    },
    ...（3-4個）
  ]
}`;

  const systemPrompt = 'あなたはプロのコンテンツライターです。SEO最適化された高品質な記事を日本語で作成してください。';
  
  const response = await callGenSparkAI(prompt, systemPrompt);
  
  // JSONを抽出
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('コラムの生成に失敗しました');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// ウェブサイトを解析
export async function analyzeWebsite(
  url: string,
  htmlContent: string
): Promise<WebsiteAnalysis> {
  const prompt = `以下のウェブサイトを解析して、主な特徴や強みを抽出してください。

URL: ${url}

HTML内容（抜粋）:
${htmlContent.substring(0, 3000)}

以下のJSON形式で出力してください：
{
  "url": "${url}",
  "title": "サイトのタイトル",
  "description": "サイトの説明",
  "keywords": ["キーワード1", "キーワード2", ...],
  "mainContent": "主要なコンテンツの要約",
  "features": ["特徴1", "特徴2", ...],
  "strengths": ["強み1", "強み2", ...]
}`;

  const systemPrompt = 'あなたはウェブサイト分析の専門家です。サイトの特徴や強みを的確に抽出してください。';
  
  const response = await callGenSparkAI(prompt, systemPrompt);
  
  // JSONを抽出
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('ウェブサイト解析に失敗しました');
  }
  
  return JSON.parse(jsonMatch[0]);
}
