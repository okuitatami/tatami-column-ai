// AI Provider型
export type AIProvider = 'genspark' | 'claude';

// 環境変数とバインディングの型定義
export type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  AI_PROVIDER?: string;
  SESSION_SECRET: string;
}

// ユーザー型
export type User = {
  id: number;
  username: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// セッション型
export type Session = {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

// コラム構造型
export type ColumnStructure = {
  title: string;
  introduction: string;
  sections: {
    heading: string;
    content: string;
  }[];
  closing: {
    heading: string;
    content: string;
  };
  qa: {
    question: string;
    answer: string;
  }[];
  metaDescription?: string;
  keywords?: string[];
}

// タイトル候補型
export type TitleCandidate = {
  id: string;
  title: string;
  description: string;
}

// HP解析結果型
export type WebsiteAnalysis = {
  url: string;
  title?: string;
  description?: string;
  keywords?: string[];
  mainContent?: string;
  features?: string[];
  strengths?: string[];
}
