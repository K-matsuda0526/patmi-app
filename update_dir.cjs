const fs = require('fs');
let content = fs.readFileSync('src/components/Directory.tsx', 'utf-8');

const newGetStatusLabel = `const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    hq: '本社',
    miyake: '三宅工場',
    tsuboi: '坪井工場',
    osaka: '大阪営業所',
    fukuoka: '福岡営業所',
    yokohama: '横浜営業所',
    onsite: '現場',
    biztrip: '出張',
    holiday: '休暇',
    offline: '退勤',
    away: '離席'
  };
  return map[status] || status;
};`;

const oldGetStatusLabel = `const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    office: '社内',
    biztrip: '出張',
    out: '外出',
    meeting: '会議',
    away: '離席',
    offline: '退勤',
    holiday: '休暇'
  };
  return map[status] || status;
};`;

content = content.replace(oldGetStatusLabel, newGetStatusLabel);

const newLegend = `<div className="status-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-hq"></span>本社</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-miyake"></span>三宅工場</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-tsuboi"></span>坪井工場</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-osaka"></span>大阪営業所</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-fukuoka"></span>福岡営業所</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-yokohama"></span>横浜営業所</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-onsite"></span>現場</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-biztrip"></span>出張</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-holiday"></span>休暇</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-away"></span>離席</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-offline"></span>退勤</div>
        </div>`;

content = content.replace(/<div className="status-legend"[\s\S]*?<\/div>/, newLegend);

fs.writeFileSync('src/components/Directory.tsx', content);
console.log('done');
