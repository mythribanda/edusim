const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Mythri Banda\\.gemini\\antigravity\\brain\\d0bf3dad-c4b8-4f68-a5f4-6dc6b7fa6393\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

const stepIndices = [798, 806];

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (stepIndices.includes(obj.step_index)) {
      console.log(`=== STEP ${obj.step_index} ===`);
      console.log(JSON.stringify(obj.tool_calls, null, 2));
    }
  } catch (e) {
    // ignore
  }
});
