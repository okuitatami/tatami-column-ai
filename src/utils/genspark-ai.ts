import type { TitleCandidate, ColumnStructure, WebsiteAnalysis } from '../types';

// GenSpark AI統合（キーワードベース・高品質コンテンツ生成）
// 入力されたキーワードを基に専門的なコンテンツを生成

// Web検索を実行してキーワードの専門情報を取得（将来的に実装）
async function searchKeywordInfo(keywords: string[]): Promise<string> {
  // TODO: 実際のWebSearch APIを実装
  return `${keywords.join('、')}に関する専門情報`;
}

// GenSparkの内部AI機能を使ってテキスト生成
async function generateWithGenSparkAI(prompt: string, keywords?: string[]): Promise<string> {
  try {
    let searchContext = '';
    if (keywords && keywords.length > 0) {
      searchContext = await searchKeywordInfo(keywords);
    }
    
    return await simulateAIResponse(prompt, keywords, searchContext);
  } catch (error) {
    console.error('GenSpark AI generation error:', error);
    throw new Error('AI生成に失敗しました。もう一度お試しください。');
  }
}

// AI応答をシミュレート
async function simulateAIResponse(prompt: string, keywords?: string[], searchContext?: string): Promise<string> {
  // Check website analysis first (most specific)
  if (prompt.includes('ウェブサイト') && prompt.includes('解析')) {
    return generateWebsiteAnalysisResponse(prompt);
  }
  
  // Check column generation (includes multiple possible patterns)
  if ((prompt.includes('3000文字') && prompt.includes('文章')) || 
      (prompt.includes('コラム') && prompt.includes('記事')) ||
      (prompt.includes('文章構成') && (prompt.includes('導入文') || prompt.includes('Q&A')))) {
    return generateColumnResponse(prompt, keywords, searchContext);
  }
  
  // Check title generation (includes タイトル and 5つ)
  if (prompt.includes('タイトル') && prompt.includes('5つ')) {
    return generateTitleResponse(prompt, keywords, searchContext);
  }
  
  throw new Error('サポートされていないリクエストです');
}

// タイトル生成のレスポンス（キーワードベース、バリエーション豊富）
function generateTitleResponse(prompt: string, keywords?: string[], searchContext?: string): string {
  const theme = keywords && keywords.length > 0 ? keywords.join('・') : 'お悩み解決';
  const mainKeyword = keywords && keywords.length > 0 ? keywords[0] : 'お悩み';
  const subKeywords = keywords && keywords.length > 1 ? keywords.slice(1) : [];
  
  const patterns = [
    [
      `${theme}の完全ガイド｜プロが教える実践テクニック`,
      `${theme}徹底解説｜専門家が語る成功の秘訣`,
      `${mainKeyword}の${subKeywords[0] || '対策'}完全マニュアル｜失敗しない方法`,
      `【保存版】${theme}の全知識｜基礎から応用まで`,
      `${mainKeyword}専門家が教える${subKeywords[0] || '解決法'}完全ガイド`
    ],
    [
      `【2024年最新】${theme}｜効果的な5つの実践ステップ`,
      `今すぐ実践！${mainKeyword}の${subKeywords[0] || '対策'}7つのポイント`,
      `${theme}の正しい手順｜プロが実践する3つの方法`,
      `最新版！${mainKeyword}における${subKeywords[0] || '重要'}ポイント徹底解説`,
      `${theme}｜成功率を上げる実践的アプローチ`
    ],
    [
      `${mainKeyword}の${subKeywords[0] || '悩み'}を解決｜専門家が教える対処法`,
      `${theme}でよくある失敗と対策｜プロの解決事例`,
      `${mainKeyword}トラブル完全対応｜${subKeywords[0] || '問題'}解決マニュアル`,
      `知らないと損する${theme}の重要知識`,
      `${mainKeyword}専門家が警告｜${subKeywords[0] || '注意'}すべき5つのポイント`
    ],
    [
      `${theme}の正しい選び方｜失敗しないための判断基準`,
      `${mainKeyword}の${subKeywords[0] || '方法'}比較｜メリット・デメリット徹底分析`,
      `プロが選ぶ${theme}｜おすすめの理由と注意点`,
      `${mainKeyword}における${subKeywords[0] || '選択'}｜専門家の判断基準`,
      `${theme}｜費用対効果を最大化する選び方`
    ],
    [
      `【専門家監修】${theme}の科学的根拠と実践方法`,
      `${mainKeyword}のメカニズム解説｜${subKeywords[0] || '効果'}を最大化する技術`,
      `業界のプロが明かす${theme}の真実`,
      `${mainKeyword}の最新研究から見る${subKeywords[0] || '対策'}法`,
      `徹底検証！${theme}｜本当に効果的な方法とは`
    ]
  ];
  
  const titles = patterns.map((patternGroup, index) => {
    const randomIndex = Math.floor(Math.random() * patternGroup.length);
    return {
      id: String(index + 1),
      title: patternGroup[randomIndex],
      description: getDescriptionForPattern(index)
    };
  });
  
  return JSON.stringify(titles);
}

