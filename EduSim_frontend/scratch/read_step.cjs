const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Mythri Banda\\.gemini\\antigravity\\brain\\d0bf3dad-c4b8-4f68-a5f4-6dc6b7fa6393\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

const results = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    const jsonStr = JSON.stringify(obj);
    if (jsonStr.includes('ChatBubble.tsx') && (jsonStr.includes('write_to_file') || jsonStr.includes('replace_file_content') || jsonStr.includes('multi_replace_file_content'))) {
      results.push(obj);
    }
  } catch (e) {
    // ignore
  }
});

fs.writeFileSync(path.join(__dirname, 'step_chatbubble.json'), JSON.stringify(results, null, 2), 'utf8');
console.log(`Wrote ${results.length} steps to step_chatbubble.json`);
