import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getUserFromSession } from '../utils/db';
import {
  DIAGNOSIS_QUESTIONS,
  calculateDiagnosis,
  saveDiagnosisSettings,
  getDiagnosisSettings,
  saveDiagnosisResult,
} from '../utils/diagnosis';

const diagnosis = new Hono<{ Bindings: Bindings }>();

// 診断質問を取得
diagnosis.get('/questions', async (c) => {
  return c.json({ success: true, questions: DIAGNOSIS_QUESTIONS });
});

// 診断結果を計算
diagnosis.post('/calculate', async (c) => {
  try {
    const { answers, userId } = await c.req.json();

    if (!answers || typeof answers !== 'object') {
      return c.json({ error: '回答データが不正です' }, 400);
    }

    // ユーザーの診断設定を取得（ログインしている場合）
    let preferredMaterial: 'natural' | 'chemical' | 'both' = 'both';
    let inquiryUrl = '#contact';
    let pricing = undefined;

    if (userId) {
      const settings = await getDiagnosisSettings(c.env.DB, userId);
      if (settings) {
        preferredMaterial = settings.preferredMaterial as 'natural' | 'chemical' | 'both';
        inquiryUrl = settings.inquiryUrl;
        pricing = settings.pricing;
      }
    }

    // 診断結果を計算（価格設定を渡す）
    const result = calculateDiagnosis(answers, preferredMaterial, pricing);

    // セッションIDを生成
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 結果を保存
    await saveDiagnosisResult(c.env.DB, userId || null, sessionId, answers, result);

    return c.json({
      success: true,
      result: {
        ...result,
        inquiryUrl,
      },
    });
  } catch (error) {
    console.error('Diagnosis calculation error:', error);
    return c.json({ error: '診断の計算に失敗しました' }, 500);
  }
});

// 診断設定を保存（管理者用）
diagnosis.post('/settings', async (c) => {
  try {
    const user = await getUserFromSession(c.env.DB, c);
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401);
    }

    const { preferredMaterial, inquiryUrl, pricing } = await c.req.json();

    if (!preferredMaterial) {
      return c.json({ error: 'preferredMaterialは必須です' }, 400);
    }

    if (!['natural', 'chemical', 'both'].includes(preferredMaterial)) {
      return c.json({ error: 'preferredMaterialは natural, chemical, both のいずれかです' }, 400);
    }

    // 価格設定の検証
    if (!pricing || !pricing.urakaeshi || !pricing.omoteae || !pricing.shincho) {
      return c.json({ error: '価格設定が不正です' }, 400);
    }

    // 価格が正の整数であることを確認
    const validatePrice = (price: any) => {
      return price && typeof price.min === 'number' && typeof price.max === 'number' &&
             price.min > 0 && price.max > 0 && price.min <= price.max;
    };

    if (!validatePrice(pricing.urakaeshi) || !validatePrice(pricing.omoteae) || !validatePrice(pricing.shincho)) {
      return c.json({ error: '価格設定の形式が不正です' }, 400);
    }

    await saveDiagnosisSettings(c.env.DB, user.id, preferredMaterial, inquiryUrl || '', pricing);

    return c.json({ success: true });
  } catch (error) {
    console.error('Settings save error:', error);
    return c.json({ error: '設定の保存に失敗しました' }, 500);
  }
});

// 診断設定を取得
diagnosis.get('/settings', async (c) => {
  try {
    const user = await getUserFromSession(c.env.DB, c);
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401);
    }

    const settings = await getDiagnosisSettings(c.env.DB, user.id);

    return c.json({
      success: true,
      settings: settings || {
        preferredMaterial: 'both',
        inquiryUrl: '',
        pricing: {
          urakaeshi: { min: 5000, max: 8000 },
          omoteae: { min: 8000, max: 15000 },
          shincho: { min: 15000, max: 25000 },
        },
      },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return c.json({ error: '設定の取得に失敗しました' }, 500);
  }
});

export default diagnosis;
