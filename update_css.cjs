const fs = require('fs');

let indexCss = fs.readFileSync('src/index.css', 'utf-8');
const newVars = `
  --status-hq: #3b82f6;
  --status-miyake: #10b981;
  --status-tsuboi: #8b5cf6;
  --status-osaka: #ef4444;
  --status-fukuoka: #f59e0b;
  --status-yokohama: #0ea5e9;
  --status-onsite: #84cc16;
  --status-biztrip: #14b8a6;
  --status-holiday: #ec4899;
  --status-offline: #6b7280;
  --status-away: #d97706;`;

indexCss = indexCss.replace(/--status-office: #3b82f6;[\s\S]*?--status-holiday: #ec4899;/g, newVars.trim());
indexCss = indexCss.replace(/--status-office: #936639;[\s\S]*?--status-holiday: #c57b85; \/\* Muted pink \*\//g, `
  --status-hq: #936639;
  --status-miyake: #7D904B;
  --status-tsuboi: #C68642;
  --status-osaka: #b05c5a;
  --status-fukuoka: #d4a373;
  --status-yokohama: #7c98ab;
  --status-onsite: #8ca373;
  --status-biztrip: #4a7c59;
  --status-holiday: #c57b85;
  --status-offline: #707670;
  --status-away: #c8963e;`.trim());

fs.writeFileSync('src/index.css', indexCss);

let compCss = fs.readFileSync('src/components.css', 'utf-8');
const statuses = ['hq', 'miyake', 'tsuboi', 'osaka', 'fukuoka', 'yokohama', 'onsite', 'biztrip', 'holiday', 'offline', 'away'];

let btnCss = statuses.map(s => `.status-btn.active.status-${s} { border: 2px solid var(--status-${s}); color: var(--status-${s}); background-color: rgba(0, 0, 0, 0.03); }`).join('\n');
compCss = compCss.replace(/\.status-btn\.active\.status-office[\s\S]*?\.status-btn\.active\.status-holiday.*?}/, btnCss);

let dotCss = statuses.map(s => `.status-dot.status-${s} { background-color: var(--status-${s}); }`).join('\n');
compCss = compCss.replace(/\.status-dot\.status-office[\s\S]*?\.status-dot\.status-holiday.*?}/, dotCss);

let badgeCss = statuses.map(s => `.status-badge.status-${s} { background-color: var(--status-${s}); }`).join('\n');
compCss = compCss.replace(/\.status-badge\.status-office[\s\S]*?\.status-badge\.status-holiday.*?}/, badgeCss);

fs.writeFileSync('src/components.css', compCss);
console.log('done');
