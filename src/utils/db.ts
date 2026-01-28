import type { User, Session, ColumnStructure } from '../types';
import { generateSessionId, getSessionExpiry } from './auth';

// コラム履歴の型定義
export type ColumnHistory = {
  id: number;
  user_id: number;
  title: string;
  introduction: string;
  sections: string; // JSON
  closing: string; // JSON
  qa: string; // JSON
  keywords: string | null; // JSON
  regions: string | null; // JSON
  target_audience: string | null;
  meta_description: string | null;
  character_count: number;
  created_at: string;
  updated_at: string;
};

// ユーザーを作成
export async function createUser(
  db: D1Database,
  username: string,
  passwordHash: string,
  email?: string
): Promise<User> {
  const result = await db
    .prepare(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?) RETURNING id, username, email, created_at, updated_at'
    )
    .bind(username, passwordHash, email || null)
    .first<User>();

  if (!result) {
    throw new Error('ユーザーの作成に失敗しました');
  }

  return result;
}

// ユーザー名でユーザーを取得
export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  return await db
    .prepare('SELECT id, username, email, created_at, updated_at FROM users WHERE username = ?')
    .bind(username)
    .first<User>();
}

// ユーザー名とパスワードハッシュでユーザーを取得（ログイン用）
export async function getUserWithPassword(
  db: D1Database,
  username: string
): Promise<(User & { password_hash: string }) | null> {
  return await db
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first<User & { password_hash: string }>();
}

// IDでユーザーを取得
export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  return await db
    .prepare('SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?')
    .bind(userId)
    .first<User>();
}

// セッションを作成
export async function createSession(db: D1Database, userId: number): Promise<Session> {
  const sessionId = generateSessionId();
  const expiresAt = getSessionExpiry();

  const result = await db
    .prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?) RETURNING *'
    )
    .bind(sessionId, userId, expiresAt)
    .first<Session>();

  if (!result) {
    throw new Error('セッションの作成に失敗しました');
  }

  return result;
}

// セッションを取得
export async function getSession(db: D1Database, sessionId: string): Promise<Session | null> {
  return await db
    .prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")')
    .bind(sessionId)
    .first<Session>();
}

// セッションを削除
export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

// 期限切れセッションを削除
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")').run();
}

// セッションからユーザーを取得
export async function getUserFromSession(
  db: D1Database,
  sessionId: string
): Promise<User | null> {
  const result = await db
    .prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.updated_at
      FROM users u
      INNER JOIN sessions s ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime("now")
    `)
    .bind(sessionId)
    .first<User>();

  return result;
}

// コラム履歴を保存
export async function saveColumnHistory(
  db: D1Database,
  userId: number,
  column: ColumnStructure,
  keywords?: string[],
  regions?: string[],
  targetAudience?: string
): Promise<ColumnHistory> {
  // 文字数をカウント
  const fullText = [
    column.title,
    column.introduction,
    ...column.sections.map(s => s.heading + ' ' + s.content),
    column.closing.heading,
    column.closing.content,
    ...column.qa.map(q => q.question + ' ' + q.answer)
  ].join(' ');
  const characterCount = fullText.replace(/\s/g, '').length;

  const result = await db
    .prepare(`
      INSERT INTO column_history (
        user_id, title, introduction, sections, closing, qa,
        keywords, regions, target_audience, meta_description, character_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      userId,
      column.title,
      column.introduction,
      JSON.stringify(column.sections),
      JSON.stringify(column.closing),
      JSON.stringify(column.qa),
      keywords ? JSON.stringify(keywords) : null,
      regions ? JSON.stringify(regions) : null,
      targetAudience || null,
      column.metaDescription || null,
      characterCount
    )
    .first<ColumnHistory>();

  if (!result) {
    throw new Error('コラム履歴の保存に失敗しました');
  }

  return result;
}

// ユーザーのコラム履歴を取得（最新順）
export async function getColumnHistoryByUser(
  db: D1Database,
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<ColumnHistory[]> {
  const results = await db
    .prepare(`
      SELECT * FROM column_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(userId, limit, offset)
    .all<ColumnHistory>();

  return results.results || [];
}

// コラム履歴をIDで取得
export async function getColumnHistoryById(
  db: D1Database,
  historyId: number,
  userId: number
): Promise<ColumnHistory | null> {
  return await db
    .prepare('SELECT * FROM column_history WHERE id = ? AND user_id = ?')
    .bind(historyId, userId)
    .first<ColumnHistory>();
}

// コラム履歴を削除
export async function deleteColumnHistory(
  db: D1Database,
  historyId: number,
  userId: number
): Promise<void> {
  await db
    .prepare('DELETE FROM column_history WHERE id = ? AND user_id = ?')
    .bind(historyId, userId)
    .run();
}

// コラム履歴を検索（タイトルとキーワードで）
export async function searchColumnHistory(
  db: D1Database,
  userId: number,
  searchQuery: string,
  limit: number = 50
): Promise<ColumnHistory[]> {
  const results = await db
    .prepare(`
      SELECT * FROM column_history
      WHERE user_id = ?
      AND (
        title LIKE ? OR
        keywords LIKE ? OR
        introduction LIKE ?
      )
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .bind(userId, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, limit)
    .all<ColumnHistory>();

  return results.results || [];
}

// コラム履歴から ColumnStructure に変換
export function columnHistoryToStructure(history: ColumnHistory): ColumnStructure {
  return {
    title: history.title,
    introduction: history.introduction,
    sections: JSON.parse(history.sections),
    closing: JSON.parse(history.closing),
    qa: JSON.parse(history.qa),
    keywords: history.keywords ? JSON.parse(history.keywords) : undefined,
    metaDescription: history.meta_description || undefined
  };
}
