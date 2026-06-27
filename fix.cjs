const fs = require('fs');
let raw = fs.readFileSync('src/components/TeamCalendar.tsx', 'utf8');
raw = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"');
fs.writeFileSync('src/components/TeamCalendar.tsx', raw);
console.log('Fixed');
