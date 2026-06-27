/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { CalendarDays, Briefcase, Building2, Coffee, Video, Power, ExternalLink, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DashboardProps {
  currentUser: any;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Load initial status from user profile if exists, default to 'office'
  const [currentStatus, setCurrentStatus] = useState<'office' | 'biztrip' | 'out' | 'meeting' | 'away' | 'offline'>(currentUser?.status || 'office');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  
  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateString(currentTime);

  const todaysSchedules = (currentUser?.schedules || [])
    .filter((s: any) => s.date === todayStr)
    .sort((a: any, b: any) => a.start - b.start);

  const numToTime = (num: number) => {
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Update Firestore when status changes
  const handleStatusChange = async (newStatus: 'office' | 'biztrip' | 'out' | 'meeting' | 'away' | 'offline') => {
    setCurrentStatus(newStatus);
    const uid = currentUser?.uid || currentUser?.id;
    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid), {
          status: newStatus,
          lastStatusUpdate: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  const hour = currentTime.getHours();
  let greeting = 'こんにちは';
  if (hour >= 4 && hour < 11) {
    greeting = 'おはようございます';
  } else if (hour >= 18 || hour < 4) {
    greeting = 'こんばんは';
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-greeting">{greeting}、{currentUser?.name || 'ゲスト'}さん</h2>
        <p className="dashboard-date">本日は {dateString} です。</p>
      </header>

      <div className="dashboard-grid">
        
        {/* Status Hub Widget */}
        <div className="dashboard-card glass-panel status-hub-widget" style={{ gridColumn: 'span 2' }}>
          <div className="status-hub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>現在のステータスを更新</h3>
            <div className="timecard-clock" style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{timeString}</div>
          </div>
          
          <div className="status-toggles">
            <button className={`status-btn ${currentStatus === 'office' ? 'active status-office' : ''}`} onClick={() => handleStatusChange('office')}>
              <Building2 size={24} />
              <span>社内</span>
            </button>
            <button className={`status-btn ${currentStatus === 'biztrip' ? 'active status-biztrip' : ''}`} onClick={() => handleStatusChange('biztrip')}>
              <Briefcase size={24} />
              <span>出張中</span>
            </button>
            <button className={`status-btn ${currentStatus === 'out' ? 'active status-out' : ''}`} onClick={() => handleStatusChange('out')}>
              <MapPin size={24} />
              <span>外出中</span>
            </button>
            <button className={`status-btn ${currentStatus === 'meeting' ? 'active status-meeting' : ''}`} onClick={() => handleStatusChange('meeting')}>
              <Video size={24} />
              <span>ミーティング中</span>
            </button>
            <button className={`status-btn ${currentStatus === 'away' ? 'active status-away' : ''}`} onClick={() => handleStatusChange('away')}>
              <Coffee size={24} />
              <span>休憩・離席中</span>
            </button>
            <button className={`status-btn ${currentStatus === 'offline' ? 'active status-offline' : ''}`} onClick={() => handleStatusChange('offline')}>
              <Power size={24} />
              <span>退勤済 (オフ)</span>
            </button>
          </div>
        </div>

        {/* Today's Personal Schedule */}
        <div className="dashboard-card glass-panel">
          <div className="card-header">
            <CalendarDays size={18} />
            <h3>本日のあなたの予定</h3>
          </div>
          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todaysSchedules.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '12px 0' }}>本日の予定はありません</div>
            ) : (
              todaysSchedules.map((schedule: any) => (
                <div key={schedule.id} className="schedule-item" style={{ padding: '12px', backgroundColor: schedule.color?.startsWith('#') ? schedule.color : `var(--accent-${schedule.color || 'blue'})` }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{numToTime(schedule.start)} - {numToTime(schedule.end)}</div>
                  <div style={{ fontSize: '15px' }}>{schedule.title}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* External Applications Links */}
        <div className="dashboard-card glass-panel">
          <div className="card-header">
            <ExternalLink size={18} />
            <h3>各種申請・外部システム</h3>
          </div>
          <div className="external-links-list">
            <a href="#" className="external-link-item" onClick={e => e.preventDefault()}>
              <div className="external-icon bg-green">休</div>
              <div>
                <h4>有給・休暇申請</h4>
                <p>勤怠管理システムへ移動 (開発予定)</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
