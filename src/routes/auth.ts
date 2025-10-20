import { Hono } from 'hono';
import type { Bindings, User } from '../types';
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSessionIdFromCookie
} from '../utils/auth';
import {
  createUser,
  getUserByUsername,
  getUserWithPassword,
  createSession,
  deleteSession,
  getUserFromSession
} from '../utils/db';

const auth = new Hono<{ Bindings: Bindings }>();

// ユーザー登録
auth.post('/register', async (c) => {
  try {
    const { username, password, email } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'ユーザー名とパスワードは必須です' }, 400);
    }

    if (username.length < 3) {
      return c.json({ error: 'ユーザー名は3文字以上必要です' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'パスワードは6文字以上必要です' }, 400);
    }

    // ユーザー名の重複チェック
    const existingUser = await getUserByUsername(c.env.DB, username);
    if (existingUser) {
      return c.json({ error: 'このユーザー名は既に使用されています' }, 409);
    }

    // パスワードをハッシュ化してユーザーを作成
    const passwordHash = await hashPassword(password);
    const user = await createUser(c.env.DB, username, passwordHash, email);

    // セッションを作成
    const session = await createSession(c.env.DB, user.id);

    // レスポンスにセッションCookieを設定
    c.header('Set-Cookie', setSessionCookie(session.id));

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: '登録に失敗しました' }, 500);
  }
});

// ログイン
auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'ユーザー名とパスワードは必須です' }, 400);
    }

    // ユーザーを取得
    const user = await getUserWithPassword(c.env.DB, username);
    if (!user) {
      return c.json({ error: 'ユーザー名またはパスワードが正しくありません' }, 401);
    }

    // パスワードを検証
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'ユーザー名またはパスワードが正しくありません' }, 401);
    }

    // セッションを作成
    const session = await createSession(c.env.DB, user.id);

    // レスポンスにセッションCookieを設定
    c.header('Set-Cookie', setSessionCookie(session.id));

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'ログインに失敗しました' }, 500);
  }
});

// ログアウト
auth.post('/logout', async (c) => {
  try {
    const sessionId = getSessionIdFromCookie(c.req.header('Cookie') || '');
    
    if (sessionId) {
      await deleteSession(c.env.DB, sessionId);
    }

    // セッションCookieをクリア
    c.header('Set-Cookie', clearSessionCookie());

    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'ログアウトに失敗しました' }, 500);
  }
});

// 現在のユーザー情報を取得
auth.get('/me', async (c) => {
  try {
    const sessionId = getSessionIdFromCookie(c.req.header('Cookie') || '');
    
    if (!sessionId) {
      return c.json({ error: '認証が必要です' }, 401);
    }

    const user = await getUserFromSession(c.env.DB, sessionId);
    if (!user) {
      return c.json({ error: 'セッションが無効です' }, 401);
    }

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'ユーザー情報の取得に失敗しました' }, 500);
  }
});

export default auth;
