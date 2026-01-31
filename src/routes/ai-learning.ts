import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getUserFromSession } from '../utils/db';
import {
  saveColumnCorrection,
  saveColumnEvaluation,
  getApprovalRate,
} from '../utils/ai-learning';

const aiLearning = new Hono<{ Bindings: Bindings }>();

// コラム評価を保存（Yes/No判定）
aiLearning.post('/evaluate', async (c) => {
  try {
    const user = await getUserFromSession(c.env.DB, c);
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401);
    }

    const { columnId, isApproved, feedback } = await c.req.json();

    if (!columnId || typeof isApproved !== 'boolean') {
      return c.json({ error: 'columnIdとisApprovedは必須です' }, 400);
    }

    await saveColumnEvaluation(
      c.env.DB,
      user.id,
      columnId,
      isApproved,
      feedback || null
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Evaluation save error:', error);
    return c.json({ error: '評価の保存に失敗しました' }, 500);
  }
});

// セクション訂正を保存
aiLearning.post('/correct', async (c) => {
  try {
    const user = await getUserFromSession(c.env.DB, c);
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401);
    }

    const {
      columnId,
      sectionType,
      sectionIndex,
      originalHeading,
      originalContent,
      correctedHeading,
      correctedContent,
      correctionReason,
      keywords,
      regions,
    } = await c.req.json();

    if (!sectionType || !originalContent || !correctedContent) {
      return c.json(
        { error: 'sectionType, originalContent, correctedContentは必須です' },
        400
      );
    }

    await saveColumnCorrection(
      c.env.DB,
      user.id,
      columnId || null,
      sectionType,
      sectionIndex || null,
      originalHeading || null,
      originalContent,
      correctedHeading || null,
      correctedContent,
      correctionReason || null,
      keywords || [],
      regions || []
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Correction save error:', error);
    return c.json({ error: '訂正の保存に失敗しました' }, 500);
  }
});

// 承認率を取得
aiLearning.get('/approval-rate', async (c) => {
  try {
    const user = await getUserFromSession(c.env.DB, c);
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401);
    }

    const stats = await getApprovalRate(c.env.DB, user.id);

    return c.json({ success: true, stats });
  } catch (error) {
    console.error('Approval rate fetch error:', error);
    return c.json({ error: '承認率の取得に失敗しました' }, 500);
  }
});

export default aiLearning;
