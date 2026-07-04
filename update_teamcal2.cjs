const fs = require('fs');
let content = fs.readFileSync('src/components/TeamCalendar.tsx', 'utf-8');

content = content.replace(/{schedule\.title}/g, "{schedule.status ? `[${STATUS_LABELS[schedule.status] || schedule.status}] ` : ''}{schedule.title}");
content = content.replace(/<span className={`status-dot status-\$\{schedule\.member\.status \|\| 'office'\}`}.*?><\/span>/g, "");
content = content.replace(/<span className={`status-dot status-\$\{member\.status \|\| 'office'\}`}.*?><\/span>/g, "");

fs.writeFileSync('src/components/TeamCalendar.tsx', content);
console.log('done');
