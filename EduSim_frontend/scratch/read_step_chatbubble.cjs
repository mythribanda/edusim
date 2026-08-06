const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Mythri Banda\\.gemini\\antigravity\\brain\\d0bf3dad-c4b8-4f68-a5f4-6dc6b7fa6393\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 883) {
      let code = obj.tool_calls[0].args.CodeContent;
      if (code.startsWith('"')) {
        code = JSON.parse(code);
      }
      fs.writeFileSync(path.join(__dirname, 'step_883_code_parsed.tsx'), code, 'utf8');
      console.log('Wrote step_883_code_parsed.tsx');
    }
  } catch (e) {
    console.error(e);
  }
});
