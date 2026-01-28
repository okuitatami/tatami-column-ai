// Gemini REST API を直接使用（Cloudflare Workers互換）
import type { Bindings } from '../types';

// 畳業界知識を読み込む
const TATAMI_INDUSTRY_KNOWLEDGE = `
# 畳業界の専門知識

## 重要な用語の統一
- 化学表 → 紙素材・ポリプロピレン素材
- 琉球畳 → 琉球風畳
- 畳縁 → 畳縁（たたみべり）

## 価格について
- 価格は各店舗によって大きく異なります
- 高い傾向があります
- 畳表・畳床の品質によって価格と寿命が大きく変わります

## 工法と価格相場（参考価格）
### 新調工事
- 内容：畳床・畳表・畳縁をすべて新品に交換
- 価格相場：15,000円〜25,000円/畳
- 推奨時期：15年〜20年経過後
- 工期：1日〜2日

### 表替え
- 内容：畳表と畳縁を新品に交換（畳床はそのまま）
- 価格相場：8,000円〜15,000円/畳
- 推奨時期：7年〜10年経過後
- 工期：半日〜1日

### 裏返し
- 内容：畳表を裏返して再利用
- 価格相場：5,000円〜8,000円/畳
- 推奨時期：3年〜5年経過後
- 工期：半日

## 新素材畳表（化学表）
### ダイケン和紙表（紙素材）
- メリット：日焼けに強い、カビ・ダニに強い、耐久性高い
- デメリット：い草の香りがない、価格が高い

### セキスイ美草（ポリプロピレン素材）
- メリット：色あせしにくい、水拭き可能、カラーバリエーション豊富
- デメリット：い草の香りがない、価格が高い

**重要**：化学表については正しい商品認知がまだされていないため、必ず畳店に直接相談して商品を精査する必要があります。

## よくある症状と対策
1. **靴下にい草のささくれがつく** → 表替えまたは裏返しの時期
2. **シミが気になる** → 程度により表替え検討
3. **畳が沈み込む** → 新調工事の時期
4. **カビが発生** → 換気+表替え検討
5. **ダニが気になる** → 掃除+新素材表検討
6. **変色・日焼け** → 表替えまたは新素材表への変更

## SEO対策キーワード戦略
- 地域名 + 畳/リフォーム/表替え
- 畳 + 悩み（ダニ、カビ、費用、シミ、ささくれ）
- 工法 + 費用/時期/価格
- 数字を活用（5つの方法、3ステップ）
`;

export interface GeminiChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options: GeminiChatOptions = {}
  ): Promise<string> {
    const {
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      systemInstruction = TATAMI_INDUSTRY_KNOWLEDGE,
    } = options;

    try {
      // Gemini用のメッセージフォーマットに変換
      const contents = messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

      const requestBody = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature,
          maxOutputTokens: options.maxTokens || 2048,
        },
      };

      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini API Error: ${error.message || 'Unknown error'}`);
    }
  }

  async generateTitles(
    keywords: string[],
    regions: string[],
    companyInfo: {
      name: string;
      description: string;
      strengths?: string[];
      features?: string[];
    }
  ): Promise<string[]> {
    const keywordText = keywords.join('、');
    const regionText = regions.length > 0 ? regions.join('、') : '';

    const prompt = `
あなたは${companyInfo.name}のSEOコラムタイトル作成の専門家です。

【会社情報】
- 会社名: ${companyInfo.name}
- 事業内容: ${companyInfo.description}
${companyInfo.strengths ? `- 強み: ${companyInfo.strengths.join('、')}` : ''}
${companyInfo.features ? `- 特徴: ${companyInfo.features.join('、')}` : ''}

【キーワード】
${keywordText}
${regionText ? `【対象地域】\n${regionText}` : ''}

【タスク】
上記のキーワードと地域を組み合わせて、SEOに強く、かつ読者の検索意図に合致するコラムタイトルを10個生成してください。

【タイトル作成のルール】
1. キーワードを自然に組み込む
2. 地域名を含める（地域が指定されている場合）
3. 読者の悩みや問題を解決する内容を示唆
4. 30文字〜40文字程度
5. 数字を活用して具体性を高める（例：5つの方法、3ステップ）
6. 「〜とは」「〜の方法」「〜完全ガイド」などの形式を活用
7. 畳業界の専門用語を正しく使用する

