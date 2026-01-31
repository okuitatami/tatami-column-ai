// テスト用JSONレスポンス
const testResponse = '```json\n{\n  "title": "テスト",\n  "introduction": "これはテストです"\n}\n```';

console.log('Original response:');
console.log(testResponse);
console.log('\n--- Processing ---\n');

let jsonText = testResponse.trim();

// コードブロック記号を削除
jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
jsonText = jsonText.replace(/^`+\s*json\s*/i, '').replace(/^`+\s*/, '').replace(/\s*`+$/, '');

console.log('After removing code blocks:');
console.log(jsonText);
console.log('\n--- Extracting JSON object ---\n');

// JSONオブジェクトのみを抽出
const firstBrace = jsonText.indexOf('{');
const lastBrace = jsonText.lastIndexOf('}');
if (firstBrace !== -1 && lastBrace !== -1) {
  jsonText = jsonText.substring(firstBrace, lastBrace + 1);
}

console.log('Final JSON:');
console.log(jsonText);
console.log('\n--- Parsing ---\n');

try {
  const result = JSON.parse(jsonText);
  console.log('Success!', result);
} catch (e) {
  console.error('Failed:', e.message);
}
