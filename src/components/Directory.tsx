/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { Mail, MessageSquare, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Helper to get initials
const getInitials = (name: string) => {
  return name.charAt(0);
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    office: '社内',
    biztrip: '出張',
    out: '外出',
    meeting: '会議',
    away: '離席',
    offline: '退勤'
  };
  return map[status] || status;
};

export default function Directory() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        emails: doc.data().emails || []
      }));
      setMembers(usersData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="directory-container">
      <div className="directory-header-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>メンバーディレクトリ</h2>
          <div className="search-bar">
            <input type="text" placeholder="名前や営業所で検索..." className="search-input" />
          </div>
        </div>
        <div className="status-legend" style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-office"></span>社内</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-biztrip"></span>出張</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-out"></span>外出</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-meeting"></span>会議</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-away"></span>離席</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-offline"></span>退勤</div>
        </div>
      </div>

      <div className="directory-grid">
        {members.map(member => (
          <div key={member.id} className="directory-card glass-panel">
            <div className="dir-card-header">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="dir-avatar" />
              ) : (
                <div className="dir-avatar-placeholder bg-blue">
                  {getInitials(member.name)}
                </div>
              )}
              <div className="dir-info">
                <div className="dir-branch">{member.branch} • {member.title}</div>
                <div className="dir-name">
                  <span className={`status-badge status-${member.status}`}>{getStatusLabel(member.status)}</span>
                  {member.name}
                </div>
              </div>
            </div>
            
            <div className="dir-card-body">
              <div className="contact-item">
                <Phone size={14} /> 携帯: {member.mobile}
              </div>
              <div className="contact-emails">
                {member.emails?.map((email: string, idx: number) => (
                  <div key={idx} className="contact-item">
                    <Mail size={14} /> {email}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="dir-card-actions">
              <button className="dir-btn"><MessageSquare size={14} /> チャット</button>
              <button className="dir-btn"><Mail size={14} /> メール</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
