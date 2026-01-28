// 環境変数とバインディングの型定義
export type Bindings = {
  DB: D1Database;
  AI_PROVIDER?: string; // AIプロバイダー（gemini/openai/claude）
  GEMINI_API_KEY?: string; // Gemini API Key
  OPENAI_API_KEY?: string; // OpenAI API Key（オプション）
  CLAUDE_API_KEY?: string; // Claude API Key（オプション）
  CUSTOM_MODEL_ID?: string; // Fine-tuningモデルID（オプション）
  ACCOUNT_STATUS?: string; // アカウント状態
  COMPANY_NAME?: string;
  COMPANY_DESCRIPTION?: string;
  COMPANY_STRENGTHS?: string;
  COMPANY_FEATURES?: string;
  COMPANY_REGIONS?: string;
  COMPANY_WEBSITE?: string;
  SESSION_SECRET?: string; // オプション（認証使わない場合）
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
