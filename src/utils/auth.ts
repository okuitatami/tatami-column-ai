import type { User, Session } from '../types';

// パスワードをハッシュ化（簡易版 - 本番環境では bcrypt 等を使用）
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// パスワード検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// ランダムなセッションIDを生成
export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// セッションの有効期限を計算（7日間）
export function getSessionExpiry(): string {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry.toISOString();
}

// セッションCookieを設定
export function setSessionCookie(sessionId: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7日間（秒）
  return `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// セッションCookieを削除
export function clearSessionCookie(): string {
  return `session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// CookieからセッションIDを取得
export function getSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session_id='));
  
  if (!sessionCookie) return null;
  return sessionCookie.split('=')[1];
}
