import { Hono } from 'hono';
import type { Bindings } from '../types';

const trainingColumn = new Hono<{ Bindings: Bindings }>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タイトル候補を生成（Genspark使用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
trainingColumn.post('/generate-titles', async (c) => {
  try {
    const { keywords } = await c.req.json();

    if (!keywords || keywords.length < 1) {
      return c.json({ error: 'キーワードを最低1つ入力してください' }, 400);
    }

    // Genspark AIでタイトル生成
    const titles = await generateTitlesWithGenspark(keywords);

    return c.json({ titles });
  } catch (error) {
    console.error('Title generation error:', error);
    return c.json({ error: 'タイトルの生成に失敗しました' }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラムを生成（Genspark使用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
trainingColumn.post('/generate-column', async (c) => {
  try {
    const { keywords, title } = await c.req.json();

    if (!keywords || keywords.length < 1) {
      return c.json({ error: 'キーワードを入力してください' }, 400);
    }

    if (!title) {
      return c.json({ error: 'タイトルを選択してください' }, 400);
    }

    // Genspark AIでコラム生成
    const column = await generateColumnWithGenspark(keywords, title);

    return c.json({ column });
  } catch (error) {
    console.error('Column generation error:', error);
    return c.json({ error: 'コラムの生成に失敗しました' }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 添削データを保存
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
trainingColumn.post('/save-correction', async (c) => {
  try {
    const { sectionId, originalText, correctedText, sectionType } = await c.req.json();

    // D1データベースに保存（OpenAI Fine-tuning用）
    await c.env.DB.prepare(`
      INSERT INTO training_corrections (
        section_id, 
        section_type, 
        original_text, 
        corrected_text, 
        created_at
      )
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(sectionId, sectionType, originalText, correctedText).run();

    return c.json({ 
      success: true,
      message: '添削データを保存しました'
    });
  } catch (error) {
    console.error('Save correction error:', error);
    return c.json({ error: '添削データの保存に失敗しました' }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Genspark AIでタイトル生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateTitlesWithGenspark(keywords: string[]) {
  // プロトタイプ版：デモデータを返す
  // 本番環境では実際のGenspark/OpenAI APIを呼び出す
  const keyword1 = keywords[0] || 'サービス';
  const keyword2 = keywords[1] || '導入';
  
  return [
    { 
      id: '1', 
      title: `【完全ガイド】${keyword1}の選び方と${keyword2}のポイント`, 
      description: `${keyword1}と${keyword2}の基礎から実践まで網羅的に解説` 
    },
    { 
      id: '2', 
      title: `${keyword1}で失敗しない！${keyword2}前に知っておくべき5つのこと`, 
      description: '失敗事例から学ぶ実践的なアドバイス' 
    },
    { 
      id: '3', 
      title: `プロが教える${keyword1}の極意｜${keyword2}で差をつける方法`, 
      description: '業界のプロフェッショナルによる実践的なテクニック' 
    },
    { 
      id: '4', 
      title: `${keyword1}の費用相場と${keyword2}までの流れを徹底解説`, 
      description: '具体的な価格情報と導入プロセスの詳細ガイド' 
    },
    { 
      id: '5', 
      title: `【2024年最新】${keyword1}のトレンドと${keyword2}の成功事例`, 
      description: '最新のトレンドと実際の成功事例を紹介' 
    }
  ];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Genspark AIでコラム生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateColumnWithGenspark(keywords: string[], title: string) {
  // プロトタイプ版：デモデータを返す
  // 本番環境では実際のGenspark/OpenAI APIを呼び出す
  return parseColumnText('', title, keywords);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// コラムテキストを解析
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function parseColumnText(text: string, title: string, keywords: string[]) {
  // デモ用のサンプルデータ（実際はGenspark APIの応答を解析）
  return {
    title,
    introduction: `${keywords[0]}について、多くの方が疑問や不安を抱えています。本記事では、${keywords[0]}の基礎知識から実践的なアドバイスまで、プロの視点で詳しく解説します。この記事を読めば、${keywords[0]}に関する理解が深まり、最適な選択ができるようになります。`,
    sections: [
      {
        id: 'section1',
        heading: `${keywords[0]}とは？基礎知識を解説`,
        content: `${keywords[0]}は、日本の伝統的な文化として長年親しまれてきました。最近では、その機能性や美しさが再評価され、モダンな住空間にも取り入れられています。${keywords[0]}の特徴として、調湿効果や断熱性、そして独特の香りが挙げられます。これらの特性により、快適な室内環境を作り出すことができます。また、${keywords[0]}は自然素材で作られているため、環境にも優しく、健康的な住まいづくりに貢献します。`
      },
      {
        id: 'section2',
        heading: `${keywords[0]}を選ぶ際の重要なポイント`,
        content: `${keywords[0]}を選ぶ際には、いくつかの重要なポイントがあります。まず、素材の品質を確認することが大切です。国産の素材を使用しているか、職人の技術力はどうかなど、細かくチェックしましょう。次に、部屋の用途や使用頻度を考慮して、適切なグレードを選ぶことが重要です。例えば、リビングなど使用頻度の高い場所には、耐久性の高いものを選ぶことをおすすめします。また、予算とのバランスも考慮しながら、長期的な視点で選択することが賢明です。`
      },
      {
        id: 'section3',
        heading: `${keywords[0]}のメンテナンス方法`,
        content: `${keywords[0]}を長持ちさせるためには、適切なメンテナンスが欠かせません。日常的なお手入れとしては、掃除機でのこまめな清掃が基本です。また、定期的に乾拭きをすることで、汚れの蓄積を防ぐことができます。湿気対策も重要で、梅雨時期などは除湿器を使用したり、換気を心がけたりすることが大切です。さらに、数年に一度は専門業者によるメンテナンスを受けることで、美しい状態を保つことができます。適切なケアにより、${keywords[0]}の寿命は大きく延びます。`
      },
      {
        id: 'section4',
        heading: `${keywords[0]}で快適な空間を作るコツ`,
        content: `${keywords[0]}を使った空間づくりには、いくつかのコツがあります。まず、インテリアとの調和を考えることが大切です。和モダンなスタイルであれば、シンプルな家具と組み合わせることで、洗練された雰囲気を演出できます。また、照明の選び方も重要で、温かみのある間接照明を使用すると、${keywords[0]}の持つ自然な風合いが引き立ちます。さらに、観葉植物を配置することで、より落ち着いた癒しの空間を作ることができます。これらの工夫により、${keywords[0]}の魅力を最大限に活かした素敵な空間が完成します。`
      }
    ],
    closing: {
      id: 'closing',
      heading: `まとめ：${keywords[0]}で理想の空間を実現`,
      content: `本記事では、${keywords[0]}について、基礎知識から選び方、メンテナンス方法、空間づくりのコツまで幅広く解説しました。${keywords[0]}は、適切に選び、丁寧にケアすることで、長年にわたって快適な空間を提供してくれます。ぜひこの記事を参考に、理想の空間づくりに挑戦してみてください。`
    },
    qa: [
      {
        id: 'qa1',
        question: `${keywords[0]}の寿命はどのくらいですか？`,
        answer: `適切にメンテナンスすれば、${keywords[0]}の寿命は10-15年程度です。ただし、使用環境や頻度によって異なります。定期的なお手入れと、必要に応じた張替えを行うことで、長く使い続けることができます。`
      },
      {
        id: 'qa2',
        question: `${keywords[0]}の費用はどのくらいかかりますか？`,
        answer: `${keywords[0]}の費用は、素材やグレードによって大きく異なります。一般的な目安として、1畳あたり1万円から3万円程度が相場です。高品質な素材を使用する場合は、さらに高額になることもあります。見積もりを複数取ることをおすすめします。`
      },
      {
        id: 'qa3',
        question: `${keywords[0]}のお手入れは難しいですか？`,
        answer: `${keywords[0]}のお手入れは、基本的には難しくありません。日常的には掃除機をかけ、定期的に乾拭きするだけで十分です。ただし、湿気対策や日焼け防止など、少し注意が必要なポイントもあります。専門業者に相談すると安心です。`
      }
    ]
  };
}

export default trainingColumn;
