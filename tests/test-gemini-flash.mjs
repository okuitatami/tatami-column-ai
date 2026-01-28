const GEMINI_API_KEY = 'AIzaSyAIV1y6LQ_zCYnCbmfeD3gH59BkU3sVJtY';

const TATAMI_KNOWLEDGE = `# 畳業界の専門知識
- 化学表 → 紙素材・ポリプロピレン素材
- 琉球畳 → 琉球風畳
- 価格は各店舗によって大きく異なり、高い傾向があります`;

async function test() {
  console.log('🧪 Gemini API (2.5-flash) テスト\n');
  try {
    const prompt = `奥井畳店（神戸市の畳店）のSEOコラムタイトルを5個生成。
キーワード: 畳、リフォーム
地域: 神戸市
条件: 30-40文字、地域名含む、琉球風畳を使用
タイトルのみ出力`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: TATAMI_KNOWLEDGE }] },
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('📡 呼び出し中...');
    const t = Date.now();
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log(`⏱️  ${Date.now() - t}ms\n`);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error('No response');

    console.log('✅ 成功!\n生成結果:\n─────────────────────────────────');
    console.log(text);
    console.log('─────────────────────────────────\n');

    const titles = text.split('\n').filter(l => l.trim());
    console.log(`📊 ${titles.length}件\n🎉 完了!\n`);
    return { success: true };
  } catch (error) {
    console.error('❌', error.message);
    return { success: false };
  }
}

test().then(r => process.exit(r.success ? 0 : 1));
