// 文字数をカウント（空白・改行を除く）
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length;
}

// キーワード密度を計算
export function calculateKeywordDensity(text: string, keyword: string): number {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  const normalizedKeyword = keyword.toLowerCase();
  
  const totalWords = normalizedText.split(' ').length;
  const keywordMatches = (normalizedText.match(new RegExp(normalizedKeyword, 'g')) || []).length;
  
  if (totalWords === 0) return 0;
  return (keywordMatches / totalWords) * 100;
}

// メタディスクリプションを生成（導入文から120文字）
export function generateMetaDescription(introduction: string): string {
  const cleaned = introduction.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 120) return cleaned;
  return cleaned.substring(0, 117) + '...';
}

// テキストからキーワードを抽出（簡易版）
export function extractKeywords(text: string, count: number = 5): string[] {
  // 日本語の助詞や一般的な単語を除外するストップワード
  const stopWords = new Set([
    'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 
    'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる', 'など', 'なっ', 
    'ない', 'この', 'ため', 'その', 'あっ', 'よう', 'また', 'もの', 'という', 'あり',
    'まで', 'られ', 'なる', 'へ', 'か', 'だ', 'これ', 'によって', 'により', 'おり',
    'より', 'による', 'ず', 'なり', 'られる', 'において', 'ば', 'なかっ', 'なく', 'しかし'
  ]);

  // テキストを単語に分割（2文字以上）
  const words = text
    .replace(/[、。！？\n\r]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.has(word));

  // 単語の出現回数をカウント
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // 出現回数でソートして上位を取得
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

// SEOスコアを計算（0-100）
export function calculateSEOScore(
  characterCount: number,
  keywordDensity: number,
  hasMetaDescription: boolean,
  keywordCount: number
): number {
  let score = 0;

  // 文字数（3000文字前後が理想）
  if (characterCount >= 2500 && characterCount <= 3500) {
    score += 30;
  } else if (characterCount >= 2000 && characterCount <= 4000) {
    score += 20;
  } else if (characterCount >= 1500) {
    score += 10;
  }

  // キーワード密度（1-3%が理想）
  if (keywordDensity >= 1 && keywordDensity <= 3) {
    score += 30;
  } else if (keywordDensity >= 0.5 && keywordDensity <= 4) {
    score += 20;
  } else if (keywordDensity > 0) {
    score += 10;
  }

  // メタディスクリプション
  if (hasMetaDescription) {
    score += 20;
  }

  // キーワード数
  if (keywordCount >= 3) {
    score += 20;
  } else if (keywordCount >= 1) {
    score += 10;
  }

  return Math.min(score, 100);
}