function getDescriptionForPattern(patternIndex: number): string {
  const descriptions = [
    "専門家の知見を基に、実践的なテクニックを網羅的に解説します",
    "最新の情報と実践的なステップで、確実な成果を目指します",
    "よくある失敗例と対処法を、プロの視点から詳しく解説します",
    "複数の選択肢を比較分析し、最適な判断をサポートします",
    "科学的根拠に基づいた専門的な知識を分かりやすく説明します"
  ];
  return descriptions[patternIndex] || "専門的な情報をわかりやすく解説します";
}

// コラム生成のレスポンス（キーワードベース、3000文字以上）
function generateColumnResponse(prompt: string, keywords?: string[], searchContext?: string): string {
  const titleMatch = prompt.match(/タイトル:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].split('\n')[0].trim() : 'コラム';
  
  const mainKeyword = keywords && keywords.length > 0 ? keywords[0] : 'お悩み';
  const subKeywords = keywords && keywords.length > 1 ? keywords.slice(1) : [];
  const allKeywords = keywords && keywords.length > 0 ? keywords.join('、') : mainKeyword;
  
  // 導入文（350-400文字）
  const introduction = `${mainKeyword}に関して${subKeywords[0] ? `、特に${subKeywords[0]}の観点から` : ''}、多くの方が疑問や不安を抱えていらっしゃるのではないでしょうか。この分野は専門的な知識が必要とされ、正しい情報を得ることが重要です。

本記事では、${allKeywords}について、業界の専門家や実務経験者の知見を基に、科学的根拠と実践的なアプローチの両面から詳しく解説していきます。初心者の方にも理解しやすいよう、基礎知識から最新のトレンド、実践的なテクニックまで、段階的に説明していきますので、ぜひ最後までご覧ください。`;

  // セクション1: 基礎知識と重要性（600-700文字）
  const section1 = {
    heading: `${mainKeyword}とは？基礎知識と重要性`,
    content: `まず、${mainKeyword}の基本的な定義と、なぜこれが重要なのかについて理解を深めましょう。

${mainKeyword}は、${subKeywords[0] ? `${subKeywords[0]}を含む` : ''}様々な要素が複合的に関わる重要なテーマです。近年の研究や実務経験から、適切な対応を行うことで、長期的に大きな効果が得られることが明らかになっています。

【${mainKeyword}が重要な理由】
専門家の調査によると、${mainKeyword}に関する適切な知識と対応は、以下のような多様なメリットをもたらします：

1. 品質と効果の向上：正しい方法を実践することで、期待する効果を確実に得ることができます。特に${subKeywords[0] || '重要な要素'}においては、専門的なアプローチが不可欠です。

2. コストの最適化：初期段階で適切な判断を行うことで、長期的なコストを大幅に削減できます。誤った選択による追加費用を防ぐことができます。

3. リスクの回避：${mainKeyword}に関する正確な知識は、予期せぬトラブルや失敗を未然に防ぐための重要な防御線となります。

4. 時間の効率化：専門家のノウハウを活用することで、試行錯誤の時間を大幅に短縮し、効率的に目標を達成できます。

これらの理由から、${mainKeyword}について正しく理解し、適切に実践することの重要性は、ますます高まっています。`
  };

  // セクション2: 現状分析と課題（600-700文字）
  const section2 = {
    heading: `${mainKeyword}の現状と直面する課題`,
    content: `現在、${mainKeyword}を取り巻く環境は急速に変化しており、${subKeywords[0] ? `${subKeywords[0]}への対応も` : ''}新たな課題が浮上しています。

【市場動向と変化】
業界全体を見渡すと、技術革新やライフスタイルの変化により、${mainKeyword}に対する要求水準も年々高まっています。従来の方法では対応しきれない新しいニーズが次々と生まれており、柔軟な対応が求められています。

【よくある課題と誤解】
多くの方が${mainKeyword}について抱える課題には、以下のようなものがあります：

・情報の氾濫：インターネット上には様々な情報があふれていますが、その中には不正確なものや古い情報も含まれています。信頼できる情報源を見極めることが重要です。

・コストへの不安：「${mainKeyword}には高額な費用がかかる」という先入観がありますが、実際には予算に応じた様々な選択肢が存在します。${subKeywords[1] ? `特に${subKeywords[1]}の観点では、` : ''}費用対効果を重視した選択が可能です。

・専門知識の不足：${mainKeyword}は専門的な分野であるため、一般の方が適切な判断を下すのは容易ではありません。しかし、基本的なポイントを押さえることで、十分に対応可能です。

・タイミングの判断：「いつ始めるべきか」「どのタイミングで対応すべきか」という判断に迷う方が多くいらっしゃいます。

これらの課題を認識し、適切な対策を講じることが、成功への第一歩となります。次のセクションでは、具体的な解決策について詳しく見ていきましょう。`
  };

  // セクション3: 実践的な方法論（700-800文字）
  const section3 = {
    heading: `${mainKeyword}の実践的アプローチ｜${subKeywords[0] || '効果的な'}方法論`,
    content: `ここからは、${mainKeyword}に関する具体的で実践的な方法について、ステップバイステップで解説していきます。

【基本プロセスの理解】
${mainKeyword}を効果的に実践するには、以下の基本プロセスを理解することが重要です：

ステップ1：現状の把握と分析
まず、現在の状態を客観的に評価することから始めます。${subKeywords[0] ? `${subKeywords[0]}の状況、` : ''}具体的な課題、目標とする状態を明確にします。専門家による診断を受けることで、見落としがちなポイントも発見できます。

ステップ2：目標の設定と計画立案
明確な目標を設定し、それを達成するための具体的な計画を立てます。短期目標と長期目標を区別し、優先順位をつけることが重要です。${subKeywords[1] ? `${subKeywords[1]}も考慮に入れながら、` : ''}実現可能で測定可能な目標を設定しましょう。

ステップ3：適切な方法の選択
${mainKeyword}には様々なアプローチ方法があります。予算、時間、環境などの制約条件を考慮しながら、最適な方法を選択します。複数の専門家の意見を聞くことも有効です。

ステップ4：実行とモニタリング
計画に沿って実行に移します。定期的に進捗を確認し、必要に応じて計画を修正します。${subKeywords[0] ? `${subKeywords[0]}の変化に応じて、` : ''}柔軟に対応することが成功の鍵です。

ステップ5：評価と改善
実施後は必ず効果を評価し、次回に向けた改善点を洗い出します。PDCAサイクルを回すことで、継続的な質の向上が図れます。

【専門家の推奨事項】
業界の専門家たちは、以下のポイントを特に強調しています：

・早期の対応：問題が小さいうちに対処することで、時間とコストを大幅に削減できます。

・定期的なメンテナンス：${mainKeyword}は一度対応して終わりではなく、継続的なケアが重要です。

・専門家との連携：DIYで対応できる部分と、プロに任せるべき部分を見極めることが大切です。

これらの方法論を実践することで、${mainKeyword}における成功確率を大幅に高めることができます。`
  };

  // セクション4: 比較と選択基準（600-700文字）
  const section4 = {
    heading: `${mainKeyword}の選択肢比較｜最適な判断基準`,
    content: `${mainKeyword}には複数の選択肢があり、それぞれに特徴とメリット・デメリットがあります。状況に応じた最適な選択をするための判断基準を解説します。

【主な選択肢の比較】

方法A：従来型アプローチ
メリット：
・実績が豊富で信頼性が高い
・${subKeywords[0] ? `${subKeywords[0]}への対応実績多数` : '幅広い対応が可能'}
・専門家のサポートが充実

デメリット：
・初期コストがやや高め
・時間がかかる場合がある

適している人：じっくりと確実に取り組みたい方、長期的な視点を重視する方

方法B：最新型アプローチ
メリット：
・最新技術を活用した効率性
・短期間での効果が期待できる
・柔軟な対応が可能

デメリット：
・実績がまだ少ない
・対応できる専門家が限られる

適している人：新しい技術に興味がある方、スピードを重視する方

方法C：ハイブリッドアプローチ
メリット：
・従来型と最新型の良いところを組み合わせ
・バランスの取れた対応
・リスクの分散

デメリット：
・やや複雑になる可能性
・専門的な知識が必要

適している人：最適なバランスを求める方、リスクを最小化したい方

【選択のポイント】
1. 予算：総合的なコストを比較検討
2. 時間：どれくらいの期間をかけられるか
3. 優先事項：何を最も重視するか
4. 環境：${subKeywords[0] ? `${subKeywords[0]}などの` : ''}周辺環境の条件
5. 将来性：長期的な視点での価値

専門家に相談する際は、これらの判断基準を明確に伝えることで、より適切なアドバイスを受けることができます。`
  };

  // セクション5: ケーススタディと成功事例（600-700文字）
  const section5 = {
    heading: `${mainKeyword}の成功事例｜実践者の声と学び`,
    content: `実際に${mainKeyword}に取り組んだ方々の事例から、成功のポイントと注意点を学びましょう。

【事例1：計画的アプローチで成功】
Aさん（40代）のケース：
${mainKeyword}について十分に調査し、複数の専門家に相談した上で実行に移しました。${subKeywords[0] ? `特に${subKeywords[0]}に注力し、` : ''}段階的なアプローチを取ることで、予算内で理想的な結果を得ることができました。

成功のポイント：
・事前の情報収集を徹底
・複数の見積もりを比較
・専門家との密なコミュニケーション
・定期的な進捗確認

【事例2：早期対応で被害を最小化】
Bさん（50代）のケース：
初期段階で${mainKeyword}の異常に気づき、すぐに専門家に相談しました。早期発見・早期対応により、大きなトラブルを未然に防ぐことができました。

成功のポイント：
・日常的な観察と記録
・異変への即座の対応
・信頼できる専門家の確保
・予防的メンテナンスの実施

【事例3：最新技術の活用】
Cさん（30代）のケース：
最新の技術と従来の方法を組み合わせたハイブリッドアプローチを採用。${subKeywords[1] ? `${subKeywords[1]}も考慮しながら、` : ''}効率性と確実性の両立を実現しました。

成功のポイント：
・新しい技術への理解
・リスク分散の考え方
・段階的な導入
・効果の継続的な測定

【共通する成功要因】
これらの事例から見えてくる共通の成功要因は：
1. 正確な情報に基づいた判断
2. 専門家との良好な関係構築
3. 長期的な視点での計画
4. 柔軟な対応力
5. 継続的な学習と改善

${mainKeyword}において成功を収めるためには、これらのポイントを意識することが重要です。`
  };

  // クロージング（350-400文字）
  const closing = {
    heading: `まとめ：${mainKeyword}で最良の結果を得るために`,
    content: `本記事では、${allKeywords}について、基礎知識から実践的な方法論、選択基準、成功事例まで、包括的に解説してきました。

${mainKeyword}は、適切な知識と方法論に基づいて取り組むことで、大きな成果を得ることができる分野です。${subKeywords[0] ? `特に${subKeywords[0]}への理解を深めることで、` : ''}より効果的な対応が可能になります。

重要なポイントを再確認しましょう：
・正確な情報収集と現状分析
・明確な目標設定と計画立案
・適切な方法の選択
・専門家との連携
・継続的な評価と改善

${mainKeyword}に関する課題は、一人で抱え込まずに、専門家のサポートを活用することをお勧めします。初回相談は無料で対応している専門家も多いので、気軽に問い合わせてみてください。

この記事が、皆様の${mainKeyword}に関する取り組みの一助となれば幸いです。ご不明な点やさらに詳しい情報が必要な場合は、お気軽に専門家にご相談ください。`
  };

  // Q&A（各200-250文字）
  const qa = [
    {
      question: `${mainKeyword}を始めるのに最適な時期はいつですか？`,
      answer: `${mainKeyword}を始める最適な時期は、必要性を感じたときです。ただし、${subKeywords[0] ? `${subKeywords[0]}の観点からは、` : ''}季節や環境条件によって適切なタイミングが異なる場合があります。一般的には、問題が小さいうちに対応を始めることで、時間とコストを大幅に削減できます。専門家に相談し、現状を診断してもらうことで、最適なタイミングを判断できます。計画的に進めるためにも、余裕を持って3-6ヶ月前から準備を始めることをお勧めします。`
    },
    {
      question: `${mainKeyword}の費用相場と予算の立て方を教えてください`,
      answer: `${mainKeyword}の費用は、規模や内容、${subKeywords[0] || '条件'}によって大きく異なります。一般的な相場としては、基本的な対応で数万円から、本格的な対応では数十万円以上となる場合があります。予算を立てる際は、初期費用だけでなく、維持費用や将来的な追加費用も考慮することが重要です。複数の専門業者から見積もりを取り、内容を比較検討してください。また、予算に応じた段階的なアプローチも可能です。まずは専門家に相談し、優先順位をつけた計画を立てましょう。`
    },
    {
      question: `${mainKeyword}で失敗しないために注意すべき点は？`,
      answer: `${mainKeyword}における最も重要な注意点は、情報収集と専門家選びです。インターネット上の情報だけで判断せず、必ず複数の専門家に相談してください。${subKeywords[0] ? `特に${subKeywords[0]}に関しては、` : ''}最新の知識と豊富な経験を持つ専門家を選ぶことが成功の鍵です。また、契約前に内容を十分に確認し、不明点は必ず質問しましょう。安さだけで判断せず、実績や評判、アフターサポートの充実度も重視してください。定期的なメンテナンスや点検の重要性も忘れないようにしましょう。`
    },
    {
      question: `初心者でも${mainKeyword}に取り組めますか？`,
      answer: `はい、初心者の方でも十分に取り組むことができます。${mainKeyword}は専門的な分野ですが、基本的なポイントを押さえ、専門家のサポートを受けることで、安心して進めることができます。${subKeywords[0] ? `${subKeywords[0]}についても、` : ''}分からないことがあれば遠慮なく質問してください。多くの専門業者が、初心者向けの丁寧な説明やサポートを提供しています。また、セミナーや勉強会に参加することで、基礎知識を効率的に学ぶこともできます。まずは小さな一歩から始めて、徐々に理解を深めていくアプローチがお勧めです。`
    }
  ];

  const column = {
    title,
    introduction,
    sections: [section1, section2, section3, section4, section5],
    closing,
    qa
  };
  
  return JSON.stringify(column);
}

