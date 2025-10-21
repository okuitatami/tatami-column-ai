import type { TitleCandidate, ColumnStructure, WebsiteAnalysis } from '../types';

// GenSpark AI統合
// このサンドボックス環境で利用可能なAI機能を使用

// AI生成のヘルパー関数（実際のAI呼び出し）
async function generateWithAI(prompt: string, systemPrompt: string, apiKey: string): Promise<string> {
  // OpenAI API（またはOpenAI互換API）を使用
  
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new Error('OpenAI APIキーが設定されていません。.dev.varsファイルのOPENAI_API_KEYを設定してください。');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('OpenAI APIキーが無効です。.dev.varsファイルのOPENAI_API_KEYを確認してください。');
      }
      
      throw new Error(`AI生成エラー: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AI生成に失敗しました。もう一度お試しください。');
  }
}

// タイトル候補を生成
export async function generateTitles(
  theme: string,
  websiteInfo?: WebsiteAnalysis,
  apiKey?: string
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

JSON形式で以下のように出力してください（他の文章は含めず、JSONのみを出力）：
[
  {
    "id": "1",
    "title": "タイトル1",
    "description": "このタイトルの特徴や狙い"
  },
  {
    "id": "2",
    "title": "タイトル2",
    "description": "このタイトルの特徴や狙い"
  },
  {
    "id": "3",
    "title": "タイトル3",
    "description": "このタイトルの特徴や狙い"
  },
  {
    "id": "4",
    "title": "タイトル4",
    "description": "このタイトルの特徴や狙い"
  },
  {
    "id": "5",
    "title": "タイトル5",
    "description": "このタイトルの特徴や狙い"
  }
]`;

  const systemPrompt = 'あなたはSEOとコンテンツマーケティングの専門家です。日本語で回答してください。必ずJSON形式のみを出力してください。';
  
  if (!apiKey) {
    throw new Error('OpenAI APIキーが必要です');
  }
  
  try {
    const response = await generateWithAI(prompt, systemPrompt, apiKey);
    
    // JSONを抽出（マークダウンのコードブロックを削除）
    let jsonText = response.trim();
    
    // コードブロックを削除
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // JSON部分を抽出
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('JSON not found in response:', response);
      throw new Error('タイトル候補の生成に失敗しました');
    }
    
    const titles = JSON.parse(jsonMatch[0]);
    
    // バリデーション
    if (!Array.isArray(titles) || titles.length === 0) {
      throw new Error('有効なタイトル候補が生成されませんでした');
    }
    
    return titles;
  } catch (error) {
    console.error('Title generation error:', error);
    throw new Error('タイトル候補の生成に失敗しました。もう一度お試しください。');
  }
}

// コラムを生成
export async function generateColumn(
  theme: string,
  selectedTitle: string,
  websiteInfo?: WebsiteAnalysis,
  apiKey?: string
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

JSON形式で以下のように出力してください（他の文章は含めず、JSONのみを出力）：
{
  "title": "タイトル",
  "introduction": "導入文",
  "sections": [
    {"heading": "見出し1", "content": "本文1"},
    {"heading": "見出し2", "content": "本文2"},
    {"heading": "見出し3", "content": "本文3"},
    {"heading": "見出し4", "content": "本文4"},
    {"heading": "見出し5", "content": "本文5"}
  ],
  "closing": {
    "heading": "クロージング見出し",
    "content": "クロージング本文"
  },
  "qa": [
    {"question": "質問1", "answer": "回答1"},
    {"question": "質問2", "answer": "回答2"},
    {"question": "質問3", "answer": "回答3"}
  ]
}`;

  const systemPrompt = 'あなたはプロのコンテンツライターです。SEO最適化された高品質な記事を日本語で作成してください。必ずJSON形式のみを出力してください。';
  
  if (!apiKey) {
    throw new Error('OpenAI APIキーが必要です');
  }
  
  try {
    const response = await generateWithAI(prompt, systemPrompt, apiKey);
    
    // JSONを抽出
    let jsonText = response.trim();
    
    // コードブロックを削除
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // JSON部分を抽出
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON not found in response:', response);
      throw new Error('コラムの生成に失敗しました');
    }
    
    const column = JSON.parse(jsonMatch[0]);
    
    // バリデーション
    if (!column.title || !column.introduction || !column.sections || !column.closing || !column.qa) {
      throw new Error('コラムの構造が不正です');
    }
    
    return column;
  } catch (error) {
    console.error('Column generation error:', error);
    throw new Error('コラムの生成に失敗しました。もう一度お試しください。');
  }
}

// ウェブサイトを解析
export async function analyzeWebsite(
  url: string,
  htmlContent: string,
  apiKey?: string
): Promise<WebsiteAnalysis> {
  const prompt = `以下のウェブサイトを解析して、主な特徴や強みを抽出してください。

URL: ${url}

HTML内容（抜粋）:
${htmlContent.substring(0, 3000)}

以下のJSON形式で出力してください（他の文章は含めず、JSONのみを出力）：
{
  "url": "${url}",
  "title": "サイトのタイトル",
  "description": "サイトの説明",
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "mainContent": "主要なコンテンツの要約",
  "features": ["特徴1", "特徴2", "特徴3"],
  "strengths": ["強み1", "強み2", "強み3"]
}`;

  const systemPrompt = 'あなたはウェブサイト分析の専門家です。サイトの特徴や強みを的確に抽出してください。必ずJSON形式のみを出力してください。';
  
  if (!apiKey) {
    throw new Error('OpenAI APIキーが必要です');
  }
  
  try {
    const response = await generateWithAI(prompt, systemPrompt, apiKey);
    
    // JSONを抽出
    let jsonText = response.trim();
    
    // コードブロックを削除
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // JSON部分を抽出
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON not found in response:', response);
      throw new Error('ウェブサイト解析に失敗しました');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return analysis;
  } catch (error) {
    console.error('Website analysis error:', error);
    throw new Error('ウェブサイト解析に失敗しました。もう一度お試しください。');
  }
}
