const fs = require('fs');
let content = fs.readFileSync('src/components/TeamCalendar.tsx', 'utf-8');

content = content.replace(/gridTemplateColumns: '150px repeat\(7, 1fr\)'/g, "gridTemplateColumns: '150px repeat(7, minmax(0, 1fr))'");
content = content.replace(/gridTemplateColumns: 'repeat\(7, 1fr\)'/g, "gridTemplateColumns: 'repeat(7, minmax(0, 1fr))'");

fs.writeFileSync('src/components/TeamCalendar.tsx', content);
console.log('TeamCalendar updated');
