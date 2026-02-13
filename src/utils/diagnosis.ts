import type { D1Database } from '@cloudflare/workers-types';

// 診断質問の定義
export const DIAGNOSIS_QUESTIONS = [
  {
    id: 'q1',
    question: '現在の畳の状態を教えてください',
    type: 'single',
    options: [
      { value: 'excellent', label: '新しく、ほとんど問題ない', score: { urgency: 0, quality: 5 } },
      { value: 'good', label: '多少の色褪せはあるが、使用に問題ない', score: { urgency: 1, quality: 4 } },
      { value: 'fair', label: 'ささくれや色褪せが目立つ', score: { urgency: 3, quality: 3 } },
      { value: 'poor', label: '沈み込みやカビが発生している', score: { urgency: 5, quality: 1 } },
    ],
  },
  {
    id: 'q2',
    question: '前回の畳替えからどれくらい経過していますか？',
    type: 'single',
    options: [
      { value: 'less_than_3', label: '3年未満', score: { urgency: 0, method: 'none' } },
      { value: '3_to_5', label: '3〜5年', score: { urgency: 1, method: 'urakaeshi' } },
      { value: '5_to_10', label: '5〜10年', score: { urgency: 3, method: 'omoteae' } },
      { value: '10_to_15', label: '10〜15年', score: { urgency: 4, method: 'omoteae' } },
      { value: 'more_than_15', label: '15年以上', score: { urgency: 5, method: 'shincho' } },
      { value: 'unknown', label: 'わからない', score: { urgency: 2, method: 'omoteae' } },
    ],
  },
  {
    id: 'q3',
    question: '気になる症状はありますか？（複数選択可）',
    type: 'multiple',
    options: [
      { value: 'fraying', label: 'ささくれがつく', score: { urgency: 2, method: 'omoteae' } },
      { value: 'stain', label: 'シミが気になる', score: { urgency: 2, method: 'omoteae' } },
      { value: 'sinking', label: '畳が沈み込む', score: { urgency: 4, method: 'shincho' } },
      { value: 'mold', label: 'カビが発生している', score: { urgency: 3, method: 'omoteae' } },
      { value: 'mites', label: 'ダニが気になる', score: { urgency: 3, material: 'chemical' } },
      { value: 'fading', label: '色褪せ・日焼け', score: { urgency: 2, method: 'omoteae' } },
      { value: 'none', label: '特になし', score: { urgency: 0 } },
    ],
  },
  {
    id: 'q4',
    question: '畳の素材について、どのようなニーズがありますか？',
    type: 'single',
    options: [
      { value: 'natural', label: '天然い草の香りや質感を重視したい', score: { material: 'igusa' } },
      { value: 'maintenance', label: 'お手入れのしやすさを重視したい', score: { material: 'chemical' } },
      { value: 'durability', label: '耐久性を重視したい', score: { material: 'chemical' } },
      { value: 'allergy', label: 'カビ・ダニ対策を重視したい', score: { material: 'chemical' } },
      { value: 'traditional', label: '伝統的な和の雰囲気を大切にしたい', score: { material: 'igusa' } },
    ],
  },
  {
    id: 'q5',
    question: '使用環境について教えてください',
    type: 'multiple',
    options: [
      { value: 'pets', label: 'ペットがいる', score: { material: 'chemical', durability: 2 } },
      { value: 'children', label: '小さな子供がいる', score: { material: 'chemical', durability: 2 } },
      { value: 'wheelchair', label: '車椅子を使用する', score: { material: 'chemical', durability: 3 } },
      { value: 'humid', label: '湿気が多い', score: { material: 'chemical', urgency: 1 } },
      { value: 'frequent_use', label: '頻繁に使用する部屋', score: { durability: 2 } },
      { value: 'none', label: '特になし', score: {} },
    ],
  },
  {
    id: 'q6',
    question: 'ご予算の目安を教えてください（1畳あたり）',
    type: 'single',
    options: [
      { value: 'budget', label: '5,000円〜8,000円', score: { budget: 'low', method: 'urakaeshi' } },
      { value: 'standard', label: '8,000円〜15,000円', score: { budget: 'standard', method: 'omoteae' } },
      { value: 'premium', label: '15,000円〜25,000円', score: { budget: 'high', method: 'shincho' } },
      { value: 'flexible', label: '品質重視で柔軟に検討したい', score: { budget: 'flexible' } },
    ],
  },
  {
    id: 'q7',
    question: '畳替えの希望時期はいつ頃ですか？',
    type: 'single',
    options: [
      { value: 'immediate', label: 'できるだけ早く', score: { urgency: 5 } },
      { value: 'within_month', label: '1ヶ月以内', score: { urgency: 4 } },
      { value: 'within_3months', label: '3ヶ月以内', score: { urgency: 3 } },
      { value: 'considering', label: '検討中・相談したい', score: { urgency: 2 } },
      { value: 'not_urgent', label: '急いでいない', score: { urgency: 1 } },
    ],
  },
];

