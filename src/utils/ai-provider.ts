import type { TitleCandidate, ColumnStructure, WebsiteAnalysis, AIProvider } from '../types';
import * as claude from './claude';
import * as genspark from './genspark-ai';

// AI Provider統一インターフェース
export interface AIProviderInterface {
  generateTitles(keywords: string[], websiteInfo?: WebsiteAnalysis): Promise<TitleCandidate[]>;
  generateColumn(keywords: string[], selectedTitle: string, websiteInfo?: WebsiteAnalysis): Promise<ColumnStructure>;
  analyzeWebsite(url: string, htmlContent: string): Promise<WebsiteAnalysis>;
}

// GenSpark AI Provider実装（完全無料、キーワードベース）
class GenSparkProvider implements AIProviderInterface {
  async generateTitles(keywords: string[], websiteInfo?: WebsiteAnalysis): Promise<TitleCandidate[]> {
    return await genspark.generateTitles(keywords, websiteInfo);
  }

  async generateColumn(keywords: string[], selectedTitle: string, websiteInfo?: WebsiteAnalysis): Promise<ColumnStructure> {
    return await genspark.generateColumn(keywords, selectedTitle, websiteInfo);
  }

  async analyzeWebsite(url: string, htmlContent: string): Promise<WebsiteAnalysis> {
    return await genspark.analyzeWebsite(url, htmlContent);
  }
}

// Claude AI Provider実装
class ClaudeProvider implements AIProviderInterface {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateTitles(theme: string, websiteInfo?: WebsiteAnalysis): Promise<TitleCandidate[]> {
    return await claude.generateTitles(this.apiKey, theme, websiteInfo);
  }

  async generateColumn(theme: string, selectedTitle: string, websiteInfo?: WebsiteAnalysis): Promise<ColumnStructure> {
    return await claude.generateColumn(this.apiKey, theme, selectedTitle, websiteInfo);
  }

  async analyzeWebsite(url: string, htmlContent: string): Promise<WebsiteAnalysis> {
    return await claude.analyzeWebsite(this.apiKey, url, htmlContent);
  }
}

// プロバイダーファクトリー
export function getAIProvider(provider: AIProvider, openaiKey?: string, claudeKey?: string): AIProviderInterface {
  switch (provider) {
    case 'genspark':
      // GenSparkは完全無料、APIキー不要
      return new GenSparkProvider();
    case 'claude':
      if (!claudeKey) {
        throw new Error('Claude API key is required when using Claude provider');
      }
      return new ClaudeProvider(claudeKey);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// 環境変数からプロバイダーを取得
export function getProviderFromEnv(aiProviderEnv?: string): AIProvider {
  const provider = (aiProviderEnv || 'genspark').toLowerCase();
  
  if (provider === 'claude' || provider === 'genspark') {
    return provider as AIProvider;
  }
  
  console.warn(`Unknown AI_PROVIDER: ${provider}, defaulting to genspark`);
  return 'genspark';
}
