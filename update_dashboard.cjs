const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const typeStr = "type StatusType = 'hq' | 'miyake' | 'tsuboi' | 'osaka' | 'fukuoka' | 'yokohama' | 'onsite' | 'biztrip' | 'holiday' | 'away' | 'offline';";
content = content.replace("export default function Dashboard({ currentUser }: DashboardProps) {", typeStr + "\n\nexport default function Dashboard({ currentUser }: DashboardProps) {");

content = content.replace(/useState<'office' \| 'biztrip' \| 'out' \| 'meeting' \| 'away' \| 'offline' \| 'holiday'>\(currentUser\?\.status \|\| 'office'\)/g, "useState<StatusType>((currentUser?.status as StatusType) || 'hq')");

content = content.replace(/handleStatusChange = async \(newStatus: 'office' \| 'biztrip' \| 'out' \| 'meeting' \| 'away' \| 'offline' \| 'holiday'\)/g, "handleStatusChange = async (newStatus: StatusType)");

const togglesStr = `            <div className="status-toggles">
              <button className={\`status-btn \${currentStatus === 'hq' ? 'active status-hq' : ''}\`} onClick={() => handleStatusChange('hq')}>
                <Building2 size={24} />
                <span>本社</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'miyake' ? 'active status-miyake' : ''}\`} onClick={() => handleStatusChange('miyake')}>
                <Building2 size={24} />
                <span>三宅工場</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'tsuboi' ? 'active status-tsuboi' : ''}\`} onClick={() => handleStatusChange('tsuboi')}>
                <Building2 size={24} />
                <span>坪井工場</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'osaka' ? 'active status-osaka' : ''}\`} onClick={() => handleStatusChange('osaka')}>
                <MapPin size={24} />
                <span>大阪営業所</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'fukuoka' ? 'active status-fukuoka' : ''}\`} onClick={() => handleStatusChange('fukuoka')}>
                <MapPin size={24} />
                <span>福岡営業所</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'yokohama' ? 'active status-yokohama' : ''}\`} onClick={() => handleStatusChange('yokohama')}>
                <MapPin size={24} />
                <span>横浜営業所</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'onsite' ? 'active status-onsite' : ''}\`} onClick={() => handleStatusChange('onsite')}>
                <Briefcase size={24} />
                <span>現場</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'biztrip' ? 'active status-biztrip' : ''}\`} onClick={() => handleStatusChange('biztrip')}>
                <Briefcase size={24} />
                <span>出張</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'holiday' ? 'active status-holiday' : ''}\`} onClick={() => handleStatusChange('holiday')}>
                <Palmtree size={24} />
                <span>休暇</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'away' ? 'active status-away' : ''}\`} onClick={() => handleStatusChange('away')}>
                <Coffee size={24} />
                <span>離席</span>
              </button>
              <button className={\`status-btn \${currentStatus === 'offline' ? 'active status-offline' : ''}\`} onClick={() => handleStatusChange('offline')}>
                <Power size={24} />
                <span>退勤</span>
              </button>
            </div>`;

content = content.replace(/<div className="status-toggles">[\s\S]*?<\/div>\s*<\/div>/, togglesStr + "\n          </div>");
fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('done');