// 診断結果を計算
export function calculateDiagnosis(
  answers: Record<string, string | string[]>,
  preferredMaterial: 'natural' | 'chemical' | 'both',
  pricing?: {
    urakaeshi: { min: number; max: number };
    omoteae: { min: number; max: number };
    shincho: { min: number; max: number };
  }
): {
  recommendedMethod: string;
  recommendedMaterial: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  urgencyLevel: string;
  explanation: string;
} {
  // デフォルト価格（設定がない場合）
  const defaultPricing = {
    urakaeshi: { min: 5000, max: 8000 },
    omoteae: { min: 8000, max: 15000 },
    shincho: { min: 15000, max: 25000 },
  };
  
  const prices = pricing || defaultPricing;
  
  let urgencyScore = 0;
  let methodScores = { urakaeshi: 0, omoteae: 0, shincho: 0 };
  let materialScores = { igusa: 0, chemical: 0 };

  // 回答を集計
  DIAGNOSIS_QUESTIONS.forEach((q) => {
    const answer = answers[q.id];
    if (!answer) return;

    const answerArray = Array.isArray(answer) ? answer : [answer];

    answerArray.forEach((val) => {
      const option = q.options.find((opt) => opt.value === val);
      if (!option || !option.score) return;

      if (option.score.urgency !== undefined) {
        urgencyScore += option.score.urgency;
      }
      if (option.score.method) {
        methodScores[option.score.method as keyof typeof methodScores]++;
      }
      if (option.score.material === 'igusa') {
        materialScores.igusa++;
      } else if (option.score.material === 'chemical') {
        materialScores.chemical++;
      }
    });
  });

  // 工法を決定
  let recommendedMethod = 'omoteae';
  if (methodScores.shincho >= 2 || urgencyScore >= 10) {
    recommendedMethod = 'shincho';
  } else if (methodScores.urakaeshi >= 2 && urgencyScore < 5) {
    recommendedMethod = 'urakaeshi';
  }

  // 素材を決定（店舗の推奨を考慮）
  let recommendedMaterial = 'igusa';
  if (preferredMaterial === 'chemical') {
    recommendedMaterial = materialScores.chemical > 0 ? 'polypropylene' : 'paper';
  } else if (preferredMaterial === 'both') {
    if (materialScores.chemical > materialScores.igusa) {
      recommendedMaterial = 'polypropylene';
    }
  } else {
    // natural
    if (materialScores.chemical > materialScores.igusa + 2) {
      recommendedMaterial = 'paper';
    }
  }

  // 費用を計算（設定された価格を使用）
  let estimatedCostMin = prices.urakaeshi.min;
  let estimatedCostMax = prices.urakaeshi.max;
  if (recommendedMethod === 'omoteae') {
    estimatedCostMin = prices.omoteae.min;
    estimatedCostMax = prices.omoteae.max;
  } else if (recommendedMethod === 'shincho') {
    estimatedCostMin = prices.shincho.min;
    estimatedCostMax = prices.shincho.max;
  }

  // 緊急度を判定
  let urgencyLevel = 'consider';
  if (urgencyScore >= 12) {
    urgencyLevel = 'urgent';
  } else if (urgencyScore >= 8) {
    urgencyLevel = 'soon';
  } else if (urgencyScore <= 3) {
    urgencyLevel = 'not_urgent';
  }

  // 説明文を生成
  let explanation = '';
  if (urgencyLevel === 'urgent') {
    explanation = '畳の状態から、早急な対応が必要です。現在の状態を放置すると、畳床まで傷む可能性があります。';
  } else if (urgencyLevel === 'soon') {
    explanation = '近いうちに畳替えを検討されることをお勧めします。早めの対応で、より長く快適にご使用いただけます。';
  } else if (urgencyLevel === 'consider') {
    explanation = '今すぐ畳替えが必要な状態ではありませんが、計画的な検討をお勧めします。';
  } else {
    explanation = '現在は早急な畳替えは必要ありませんが、気になる点があればお気軽にご相談ください。';
  }

  return {
    recommendedMethod,
    recommendedMaterial,
    estimatedCostMin,
    estimatedCostMax,
    urgencyLevel,
    explanation,
  };
}