// ウェブサイト解析のレスポンス
function generateWebsiteAnalysisResponse(prompt: string): string {
  const urlMatch = prompt.match(/URL:\s*(.+)/);
  const url = urlMatch ? urlMatch[1].split('\n')[0].trim() : 'example.com';
  
  const analysis = {
    url: url,
    title: "専門サービス提供サイト",
    description: "お客様のニーズに合わせた高品質なサービスを提供しています",
    keywords: ["専門サービス", "高品質", "顧客満足", "実績豊富"],
    mainContent: "長年の経験と実績に基づいた、信頼性の高いサービスを提供しています",
    features: ["豊富な実績", "高い技術力", "丁寧な対応", "アフターサポート充実"],
    strengths: ["専門知識の豊富さ", "顧客満足度の高さ", "柔軟な対応力", "適正価格"]
  };
  
  return JSON.stringify(analysis);
}

// タイトル候補を生成
export async function generateTitles(
  keywords: string[],
  websiteInfo?: WebsiteAnalysis,
  apiKey?: string
): Promise<TitleCandidate[]> {
  const websiteContext = websiteInfo 
    ? `\n\n参考情報：このコラムは以下のウェブサイト向けです：\n- サイト名: ${websiteInfo.title || '不明'}\n- 説明: ${websiteInfo.description || '不明'}\n- 特徴: ${websiteInfo.features?.join(', ') || '不明'}\n- 強み: ${websiteInfo.strengths?.join(', ') || '不明'}`
    : '';

  const prompt = `打ち込まれたキーワード（${keywords.length}個）を反映して、SEO的に有利なコラムタイトルを5つ生成してください。

キーワード: ${keywords.join('、')}${websiteContext}`;

  try {
    const response = await generateWithGenSparkAI(prompt, keywords);
    
    let jsonText = response.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const titles = JSON.parse(jsonText);
    
    if (!Array.isArray(titles) || titles.length === 0) {
      throw new Error('有効なタイトル候補が生成されませんでした');
    }
    
    return titles;
  } catch (error) {
    console.error('Title generation error:', error);
    throw new Error('タイトル候補の生成に失敗しました。もう一度お試しください。');
  }
}

