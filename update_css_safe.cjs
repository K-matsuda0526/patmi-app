const fs = require('fs');
let compCss = fs.readFileSync('src/components.css', 'utf-8');

const statuses = ['hq', 'miyake', 'tsuboi', 'osaka', 'fukuoka', 'yokohama', 'onsite', 'biztrip', 'holiday', 'offline', 'away'];

let btnCss = statuses.map(s => `.status-btn.active.status-${s} { border: 2px solid var(--status-${s}); color: var(--status-${s}); background-color: rgba(0, 0, 0, 0.03); }`).join('\n');
let dotCss = statuses.map(s => `.status-dot.status-${s} { background-color: var(--status-${s}); }`).join('\n');
let badgeCss = statuses.map(s => `.status-badge.status-${s} { background-color: var(--status-${s}); }`).join('\n');

// Replace the specific old blocks safely
// Old office block
compCss = compCss.replace(/\.status-btn\.active\.status-office \{[\s\S]*?\.status-btn\.active\.status-holiday \{[^\}]*\}/, btnCss);
if (compCss.indexOf('.status-btn.active.status-office') !== -1) {
    compCss = compCss.replace(/\.status-btn\.active\.status-office[^\}]*\}[ \t\n\r]*(?:\.status-btn\.active\.[a-z-A-Z0-9]+[^\}]*\}[ \t\n\r]*)*/, btnCss + '\n');
}

if (compCss.indexOf('.status-dot.status-office') !== -1) {
    compCss = compCss.replace(/\.status-dot\.status-office[^\}]*\}[ \t\n\r]*(?:\.status-dot\.[a-z-A-Z0-9]+[^\}]*\}[ \t\n\r]*)*/, dotCss + '\n');
}

if (compCss.indexOf('.status-badge.status-office') !== -1) {
    compCss = compCss.replace(/\.status-badge\.status-office[^\}]*\}[ \t\n\r]*(?:\.status-badge\.[a-z-A-Z0-9]+[^\}]*\}[ \t\n\r]*)*/, badgeCss + '\n');
}

fs.writeFileSync('src/components.css', compCss);
console.log('done');