// 診断設定を保存
export async function saveDiagnosisSettings(
  db: D1Database,
  userId: number,
  preferredMaterial: string,
  inquiryUrl: string,
  pricing: {
    urakaeshi: { min: number; max: number };
    omoteae: { min: number; max: number };
    shincho: { min: number; max: number };
  }
): Promise<void> {
  // 既存の設定を削除
  await db.prepare('DELETE FROM diagnosis_settings WHERE user_id = ?').bind(userId).run();

  // 新しい設定を保存
  await db
    .prepare(`
      INSERT INTO diagnosis_settings (
        user_id, preferred_material, inquiry_url,
        price_urakaeshi_min, price_urakaeshi_max,
        price_omoteae_min, price_omoteae_max,
        price_shincho_min, price_shincho_max
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      userId,
      preferredMaterial,
      inquiryUrl,
      pricing.urakaeshi.min,
      pricing.urakaeshi.max,
      pricing.omoteae.min,
      pricing.omoteae.max,
      pricing.shincho.min,
      pricing.shincho.max
    )
    .run();
}

// 診断設定を取得
export async function getDiagnosisSettings(
  db: D1Database,
  userId: number
): Promise<{
  preferredMaterial: string;
  inquiryUrl: string;
  pricing: {
    urakaeshi: { min: number; max: number };
    omoteae: { min: number; max: number };
    shincho: { min: number; max: number };
  };
} | null> {
  const result = await db
    .prepare(`
      SELECT 
        preferred_material, inquiry_url,
        price_urakaeshi_min, price_urakaeshi_max,
        price_omoteae_min, price_omoteae_max,
        price_shincho_min, price_shincho_max
      FROM diagnosis_settings 
      WHERE user_id = ?
    `)
    .bind(userId)
    .first();

  if (!result) return null;

  return {
    preferredMaterial: result.preferred_material as string,
    inquiryUrl: result.inquiry_url as string,
    pricing: {
      urakaeshi: {
        min: (result.price_urakaeshi_min as number) || 5000,
        max: (result.price_urakaeshi_max as number) || 8000,
      },
      omoteae: {
        min: (result.price_omoteae_min as number) || 8000,
        max: (result.price_omoteae_max as number) || 15000,
      },
      shincho: {
        min: (result.price_shincho_min as number) || 15000,
        max: (result.price_shincho_max as number) || 25000,
      },
    },
  };
}

// 診断結果を保存
export async function saveDiagnosisResult(
  db: D1Database,
  userId: number | null,
  sessionId: string,
  answers: Record<string, string | string[]>,
  result: {
    recommendedMethod: string;
    recommendedMaterial: string;
    estimatedCostMin: number;
    estimatedCostMax: number;
    urgencyLevel: string;
  }
): Promise<number> {
  const dbResult = await db
    .prepare(`
      INSERT INTO diagnosis_results (
        user_id, session_id, answers,
        recommended_method, recommended_material,
        estimated_cost_min, estimated_cost_max, urgency_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      userId,
      sessionId,
      JSON.stringify(answers),
      result.recommendedMethod,
      result.recommendedMaterial,
      result.estimatedCostMin,
      result.estimatedCostMax,
      result.urgencyLevel
    )
    .run();

  return dbResult.meta.last_row_id as number;
}
