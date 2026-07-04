const fs = require('fs');
let content = fs.readFileSync('src/components/TeamCalendar.tsx', 'utf-8');

if (!content.includes('STATUS_LABELS')) {
  content = content.replace("export default function TeamCalendar({ currentUser }: { currentUser: any }) {", `
export const STATUS_LABELS: Record<string, string> = {
  hq: '本社',
  miyake: '三宅工場',
  tsuboi: '坪井工場',
  osaka: '大阪営業所',
  fukuoka: '福岡営業所',
  yokohama: '横浜営業所',
  onsite: '現場',
  biztrip: '出張',
  holiday: '休暇'
};

export default function TeamCalendar({ currentUser }: { currentUser: any }) {`);
}

content = content.replace("color: 'blue', date: todayFormatted", "color: 'blue', status: 'hq', date: todayFormatted");
content = content.replace("color: schedule.color || 'blue',", "color: schedule.color || 'blue',\n          status: schedule.status || 'hq',");
content = content.replace("color: 'blue', date: defaultDate || todayFormatted", "color: 'blue', status: 'hq', date: defaultDate || todayFormatted");

const statusChips = `
                <div className="input-group-vertical">
                  <label>ステータス</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <button 
                        key={key}
                        className={\`status-btn \${modalData.status === key ? 'active status-' + key : ''}\`}
                        onClick={(e) => { e.preventDefault(); setModalData({...modalData, status: key}); }}
                        style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '16px', border: modalData.status === key ? '' : '1px solid var(--border-color)', background: modalData.status === key ? '' : 'var(--bg-panel)', color: modalData.status === key ? '' : 'var(--text-main)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
`;
content = content.replace('<div className="input-group-vertical">\n                    <label>期間・終日</label>', statusChips + '<div className="input-group-vertical">\n                    <label>期間・終日</label>');

content = content.replace(/{schedule.title}/g, "{schedule.status ? `[${STATUS_LABELS[schedule.status] || schedule.status}] ` : ''}{schedule.title}");
content = content.replace(/<span className=\{`status-dot status-\$\{schedule\.member\.status \|\| 'office'\}`\}.*?><\/span>/g, "");
content = content.replace(/<span className=\{`status-dot status-\$\{member\.status \|\| 'office'\}`\}.*?><\/span>/g, "");

fs.writeFileSync('src/components/TeamCalendar.tsx', content);
console.log('done');
