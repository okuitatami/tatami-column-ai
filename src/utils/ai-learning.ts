import type { D1Database } from '@cloudflare/workers-types';

// コラム訂正を保存
export async function saveColumnCorrection(
  db: D1Database,
  userId: number,
  columnId: number | null,
  sectionType: 'introduction' | 'section' | 'closing' | 'qa',
  sectionIndex: number | null,
  originalHeading: string | null,
  originalContent: string,
  correctedHeading: string | null,
  correctedContent: string,
  correctionReason: string | null,
  keywords: string[],
  regions: string[]
): Promise<number> {
  const result = await db
    .prepare(`
      INSERT INTO column_corrections (
        user_id, column_id, section_type, section_index,
        original_heading, original_content,
        corrected_heading, corrected_content,
        correction_reason, keywords, regions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      userId,
      columnId,
      sectionType,
      sectionIndex,
      originalHeading,
      originalContent,
      correctedHeading,
      correctedContent,
      correctionReason,
      JSON.stringify(keywords),
      JSON.stringify(regions)
    )
    .run();

  return result.meta.last_row_id as number;
}

// コラム評価を保存
export async function saveColumnEvaluation(
  db: D1Database,
  userId: number,
  columnId: number,
  isApproved: boolean,
  feedback: string | null
): Promise<number> {
  const result = await db
    .prepare(`
      INSERT INTO column_evaluations (user_id, column_id, is_approved, feedback)
      VALUES (?, ?, ?, ?)
    `)
    .bind(userId, columnId, isApproved ? 1 : 0, feedback)
    .run();

  return result.meta.last_row_id as number;
}

// 過去の訂正データを取得（プロンプトに追加するため）
export async function getRecentCorrections(
  db: D1Database,
  userId: number,
  keywords: string[],
  limit: number = 5
): Promise<Array<{
  sectionType: string;
  originalContent: string;
  correctedContent: string;
  correctionReason: string | null;
}>> {
  // キーワードに基づいて関連する訂正を取得
  const keywordConditions = keywords.map(() => "keywords LIKE ?").join(" OR ");
  const keywordParams = keywords.map(k => `%"${k}"%`);

  const query = `
    SELECT section_type, original_content, corrected_content, correction_reason
    FROM column_corrections
    WHERE user_id = ? AND (${keywordConditions})
    ORDER BY created_at DESC
    LIMIT ?
  `;

  const result = await db
    .prepare(query)
    .bind(userId, ...keywordParams, limit)
    .all();

  return result.results as Array<{
    sectionType: string;
    originalContent: string;
    correctedContent: string;
    correctionReason: string | null;
  }>;
}

// 訂正データをプロンプトに追加する形式に変換
export function formatCorrectionsForPrompt(
  corrections: Array<{
    sectionType: string;
    originalContent: string;
    correctedContent: string;
    correctionReason: string | null;
  }>
): string {
  if (corrections.length === 0) {
    return '';
  }

  let prompt = '\n\n【過去の訂正履歴から学習】\n';
  prompt += '以下は過去に訂正された内容です。同様の間違いを避けてください：\n\n';

  corrections.forEach((correction, index) => {
    prompt += `訂正${index + 1}（${correction.sectionType}）:\n`;
    prompt += `× 元の内容: ${correction.originalContent.substring(0, 100)}...\n`;
    prompt += `○ 訂正後: ${correction.correctedContent.substring(0, 100)}...\n`;
    if (correction.correctionReason) {
      prompt += `理由: ${correction.correctionReason}\n`;
    }
    prompt += '\n';
  });

  return prompt;
}

// コラム承認率を取得
export async function getApprovalRate(
  db: D1Database,
  userId: number
): Promise<{ total: number; approved: number; rate: number }> {
  const result = await db
    .prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved
      FROM column_evaluations
      WHERE user_id = ?
    `)
    .bind(userId)
    .first();

  const total = (result?.total as number) || 0;
  const approved = (result?.approved as number) || 0;
  const rate = total > 0 ? (approved / total) * 100 : 0;

  return { total, approved, rate };
}
