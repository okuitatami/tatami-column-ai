import type { TitleCandidate, ColumnStructure, WebsiteAnalysis } from '../types';

// コラムパート1の型（導入+メインセクション2つ）
type ColumnPart1 = {
  title: string;
  introduction: string;
  sections: {
    heading: string;
    content: string;
  }[];
};

// コラムパート2の型（メインセクション2つ）
type ColumnPart2 = {
  sections: {
    heading: string;
    content: string;
  }[];
};

// コラムパート3の型（まとめ+Q&A）
type ColumnPart3 = {
  closing: {
    heading: string;
    content: string;
  };
  qa: {
    question: string;
    answer: string;
  }[];
};

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// JSONをクリーニング（制御文字を削除）
function cleanJSON(jsonString: string): string {
  // まず文字列リテラル内の制御文字を処理
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    const code = char.charCodeAt(0);
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }
    
    // 文字列リテラル内の制御文字を空白に置換
    if (inString && (code < 0x20 || code === 0x7F || (code >= 0x80 && code <= 0x9F))) {
      result += ' ';
      continue;
    }
    
    // 文字列リテラル外の改行・タブは空白に
    if (!inString && (char === '\n' || char === '\r' || char === '\t')) {
      result += ' ';
      continue;
    }
    
    result += char;
  }
  
  // 連続する空白を1つに
  return result.replace(/\s+/g, ' ');
}