【重要な注意点】
- 「化学表」ではなく「紙素材」「ポリプロピレン素材」を使用
- 「琉球畳」ではなく「琉球風畳」を使用
- 価格について言及する場合は「各店舗によって異なる」ことを示唆
- 畳の品質によって価格や寿命が変わることを考慮

【出力形式】
タイトルのみを1行ずつ出力してください。番号や説明は不要です。

例：
神戸市で畳リフォーム｜表替えと新調工事の費用相場を徹底比較
畳のダニ対策完全ガイド｜5つの予防法と効果的な駆除方法
`.trim();

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.8,
          maxTokens: 1024,
        }
      );

      // タイトルを抽出（改行で分割し、空行を除去）
      const titles = response
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.match(/^[\d\.\-\*]+/));

      return titles.slice(0, 10);
    } catch (error: any) {
      console.error('Title generation error:', error);
      throw new Error(`タイトルの生成に失敗しました: ${error.message}`);
    }
  }

  async generateColumn(
    title: string,
    keywords: string[],
    regions: string[],
    companyInfo: {
      name: string;
      description: string;
      strengths?: string[];
      features?: string[];
      website?: string;
    },
    targetAudience?: string
  ): Promise<{
    title: string;
    introduction: string;
    sections: Array<{ heading: string; content: string }>;
    closing: string;
    qa: Array<{ question: string; answer: string }>;
  }> {
    const keywordText = keywords.join('、');
    const regionText = regions.length > 0 ? regions.join('、') : '';

    const prompt = `
あなたは${companyInfo.name}のSEOコラム作成の専門家です。

【会社情報】
- 会社名: ${companyInfo.name}
- 事業内容: ${companyInfo.description}
${companyInfo.strengths ? `- 強み: ${companyInfo.strengths.join('、')}` : ''}
${companyInfo.features ? `- 特徴: ${companyInfo.features.join('、')}` : ''}
${companyInfo.website ? `- ウェブサイト: ${companyInfo.website}` : ''}

【タイトル】
${title}

【キーワード】
${keywordText}
${regionText ? `【対象地域】\n${regionText}` : ''}
${targetAudience ? `【ターゲット読者】\n${targetAudience}` : ''}

【タスク】
上記のタイトルとキーワードをもとに、SEOに強く、読者に価値を提供するコラム記事を作成してください。

【記事作成のルール】
1. 導入文（200文字程度）：読者の悩みに共感し、記事の価値を伝える
2. 本文（4〜6セクション）：各セクション300〜500文字
3. まとめ（200文字程度）：記事の要点をまとめ、行動を促す
4. Q&A（3〜5問）：よくある質問と回答

【重要な注意点】
- 「化学表」ではなく「紙素材」「ポリプロピレン素材」を使用
- 「琉球畳」ではなく「琉球風畳」を使用
- 価格は「店舗によって異なります」「高い傾向があります」と明記
- 「畳表・畳床の品質によって年数が大きく変わります」を強調
- 化学表については「畳店に直接相談して商品を精査する必要があります」と注意喚起
- 専門用語は必ず説明を入れる
- 会社の強みを自然に織り込む
- 地域名を複数回使用してSEO効果を高める

【出力形式】
以下のJSON形式で出力してください：

{
  "title": "タイトル",
  "introduction": "導入文",
  "sections": [
    {"heading": "見出し1", "content": "本文1"},
    {"heading": "見出し2", "content": "本文2"}
  ],
  "closing": "まとめ",
  "qa": [
    {"question": "質問1", "answer": "回答1"},
    {"question": "質問2", "answer": "回答2"}
  ]
}
`.trim();

    try {
      const response = await this.chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.7,
          maxTokens: 4096,
        }
      );

      // JSONを抽出（```json ... ``` で囲まれている場合があるため）
      let jsonText = response;
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const result = JSON.parse(jsonText);
      return result;
    } catch (error: any) {
      console.error('Column generation error:', error);
      throw new Error(`コラムの生成に失敗しました: ${error.message}`);
    }
  }
}

// ヘルパー関数：Bindingsから適切なAIクライアントを取得
export function getAIClient(env: Bindings): GeminiClient | null {
  const provider = env.AI_PROVIDER || 'gemini';

  if (provider === 'gemini' && env.GEMINI_API_KEY) {
    return new GeminiClient(env.GEMINI_API_KEY);
  }

  return null;
}
