const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf-8');

const newVariables = `  --status-office: #3b82f6;
  --status-hq: #3b82f6;
  --status-miyake: #10b981;
  --status-tsuboi: #8b5cf6;
  --status-osaka: #ef4444;
  --status-fukuoka: #f59e0b;
  --status-yokohama: #6b7280;
  --status-onsite: #ec4899;
  --status-biztrip: #10b981;
  --status-out: #8b5cf6;
  --status-meeting: #ef4444;
  --status-away: #f59e0b;
  --status-offline: #6b7280;
  --status-holiday: #ec4899;`;

const newVariablesDark = `  --status-office: #936639; /* Primary */
  --status-hq: #936639;
  --status-miyake: #7D904B;
  --status-tsuboi: #C68642;
  --status-osaka: #b05c5a;
  --status-fukuoka: #d4a373;
  --status-yokohama: #707670;
  --status-onsite: #c57b85;
  --status-biztrip: #7D904B; /* Secondary */
  --status-out: #C68642; /* Tertiary */
  --status-meeting: #b05c5a;
  --status-away: #d4a373;
  --status-offline: #707670; /* Neutral */
  --status-holiday: #c57b85; /* Muted pink */`;

// Replace in Default theme
content = content.replace(/--status-office: #3b82f6;[\s\S]*?--status-holiday: #ec4899;/, newVariables);
// Replace in Dark theme (if any)
content = content.replace(/--status-office: #3b82f6;[\s\S]*?--status-holiday: #ec4899;/, newVariables);
// Replace in custom theme Adult Cute Dark
content = content.replace(/--status-office: #936639;[\s\S]*?--status-holiday: #c57b85; \/\* Muted pink \*\//, newVariablesDark);

fs.writeFileSync('src/index.css', content);
console.log('index.css updated');