// Claude APIを呼び出す基本関数（リトライ機能付き）
async function callClaude(apiKey: string, prompt: string, systemPrompt?: string, retryCount = 0): Promise<string> {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      
      // 502エラーの場合、最大2回リトライ
      if (response.status === 502 && retryCount < 2) {
        console.warn(`Claude API 502 error, retrying... (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
        return callClaude(apiKey, prompt, systemPrompt, retryCount + 1);
      }
      
      throw new Error(`Claude API Error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.content[0].text;
  } catch (error) {
    // ネットワークエラーの場合もリトライ
    if (retryCount < 2 && error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.warn(`Network error, retrying... (attempt ${retryCount + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
      return callClaude(apiKey, prompt, systemPrompt, retryCount + 1);
    }
    throw error;
  }
}

// タイトル候補を生成
export async function generateTitles(
  apiKey: string,
  keywords: string[],
  regions: string[],
  websiteInfo?: WebsiteAnalysis
): Promise<TitleCandidate[]> {
  const websiteContext = websiteInfo 
    ? `\n\n参考情報：このコラムは以下のウェブサイト向けです：\n- サイト名: ${websiteInfo.title || '不明'}\n- 説明: ${websiteInfo.description || '不明'}\n- 特徴: ${websiteInfo.features?.join(', ') || '不明'}\n- 強み: ${websiteInfo.strengths?.join(', ') || '不明'}`
    : '';

  // 地域情報が指定されている場合は地域SEOに最適化
  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')}\n\n※地域名をタイトルに含めて、地域SEOに最適化してください。タイトルには【地域名】や「地域名で」などの形式で地域を明示してください。`
    : '';

  // タイムスタンプを追加してキャッシュを回避
  const timestamp = Date.now();
  
  const prompt = `【リクエストID: ${timestamp}】

以下のキーワード（${keywords.length}個）${regions && regions.length > 0 ? `と地域（${regions.length}個）` : ''}を組み合わせた、多様なSEOタイトルを5つ生成してください。

キーワード: ${keywords.join('、')}${regionContext}${websiteContext}

要件:
- キーワードを効果的に組み合わせる
- 検索意図を捉えた魅力的な表現
- 30-40文字程度
- 【重要】各タイトルは必ず異なるアプローチで作成（ガイド型、比較型、問題解決型、専門家視点型、実践型など）
- 地域が指定されている場合は、必ずタイトルに地域名を含める（【東京都】形式または「東京都で」形式など）
- 5つすべて異なる表現・角度で

JSON形式で以下のように出力してください：
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

  const systemPrompt = 'あなたはSEOとコンテンツマーケティングの専門家です。日本語で回答してください。必ず有効なJSON形式のみを返してください。説明文やマークダウンは不要です。';
  
  const response = await callClaude(apiKey, prompt, systemPrompt);
  
  // JSONを抽出（マークダウンのコードブロックを削除）
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // 配列形式のJSONを抽出
  const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from response:', response);
    throw new Error('タイトル候補の生成に失敗しました');
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Attempted to parse:', jsonMatch[0]);
    throw new Error('タイトル候補のJSON解析に失敗しました');
  }
}

// コラムパート1を生成（導入+メインセクション2つ）
async function generateColumnPart1(
  apiKey: string,
  keywords: string[],
  regions: string[],
  selectedTitle: string,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis
): Promise<ColumnPart1> {
  const websiteContext = websiteInfo 
    ? `\n\nサイト情報: ${websiteInfo.title || ''}（${websiteInfo.description || ''}）- 特徴: ${websiteInfo.features?.slice(0, 2).join(', ') || ''}`
    : '';

  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')} - 地域特有の情報を盛り込む`
    : '';

  // ターゲット層に応じた文体指示
  const audienceContext = targetAudience ? getAudienceContext(targetAudience) : '';

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  const prompt = `【記事ID: ${randomId}-${timestamp}-Part1】

タイトル「${selectedTitle}」の導入部分とメインセクション2つを生成。

キーワード: ${keywords.join('、')}${regionContext}${websiteContext}${audienceContext}

構成（合計1200-1350文字）：
1. 導入（250-300文字）
2. メインセクション1（450-500文字）- タイトルに即した自由な見出し
3. メインセクション2（450-500文字）- タイトルに即した自由な見出し

要件：
- 見出しは固定パターン禁止
- タイトルのテーマに沿った内容
- 専門用語は極力避け、使う場合は簡単な説明を付ける
- 有効なJSON形式のみ（説明不要）

JSON形式：
{
  "title": "タイトル",
  "introduction": "導入（250-300文字）",
  "sections": [
    {"heading": "見出し1", "content": "本文1（450-500文字）"},
    {"heading": "見出し2", "content": "本文2（450-500文字）"}
  ]
}`;

  const systemPrompt = `プロのライター。SEO記事を日本語で作成。

【厳守】
1. JSON形式のみ
2. 改行・タブは空白1つに
3. "は\\"でエスケープ
4. 合計1200-1350文字（厳守） - 各セクションは必ず450-500文字で記述
5. 簡潔に、途中で切れない、不完全な文章禁止
6. 専門用語避ける、必要なら説明
7. 句読点（、。）必ず使う
8. 毎回異なる角度・表現
9. 文字数が足りない場合は具体例・詳細を追加して必ず1200文字以上にする`;
  
  const response = await callClaude(apiKey, prompt, systemPrompt);
  
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from Part1 response:', response.substring(0, 500));
    throw new Error('コラムパート1の生成に失敗しました');
  }
  
  try {
    console.log('[Part1] Raw JSON match length:', jsonMatch[0].length);
    let jsonString = cleanJSON(jsonMatch[0]);
    console.log('[Part1] Cleaned JSON length:', jsonString.length);
    
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      jsonString += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      jsonString += '}'.repeat(openBraces - closeBraces);
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error (Part1):', error);
    console.error('JSON substring (first 500 chars):', jsonString?.substring(0, 500));
    console.error('JSON substring (around position 1044):', jsonString?.substring(1000, 1100));
    throw new Error('コラムパート1のJSON解析に失敗しました');
  }
}

// コラムパート2を生成（メインセクション2つ）
async function generateColumnPart2(
  apiKey: string,
  keywords: string[],
  regions: string[],
  selectedTitle: string,
  part1Summary: string,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis
): Promise<ColumnPart2> {
  const websiteContext = websiteInfo 
    ? `\n\nサイト情報: ${websiteInfo.title || ''}（${websiteInfo.description || ''}）`
    : '';

  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')}`
    : '';

  const audienceContext = targetAudience ? getAudienceContext(targetAudience) : '';

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  const prompt = `【記事ID: ${randomId}-${timestamp}-Part2】

タイトル「${selectedTitle}」のメインセクション2つ（続き）を生成。

キーワード: ${keywords.join('、')}${regionContext}${websiteContext}${audienceContext}

既に作成済みの内容:
${part1Summary}

構成（合計900-1000文字）：
1. メインセクション3（450-500文字）- タイトルに即した自由な見出し
2. メインセクション4（450-500文字）- タイトルに即した自由な見出し

要件：
- 見出しは固定パターン禁止
- 既存セクションと重複しない内容
- 専門用語は極力避け、使う場合は簡単な説明を付ける
- 有効なJSON形式のみ（説明不要）

JSON形式：
{
  "sections": [
    {"heading": "見出し3", "content": "本文3（450-500文字）"},
    {"heading": "見出し4", "content": "本文4（450-500文字）"}
  ]
}`;

  const systemPrompt = `プロのライター。SEO記事を日本語で作成。

【厳守】
1. JSON形式のみ
2. 改行・タブは空白1つに
3. "は\\"でエスケープ
4. 合計900-1000文字（厳守） - 各セクションは必ず450-500文字で記述
5. 簡潔に、途中で切れない、不完全な文章禁止
6. 専門用語避ける、必要なら説明
7. 句読点（、。）必ず使う
8. 文字数が足りない場合は具体例・詳細を追加して必ず900文字以上にする`;
  
  const response = await callClaude(apiKey, prompt, systemPrompt);
  
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from Part2 response:', response.substring(0, 500));
    throw new Error('コラムパート2の生成に失敗しました');
  }
  
  try {
    console.log('[Part2] Raw JSON match length:', jsonMatch[0].length);
    let jsonString = cleanJSON(jsonMatch[0]);
    console.log('[Part2] Cleaned JSON length:', jsonString.length);
    
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      jsonString += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      jsonString += '}'.repeat(openBraces - closeBraces);
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error (Part2):', error);
    console.error('JSON substring (first 500 chars):', jsonString?.substring(0, 500));
    throw new Error('コラムパート2のJSON解析に失敗しました');
  }
}

// コラムパート3を生成（まとめ+Q&A）
async function generateColumnPart3(
  apiKey: string,
  keywords: string[],
  regions: string[],
  selectedTitle: string,
  contentSummary: string,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis
): Promise<ColumnPart3> {
  const websiteContext = websiteInfo 
    ? `\n\nサイト情報: ${websiteInfo.title || ''}（${websiteInfo.description || ''}）`
    : '';

  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')}`
    : '';

  const audienceContext = targetAudience ? getAudienceContext(targetAudience) : '';

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  const prompt = `【記事ID: ${randomId}-${timestamp}-Part3】

タイトル「${selectedTitle}」のまとめとQ&Aを生成。

キーワード: ${keywords.join('、')}${regionContext}${websiteContext}${audienceContext}

既に作成済みの内容:
${contentSummary}

構成（合計800-900文字）：
1. まとめ（250-300文字）
2. Q&A 3つ（各150-180文字）

要件：
- まとめは簡潔に記事全体を総括
- Q&Aは実践的で簡潔に
- 専門用語は避ける
- 有効なJSON形式のみ（説明不要）

JSON形式：
{
  "closing": {"heading": "まとめ見出し", "content": "まとめ（250-300文字）"},
  "qa": [
    {"question": "Q1", "answer": "A1（150-180文字）"},
    {"question": "Q2", "answer": "A2（150-180文字）"},
    {"question": "Q3", "answer": "A3（150-180文字）"}
  ]
}`;

  const systemPrompt = `プロのライター。SEO記事を日本語で作成。

【厳守】
1. JSON形式のみ
2. 改行・タブは空白1つに
3. "は\\"でエスケープ
4. 合計800-900文字（厳守） - まとめは250-300文字、各Q&Aは150-180文字で記述
5. 簡潔に、途中で切れない、不完全な文章禁止
6. 専門用語避ける
7. 句読点（、。）必ず使う
8. 文字数が足りない場合は詳細を追加して必ず800文字以上にする`;
  
  const response = await callClaude(apiKey, prompt, systemPrompt);
  
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from Part3 response:', response.substring(0, 500));
    throw new Error('コラムパート3の生成に失敗しました');
  }
  
  try {
    console.log('[Part3] Raw JSON match length:', jsonMatch[0].length);
    let jsonString = cleanJSON(jsonMatch[0]);
    console.log('[Part3] Cleaned JSON length:', jsonString.length);
    
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      jsonString += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      jsonString += '}'.repeat(openBraces - closeBraces);
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error (Part3):', error);
    console.error('JSON substring (first 500 chars):', jsonString?.substring(0, 500));
    throw new Error('コラムパート3のJSON解析に失敗しました');
  }
}

// ターゲット層に応じた文体コンテキストを生成
function getAudienceContext(targetAudience: string): string {
  const contexts: { [key: string]: string } = {
    '若者世代': '\n\n文体: 若者世代（10代～20代）向け。やや軽めの表現で、短めの文章。難しい漢字は避け、親しみやすい言葉遣い。',
    '青年世代': '\n\n文体: 青年世代（30代～40代）向け。標準的なビジネス文体。適度に専門的だが分かりやすく。',
    '引退世代': '\n\n文体: 引退世代（50代～60代）向け。丁寧で落ち着いた表現。やや詳しく説明。',
    '高齢世代': '\n\n文体: 高齢世代（70代以降）向け。より丁寧な表現。難しい漢字には括弧で読み仮名。ゆっくり丁寧に説明。'
  };
  
  return contexts[targetAudience] || '';
}

// コラムを生成（3回分割で3000-3250文字）
export async function generateColumn(
  apiKey: string,
  keywords: string[],
  regions: string[],
  selectedTitle: string,
  targetAudience?: string,
  websiteInfo?: WebsiteAnalysis
): Promise<ColumnStructure> {
  // パート1: 導入+メインセクション2つ（1200-1350文字）
  const part1 = await generateColumnPart1(apiKey, keywords, regions, selectedTitle, targetAudience, websiteInfo);
  
  // パート1の要約を作成
  const part1Summary = `導入: ${part1.introduction.substring(0, 100)}...\nセクション1: ${part1.sections[0].heading}\nセクション2: ${part1.sections[1].heading}`;
  
  // パート2: メインセクション2つ（900-1000文字）
  const part2 = await generateColumnPart2(apiKey, keywords, regions, selectedTitle, part1Summary, targetAudience, websiteInfo);
  
  // パート1+2の要約を作成
  const allSectionsHeadings = [
    ...part1.sections.map(s => s.heading),
    ...part2.sections.map(s => s.heading)
  ].join('、');
  const contentSummary = `導入: ${part1.introduction.substring(0, 80)}...\nセクション: ${allSectionsHeadings}`;
  
  // パート3: まとめ+Q&A（1100-1250文字）
  const part3 = await generateColumnPart3(apiKey, keywords, regions, selectedTitle, contentSummary, targetAudience, websiteInfo);
  
  // 3つのパートを結合
  return {
    title: part1.title,
    introduction: part1.introduction,
    sections: [...part1.sections, ...part2.sections],
    closing: part3.closing,
    qa: part3.qa
  };
}

// 旧バージョン（下位互換性のため残す）
export async function generateColumnLegacy(
  apiKey: string,
  keywords: string[],
  regions: string[],
  selectedTitle: string,
  websiteInfo?: WebsiteAnalysis
): Promise<ColumnStructure> {
  const websiteContext = websiteInfo 
    ? `\n\nサイト情報: ${websiteInfo.title || ''}（${websiteInfo.description || ''}）- 特徴: ${websiteInfo.features?.slice(0, 2).join(', ') || ''}`
    : '';

  // 地域情報が指定されている場合は地域SEOに最適化
  const regionContext = regions && regions.length > 0
    ? `\n地域: ${regions.join('、')} - 地域特有の情報を盛り込む`
    : '';

  // タイムスタンプとランダム要素を追加してキャッシュを回避
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  const prompt = `【記事ID: ${randomId}-${timestamp}】

タイトル「${selectedTitle}」に即した、2000文字前後の簡潔なSEO記事を生成。

キーワード: ${keywords.join('、')}${regionContext}${websiteContext}

構成（合計1800-2100文字）：
1. 導入（200-250文字）
2. メインセクション3つ（各350-400文字）- タイトルに即した自由な見出し
3. まとめ（200-250文字）
4. Q&A 3つ（各120-150文字）

要件：
- 見出しは固定パターン禁止
- タイトルのテーマに沿った内容
- 簡潔で要点を押さえた文章
- 有効なJSON形式のみ（説明不要）

JSON形式：
{
  "title": "タイトル",
  "introduction": "導入（200-250文字）",
  "sections": [
    {"heading": "見出し1", "content": "本文1（350-400文字）"},
    {"heading": "見出し2", "content": "本文2（350-400文字）"},
    {"heading": "見出し3", "content": "本文3（350-400文字）"}
  ],
  "closing": {"heading": "まとめ見出し", "content": "まとめ（200-250文字）"},
  "qa": [
    {"question": "Q1", "answer": "A1（120-150文字）"},
    {"question": "Q2", "answer": "A2（120-150文字）"},
    {"question": "Q3", "answer": "A3（120-150文字）"}
  ]
}`;

  const systemPrompt = `あなたはプロのコンテンツライターです。SEO最適化された高品質な記事を日本語で作成してください。

【絶対厳守】
1. JSON形式のみ（説明不要）
2. 改行・タブは空白1つに置き換え
3. "は\\"でエスケープ
4. 合計1800-2100文字（厳守）
5. 簡潔に、途中で切れないように
6. 必ず句読点（、。）を正しく使う

【重要】毎回異なる角度・表現で作成。見出し・具体例は必ず変える。`;
  
  const response = await callClaude(apiKey, prompt, systemPrompt);
  
  // JSONを抽出（マークダウンのコードブロックを削除）
  let jsonText = response.trim();
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // オブジェクト形式のJSONを抽出
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from response:', response.substring(0, 500));
    throw new Error('コラムの生成に失敗しました');
  }
  
  try {
    // JSONをクリーニング（制御文字を削除）
    let jsonString = cleanJSON(jsonMatch[0]);
    
    // 配列やオブジェクトの閉じ括弧が足りない場合の補完を試みる
    const openBraces = (jsonString.match(/\{/g) || []).length;
    const closeBraces = (jsonString.match(/\}/g) || []).length;
    const openBrackets = (jsonString.match(/\[/g) || []).length;
    const closeBrackets = (jsonString.match(/\]/g) || []).length;
    
    // 不足している閉じ括弧を追加
    if (openBrackets > closeBrackets) {
      jsonString += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      jsonString += '}'.repeat(openBraces - closeBraces);
    }
    
    const parsed = JSON.parse(jsonString);
    
    // 必須フィールドの検証
    const missingFields = [];
    if (!parsed.title) missingFields.push('title');
    if (!parsed.introduction) missingFields.push('introduction');
    if (!parsed.sections || !Array.isArray(parsed.sections)) missingFields.push('sections');
    if (!parsed.closing) missingFields.push('closing');
    if (!parsed.qa || !Array.isArray(parsed.qa)) missingFields.push('qa');
    
    if (missingFields.length > 0) {
      console.error('Missing fields in parsed JSON:', missingFields);
      console.error('Parsed object:', JSON.stringify(parsed, null, 2).substring(0, 500));
      throw new Error(`コラムの構造が不正です - 欠けているフィールド: ${missingFields.join(', ')}`);
    }
    
    // セクション数が3つ未満の場合は警告
    if (parsed.sections.length < 3) {
      console.warn(`Warning: Only ${parsed.sections.length} sections generated (expected 3)`);
    }
    
    // Q&A数が3つ未満の場合は警告
    if (parsed.qa.length < 3) {
      console.warn(`Warning: Only ${parsed.qa.length} Q&A generated (expected 3)`);
    }
    
    return parsed;
  } catch (error) {
    console.error('JSON parse error (Legacy):', error);
    console.error('JSON substring:', jsonString?.substring(0, 500));
    console.error('Response length:', response.length);
    
    if (error instanceof Error && error.message.includes('欠けているフィールド')) {
      throw error;
    }
    
    throw new Error('コラムのJSON解析に失敗しました。4096トークン制限により内容が途中で切れた可能性があります。');
  }
}

// ウェブサイトを解析
export async function analyzeWebsite(
  apiKey: string,
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
  
  const response = await callClaude(apiKey, prompt, systemPrompt);
  
  // JSONを抽出
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('ウェブサイト解析に失敗しました');
  }
  
  return JSON.parse(jsonMatch[0]);
}
