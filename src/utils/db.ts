import type { User, Session } from '../types';
import { generateSessionId, getSessionExpiry } from './auth';

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
