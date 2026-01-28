// Gemini APIクライアントの単体テスト (ES Module)

// 環境変数から取得
const GEMINI_API_KEY = 'AIzaSyAIV1y6LQ_zCYnCbmfeD3gH59BkU3sVJtY';

// 畳業界知識
const TATAMI_KNOWLEDGE = `
# 畳業界の専門知識

## 重要な用語の統一
- 化学表 → 紙素材・ポリプロピレン素材
- 琉球畳 → 琉球風畳
- 畳縁 → 畳縁（たたみべり）

## 価格について
- 価格は各店舗によって大きく異なります
- 高い傾向があります
- 畳表・畳床の品質によって価格と寿命が大きく変わります

## 工法と価格相場（参考価格）
### 新調工事
- 内容：畳床・畳表・畳縁をすべて新品に交換
- 価格相場：15,000円〜25,000円/畳
- 推奨時期：15年〜20年経過後

### 表替え
- 内容：畳表と畳縁を新品に交換（畳床はそのまま）
- 価格相場：8,000円〜15,000円/畳
- 推奨時期：7年〜10年経過後

### 裏返し
- 内容：畳表を裏返して再利用
- 価格相場：5,000円〜8,000円/畳
- 推奨時期：3年〜5年経過後
`;

async function testGeminiAPI() {
  console.log('🧪 Gemini APIテスト開始...\n');

  try {
    // タイトル生成テスト
    console.log('📝 テスト1: タイトル生成');
    console.log('キーワード: 畳, リフォーム');
    console.log('地域: 神戸市\n');

    const prompt = `
あなたは奥井畳店のSEOコラムタイトル作成の専門家です。

【会社情報】
- 会社名: 奥井畳店
- 事業内容: 神戸市を中心に畳のリフォーム・張替えを行う創業50年の老舗畳店です。

【キーワード】
畳、リフォーム

【対象地域】
神戸市

【タスク】
上記のキーワードと地域を組み合わせて、SEOに強く、かつ読者の検索意図に合致するコラムタイトルを5個生成してください。

【タイトル作成のルール】
1. キーワードを自然に組み込む
2. 地域名を含める
3. 読者の悩みや問題を解決する内容を示唆
4. 30文字〜40文字程度
5. 数字を活用して具体性を高める

【重要な注意点】
- 「化学表」ではなく「紙素材」「ポリプロピレン素材」を使用
- 「琉球畳」ではなく「琉球風畳」を使用
- 価格について言及する場合は「各店舗によって異なる」ことを示唆

【出力形式】
タイトルのみを1行ずつ出力してください。番号や説明は不要です。
    `.trim();

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: TATAMI_KNOWLEDGE }]
      },
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('📡 Gemini APIを呼び出し中...');
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️  レスポンス時間: ${elapsedTime}ms\n`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('✅ タイトル生成成功!\n');
    console.log('生成されたタイトル:');
    console.log('─────────────────────────────────');
    console.log(generatedText);
    console.log('─────────────────────────────────\n');

    // タイトルを抽出
    const titles = generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[\d\.\-\*]+/));

    console.log(`📊 抽出されたタイトル数: ${titles.length}\n`);

    // 成功メッセージ
    console.log('🎉 Gemini APIテスト完了!');
    console.log('✅ すべてのテストが正常に動作しました\n');

    return {
      success: true,
      titles: titles,
      responseTime: elapsedTime
    };

  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    console.error('\nスタックトレース:');
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// テスト実行
testGeminiAPI().then(result => {
  if (result.success) {
    console.log('✅ テスト成功');
    process.exit(0);
  } else {
    console.log('❌ テスト失敗');
    process.exit(1);
  }
});
