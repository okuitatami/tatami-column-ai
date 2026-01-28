import type { TitleCandidate, ColumnStructure, WebsiteAnalysis } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OpenAI API呼び出し
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function callOpenAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o-mini',
  maxTokens: number = 4096
): Promise<string> {
  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タイトル候補を生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function generateTitles(
  apiKey: string,
  keywords: string[],
  regions: string[],
  websiteInfo?: WebsiteAnalysis,
  customModelId?: string
): Promise<TitleCandidate[]> {
  const websiteContext = websiteInfo 
    ? `\n\n参考情報：\n- 企業名: ${websiteInfo.title || '不明'}\n- 説明: ${websiteInfo.description || '不明'}\n- 特徴: ${websiteInfo.features?.join(', ') || '不明'}\n- 強み: ${websiteInfo.strengths?.join(', ') || '不明'}`
    : '';

  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')} - 地域特有の情報を盛り込む`
    : '';

  const systemPrompt = `あなたはプロのSEOライターです。与えられたキーワードから、検索上位を狙える魅力的なタイトルを5つ生成してください。`;

  const userPrompt = `
キーワード: ${keywords.join('、')}${regionContext}${websiteContext}

【要件】
- 5つのタイトルを生成
- 各タイトルは30-40文字
- キーワードを自然に含める
- SEO最適化されたタイトル
- クリックしたくなる魅力的な表現

JSON形式で出力：
[
  {"id": "1", "title": "タイトル1", "description": "簡単な説明（30-50文字）"},
  {"id": "2", "title": "タイトル2", "description": "簡単な説明"},
  ...
]
`;

  const model = customModelId || 'gpt-4o-mini';
  const response = await callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], model);

  // JSON抽出
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('タイトルの生成に失敗しました');
  }

  return JSON.parse(jsonMatch[0]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラムを生成（3分割）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function generateColumn(
  apiKey: string,
  keywords: string[],
  regions: string[],
  selectedTitle: string,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis,
  customModelId?: string
): Promise<ColumnStructure> {
  const model = customModelId || 'gpt-4o-mini';
  
  // Part1: 導入+セクション2つ
  const part1 = await generateColumnPart1(apiKey, keywords, regions, selectedTitle, targetAudience, websiteInfo, model);
  
  // Part2: セクション2つ
  const part2 = await generateColumnPart2(apiKey, keywords, regions, selectedTitle, part1, targetAudience, websiteInfo, model);
  
  // Part3: まとめ+Q&A
  const part3 = await generateColumnPart3(apiKey, keywords, regions, selectedTitle, part1, part2, targetAudience, websiteInfo, model);
  
  return {
    title: part1.title,
    introduction: part1.introduction,
    sections: [...part1.sections, ...part2.sections],
    closing: part3.closing,
    qa: part3.qa
  };
}

// Part1: 導入+セクション2つ
async function generateColumnPart1(
  apiKey: string,
  keywords: string[],
  regions: string[],
  title: string,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis,
  model: string = 'gpt-4o-mini'
) {
  const websiteContext = websiteInfo 
    ? `\n企業情報: ${websiteInfo.title}（${websiteInfo.description}）- 特徴: ${websiteInfo.features?.join(', ')}`
    : '';

  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')}`
    : '';

  const systemPrompt = `あなたはプロのコラムライターです。SEOに最適化された高品質な記事を書いてください。

【厳守事項】
1. JSON形式のみで出力
2. 合計1200-1400文字
3. 導入は300-350文字
4. 各セクションは450-525文字
5. 句読点を必ず使用
6. 専門用語は避け、分かりやすく
7. 文字数が足りない場合は具体例を追加`;

  const userPrompt = `
タイトル: ${title}
キーワード: ${keywords.join('、')}${regionContext}${websiteContext}

Part1として以下を生成してください：
1. 導入文（300-350文字）
2. メインセクション1（見出し+本文450-525文字）
3. メインセクション2（見出し+本文450-525文字）

JSON形式:
{
  "title": "${title}",
  "introduction": "導入文...",
  "sections": [
    {"heading": "見出し1", "content": "本文1..."},
    {"heading": "見出し2", "content": "本文2..."}
  ]
}
`;

  const response = await callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], model, 3000);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Part1の生成に失敗しました');
  }

  return JSON.parse(jsonMatch[0]);
}

// Part2: セクション2つ
async function generateColumnPart2(
  apiKey: string,
  keywords: string[],
  regions: string[],
  title: string,
  part1: any,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis,
  model: string = 'gpt-4o-mini'
) {
  const systemPrompt = `プロのコラムライター。Part1の続きを書いてください。

【厳守事項】
1. JSON形式のみ
2. 合計900-1050文字
3. 各セクションは450-525文字
4. Part1と重複しない内容
5. 句読点を必ず使用`;

  const userPrompt = `
タイトル: ${title}
キーワード: ${keywords.join('、')}

Part1で書いた内容:
- 導入: ${part1.introduction.substring(0, 100)}...
- セクション1: ${part1.sections[0].heading}
- セクション2: ${part1.sections[1].heading}

Part2として以下を生成してください：
1. メインセクション3（見出し+本文450-525文字）
2. メインセクション4（見出し+本文450-525文字）

JSON形式:
{
  "sections": [
    {"heading": "見出し3", "content": "本文3..."},
    {"heading": "見出し4", "content": "本文4..."}
  ]
}
`;

  const response = await callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], model, 2500);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Part2の生成に失敗しました');
  }

  return JSON.parse(jsonMatch[0]);
}

// Part3: まとめ+Q&A
async function generateColumnPart3(
  apiKey: string,
  keywords: string[],
  regions: string[],
  title: string,
  part1: any,
  part2: any,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis,
  model: string = 'gpt-4o-mini'
) {
  const systemPrompt = `プロのコラムライター。記事のまとめとQ&Aを書いてください。

【厳守事項】
1. JSON形式のみ
2. まとめは250-300文字
3. Q&Aは3つ、各150-180文字
4. 合計800-900文字`;

  const userPrompt = `
タイトル: ${title}

これまでのセクション:
- ${part1.sections[0].heading}
- ${part1.sections[1].heading}
- ${part2.sections[0].heading}
- ${part2.sections[1].heading}

Part3として以下を生成してください：
1. まとめ（見出し+本文250-300文字）
2. Q&A 3つ（各質問+回答で150-180文字）

JSON形式:
{
  "closing": {"heading": "まとめ見出し", "content": "まとめ本文..."},
  "qa": [
    {"question": "Q1", "answer": "A1..."},
    {"question": "Q2", "answer": "A2..."},
    {"question": "Q3", "answer": "A3..."}
  ]
}
`;

  const response = await callOpenAI(apiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], model, 2000);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Part3の生成に失敗しました');
  }

  return JSON.parse(jsonMatch[0]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ウェブサイト解析（使用しないが互換性のため残す）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function analyzeWebsite(
  apiKey: string,
  url: string,
  htmlContent: string
): Promise<WebsiteAnalysis> {
  // 簡易実装（必要に応じて拡張）
  return {
    url,
    title: '分析未実装',
    description: 'ウェブサイト分析機能は使用していません',
    keywords: [],
    mainContent: '',
    features: [],
    strengths: []
  };
}
