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

import { STATUS_LABELS } from './TeamCalendar';

const getStatusLabel = (status: string) => {
  return STATUS_LABELS[status] || status;
};

export default function Directory({ onStartChat }: { onStartChat?: (userId: string) => void }) {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const now = Date.now();
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
        const isActuallyOnline = data.isOnline && (now - lastActiveTime < 5 * 60 * 1000);
        return {
          id: doc.id,
          ...data,
          isOnline: isActuallyOnline,
          emails: data.emails || []
        };
      });
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
        <div className="status-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`status-dot status-${key}`}></span>{label}
            </div>
          ))}
        </div>
      </div>

      <div className="directory-grid">
        {members.map(member => (
          <div key={member.id} className="directory-card glass-panel" style={{ opacity: member.isOnline ? 1 : 0.6, transition: 'opacity 0.3s ease' }}>
            <div className="dir-card-header" style={{ position: 'relative' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="dir-avatar" />
                ) : (
                  <div className="dir-avatar-placeholder bg-blue">
                    {getInitials(member.name)}
                  </div>
                )}
                {member.isOnline && (
                  <span className="online-indicator" style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    border: '2px solid var(--glass-border, #fff)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 2
                  }}></span>
                )}
              </div>
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
                  <a key={idx} href={`mailto:${email}`} className="contact-item" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <Mail size={14} /> {email}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="dir-card-actions">
              <button className="dir-btn" onClick={() => onStartChat && onStartChat(member.id)}>
                <MessageSquare size={14} /> チャット
              </button>
              <a href={`mailto:${member.emails?.[0] || ''}`} className="dir-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={14} /> メール
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