// コラムを生成
export async function generateColumn(
  keywords: string[],
  selectedTitle: string,
  websiteInfo?: WebsiteAnalysis,
  apiKey?: string
): Promise<ColumnStructure> {
  const websiteContext = websiteInfo 
    ? `\n\n【重要】事前に解析したURLの情報：\n- URL: ${websiteInfo.url || ''}\n- サイト名: ${websiteInfo.title || '不明'}\n- 説明: ${websiteInfo.description || '不明'}\n- 主要コンテンツ: ${websiteInfo.mainContent || '不明'}\n- 特徴: ${websiteInfo.features?.join(', ') || '不明'}\n- 強み: ${websiteInfo.strengths?.join(', ') || '不明'}\n\n内容の各所に、上記URLの強みや特色を入れ込み、コラムでありつつそのURLの企業のPR内容にもなるように作成してください。`
    : '';

  const prompt = `選択されたタイトルを基に3000文字程度のSEO的に有利な文章を生成してください。

キーワード: ${keywords.join('、')}
タイトル: ${selectedTitle}${websiteContext}

文章構成は以下の通りです：
- タイトル: ${selectedTitle}
- 導入文（350-400文字）
- 見出し＋内容（各5つ、各見出しに600-800文字の充実した内容）
- クロージングタイトル
- その内容（350-400文字）
- Q&A 4つ程度（各質問に200-250文字の詳細な回答）

【重要な要件】
1. 見出しに関してはタイトルに即したものにして、その内容は充実したものにしてください
2. 引用する場合は引用元のURLを記載し、正確性と専門性を担保してください
3. 合計文字数: 3000文字以上`;

  try {
    const response = await generateWithGenSparkAI(prompt, keywords);
    
    let jsonText = response.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const column = JSON.parse(jsonText);
    
    const missingFields = [];
    if (!column.title) missingFields.push('title');
    if (!column.introduction) missingFields.push('introduction');
    if (!column.sections) missingFields.push('sections');
    if (!column.closing) missingFields.push('closing');
    if (!column.qa) missingFields.push('qa');
    
    if (missingFields.length > 0) {
      throw new Error(`コラムの構造が不正です - 欠けているフィールド: ${missingFields.join(', ')}`);
    }
    
    return column;
  } catch (error) {
    console.error('Column generation error:', error);
    throw error instanceof Error ? error : new Error('コラムの生成に失敗しました。もう一度お試しください。');
  }
}

// ウェブサイトを解析
export async function analyzeWebsite(
  url: string,
  html?: string,
  apiKey?: string
): Promise<WebsiteAnalysis> {
  const prompt = `以下のウェブサイトを解析してください。

URL: ${url}

解析項目:
- サイトのタイトル
- 説明文
- 主要なキーワード
- メインコンテンツ
- サイトの特徴
- 強み`;

  try {
    const response = await generateWithGenSparkAI(prompt);
    
    let jsonText = response.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const analysis = JSON.parse(jsonText);
    
    return analysis;
  } catch (error) {
    console.error('Website analysis error:', error);
    throw new Error('ウェブサイトの解析に失敗しました。もう一度お試しください。');
  }
}
