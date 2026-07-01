/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isHoliday } from '../lib/holidays';

const branches = ['全体', '本社', '三宅工場', '坪井工場', '大阪営業所', '福岡営業所', '横浜営業所'];

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    office: '出社',
    biztrip: '出張',
    out: '外出',
    meeting: '会議',
    away: '離席',
    offline: '退勤',
    holiday: '休暇'
  };
  return map[status] || status;
};

const timeToNum = (timeStr: string) => {
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr || !timeStr.includes(':')) return 9;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m / 60);
};

const numToTime = (num: number) => {
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getDayOfWeek = (date: Date) => {
  return ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
};

export default function TeamCalendar({ currentUser }: { currentUser: any }) {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('全体');
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>(() => {
    return (localStorage.getItem('preferredCalendarView') as any) || 'day';
  });

  useEffect(() => {
    localStorage.setItem('preferredCalendarView', calendarView);
  }, [calendarView]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | string | null>(null);
  
  const todayFormatted = calendarDate.toISOString().split('T')[0];
  const todayDisplay = calendarDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  const [modalData, setModalData] = useState({ title: '', start: '09:00', end: '10:00', color: 'blue', date: todayFormatted });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        schedules: doc.data().schedules || []
      }));
      setMembers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const displayedMembers = selectedBranch === '全体' 
    ? members 
    : members.filter(m => m.branch === selectedBranch);

  const prevDay = () => {
    const newDate = new Date(calendarDate);
    if (calendarView === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCalendarDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(calendarDate);
    if (calendarView === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCalendarDate(newDate);
  };

  const openModal = (schedule?: any, defaultDate?: string) => {
    if (schedule) {
      setEditingScheduleId(schedule.id);
      setModalData({
        title: schedule.title || '',
        start: typeof schedule.start === 'number' ? numToTime(schedule.start) : schedule.start,
        end: typeof schedule.end === 'number' ? numToTime(schedule.end) : schedule.end,
        color: schedule.color || 'blue',
        date: schedule.date || todayFormatted
      });
    } else {
      setEditingScheduleId(null);
      setModalData({ title: '', start: '09:00', end: '10:00', color: 'blue', date: defaultDate || todayFormatted });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    
    const me = members.find(m => m.id === currentUser.uid);
    let mySchedules = me?.schedules ? [...me.schedules] : [];
    
    if (editingScheduleId) {
      mySchedules = mySchedules.map(s => 
        s.id === editingScheduleId ? { ...s, ...modalData } : s
      );
    } else {
      mySchedules.push({
        id: Date.now().toString(),
        ...modalData
      });
    }

    try {
      await setDoc(doc(db, 'users', currentUser.uid), { schedules: mySchedules }, { merge: true });
      closeModal();
    } catch (e) {
      alert('予定の保存に失敗しました。');
    }
  };

  const handleDelete = async () => {
    if (!currentUser?.uid || !editingScheduleId) return;
    if (!confirm('この予定を削除してもよろしいですか？')) return;
    
    const me = members.find(m => m.id === currentUser.uid);
    let mySchedules = me?.schedules ? [...me.schedules] : [];
    
    mySchedules = mySchedules.filter(s => s.id !== editingScheduleId);

    try {
      await setDoc(doc(db, 'users', currentUser.uid), { schedules: mySchedules }, { merge: true });
      closeModal();
    } catch (e) {
      alert('予定の削除に失敗しました。');
    }
  };

  const getWeekDays = (date: Date) => {
    const days = [];
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add prev month days to fill first week
    let startOffset = firstDay.getDay();
    
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    
    // Add month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month days to fill last week
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    
    return days;
  };

  const renderSchedulesDay = (schedules: any[], isMe: boolean, targetDate: string) => {
    const filteredSchedules = schedules.filter(s => s.date === targetDate);
    
    return filteredSchedules.map(schedule => {
      const startNum = timeToNum(schedule.start);
      const endNum = timeToNum(schedule.end);
      
      const leftPercent = Math.max(0, ((startNum - 8) / 10) * 100);
      const widthPercent = Math.min(100 - leftPercent, ((endNum - startNum) / 10) * 100);
      
      return (
        <div 
          key={schedule.id}
          className={`schedule-block bg-${schedule.color}`}
          style={{ 
            left: `${leftPercent}%`, 
            width: `${widthPercent}%`, 
            cursor: isMe ? 'pointer' : 'default',
            position: 'absolute',
            top: '4px',
            bottom: '4px'
          }}
          onClick={(e) => {
            if (isMe) {
              e.stopPropagation();
              openModal(schedule);
            }
          }}
        >
          {schedule.title}
        </div>
      );
    });
  };

  const renderDayView = () => (
    <div className="timeline-grid glass-panel">
      <div className="timeline-header-row">
        <div className="timeline-header-cell">メンバー</div>
        <div className="timeline-time-slots">
          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
            <div key={t} className="time-slot-header">{t}</div>
          ))}
        </div>
      </div>
      {displayedMembers.map(member => {
        const isMe = currentUser && (currentUser.uid === member.id || currentUser.id === member.id);
        const todaysSchedules = (member.schedules || []).filter((s:any) => s.date === todayFormatted);
        
        return (
          <div key={member.id} className={`timeline-row ${isMe ? 'is-current-user' : ''}`}>
            <div className="member-info">
              <div className="member-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`status-badge status-${member.status || 'office'}`} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#fff', backgroundColor: `var(--status-${member.status || 'office'})` }}>{getStatusLabel(member.status || 'office')}</span>
                {member.name || '未設定'} {isMe && <span className="me-badge">自分</span>}
              </div>
              <div className="member-meta">{member.branch || '未設定'} • {member.title || '未設定'}</div>
            </div>
            <div 
              className={`schedule-slots ${isMe ? 'interactive-slot' : 'locked-slot'}`}
              onClick={() => isMe ? openModal(null, todayFormatted) : null}
              title={isMe ? "クリックして予定を追加" : "他人の予定は編集できません"}
            >
              {[...Array(10)].map((_, i) => (
                <div key={i} className="schedule-grid-line"></div>
              ))}
              {renderSchedulesDay(member.schedules || [], isMe, todayFormatted)}
              
              {todaysSchedules.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px', pointerEvents: 'none' }}>
                  予定なし
                </div>
              )}
              {isMe && <div className="add-hover-indicator"><Plus size={14}/>追加</div>}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => {
    const weekDays = getWeekDays(calendarDate);

    return (
      <div className="week-view glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div style={{ padding: '8px', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>メンバー</div>
          {weekDays.map((date, i) => {
            const isHol = isHoliday(date);
            return (
            <div key={i} className={isHol ? 'holiday-cell' : ''} style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', borderRight: i < 6 ? '1px solid var(--border-color)' : 'none', color: isHol ? '#ef4444' : 'inherit', backgroundColor: isHol ? 'var(--accent-pink)' : 'inherit' }}>
              {date.getMonth() + 1}/{date.getDate()} ({getDayOfWeek(date)})
            </div>
            );
          })}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {displayedMembers.map((member) => {
            const isMe = currentUser && (currentUser.uid === member.id || currentUser.id === member.id);
            return (
              <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '150px repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: isMe ? 'var(--me-bg)' : 'transparent' }}>
                <div style={{ padding: '8px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className={`status-badge status-${member.status || 'office'}`} style={{ padding: '2px 4px', borderRadius: '4px', fontSize: '10px', color: '#fff', backgroundColor: `var(--status-${member.status || 'office'})`, whiteSpace: 'nowrap' }}>{getStatusLabel(member.status || 'office')}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name || '未設定'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.branch}</div>
                </div>
                {weekDays.map((date, i) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isHol = isHoliday(date);
                  const daySchedules = (member.schedules || []).filter((s:any) => s.date === dateStr);
                  daySchedules.sort((a:any, b:any) => timeToNum(a.start) - timeToNum(b.start));
                  
                  return (
                    <div 
                      key={i} 
                      className={isHol ? 'holiday-cell' : ''}
                      style={{ padding: '4px', borderRight: i < 6 ? '1px solid var(--border-color)' : 'none', minHeight: '60px', cursor: isMe ? 'pointer' : 'default', backgroundColor: isHol ? 'var(--accent-pink)' : 'transparent' }}
                      onClick={() => isMe ? openModal(null, dateStr) : null}
                    >
                      {daySchedules.map((schedule:any) => (
                        <div 
                          key={schedule.id}
                          className={`bg-${schedule.color}`}
                          style={{ marginBottom: '4px', padding: '2px 4px', borderRadius: '4px', fontSize: '11px', cursor: isMe ? 'pointer' : 'default', lineHeight: 1.2 }}
                          onClick={(e) => { if (isMe) { e.stopPropagation(); openModal(schedule); } }}
                        >
                          <div style={{ fontWeight: 'bold' }}>{schedule.title}</div>
                          <div style={{ opacity: 0.8, fontSize: '10px' }}>{schedule.start} - {schedule.end}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays(calendarDate);

    return (
      <div className="month-view glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>ステータス凡例:</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-office"></span>社内</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-biztrip"></span>出張</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-out"></span>外出</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-meeting"></span>会議</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-away"></span>離席</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-offline"></span>退勤</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}><span className="status-dot status-holiday"></span>休暇</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', padding: '8px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', background: 'var(--bg-card)' }}>
          {['日', '月', '火', '水', '木', '金', '土'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)' }}>
          {monthDays.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
            const isToday = dateStr === todayFormatted;
            const isHol = isHoliday(date);
            
            // Gather all schedules for this day across all displayed members
            const daySchedules: any[] = [];
            displayedMembers.forEach(member => {
              const schedules = (member.schedules || []).filter((s:any) => s.date === dateStr);
              schedules.forEach((s:any) => daySchedules.push({ ...s, member }));
            });
            daySchedules.sort((a, b) => timeToNum(a.start) - timeToNum(b.start));
            
            return (
              <div 
                key={i} 
                className={isHol ? 'holiday-cell' : ''}
                style={{ background: isHol ? 'var(--accent-pink)' : (isToday ? 'var(--me-bg)' : 'var(--bg-card)'), minHeight: '100px', padding: '4px', opacity: isCurrentMonth ? 1 : 0.4 }} 
                onClick={() => {
                  // Switch to day view for this date
                  setCalendarView('day');
                  setCalendarDate(new Date(date));
                }}
              >
                <div className="date-number" style={{ textAlign: 'right', fontSize: '12px', marginBottom: '4px', paddingRight: '4px', fontWeight: isToday ? 'bold' : 'normal', color: isHol ? '#ef4444' : 'inherit' }}>
                  {date.getDate()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {daySchedules.slice(0, 4).map((schedule:any, idx) => {
                    const isMe = currentUser && (currentUser.uid === schedule.member.id || currentUser.id === schedule.member.id);
                    return (
                      <div 
                        key={`${schedule.id}-${idx}`}
                        className={`bg-${schedule.color}`}
                        style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '2px', cursor: isMe ? 'pointer' : 'default', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}
                        onClick={(e) => { 
                          if (isMe) { 
                            e.stopPropagation(); 
                            openModal(schedule); 
                          } 
                        }}
                      >
                        <span style={{ fontWeight: 'bold', marginRight: '4px', opacity: 0.7 }}>{schedule.member.name?.substring(0,2)}</span>
                        {schedule.title}
                      </div>
                    );
                  })}
                  {daySchedules.length > 4 && <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>他 {daySchedules.length - 4} 件</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="header glass-panel">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className="header-title">タイムライン</h1>
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="branch-select"
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <p className="header-date">
            {calendarView === 'day' ? (
              <span style={{ color: isHoliday(calendarDate) ? '#ef4444' : 'inherit', fontWeight: isHoliday(calendarDate) ? 'bold' : 'normal' }}>
                {todayDisplay} {isHoliday(calendarDate) && '(休)'}
              </span>
            ) : calendarView === 'week' ? (
              `${calendarDate.getFullYear()}年${calendarDate.getMonth()+1}月`
            ) : (
              `${calendarDate.getFullYear()}年${calendarDate.getMonth()+1}月`
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--border-color)', padding: '2px', borderRadius: '6px', marginRight: '16px' }}>
          <button className={`btn ${calendarView === 'day' ? 'active' : ''}`} style={{ background: calendarView === 'day' ? 'var(--bg-card)' : 'transparent', border: 'none' }} onClick={() => setCalendarView('day')}>日</button>
          <button className={`btn ${calendarView === 'week' ? 'active' : ''}`} style={{ background: calendarView === 'week' ? 'var(--bg-card)' : 'transparent', border: 'none' }} onClick={() => setCalendarView('week')}>週</button>
          <button className={`btn ${calendarView === 'month' ? 'active' : ''}`} style={{ background: calendarView === 'month' ? 'var(--bg-card)' : 'transparent', border: 'none' }} onClick={() => setCalendarView('month')}>月</button>
        </div>

        <div className="header-actions">
          <button className="btn" style={{ padding: '4px 8px' }} onClick={prevDay}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn" onClick={() => setCalendarDate(new Date())}>
            今日
          </button>
          <button className="btn" style={{ padding: '4px 8px' }} onClick={nextDay}>
            <ChevronRight size={16} />
          </button>
          <button className="btn" style={{ background: 'var(--active-bg)', marginLeft: '8px' }} onClick={() => openModal()}>
            <Plus size={16} /> 予定追加
          </button>
        </div>
      </header>
      
      <div className="calendar-container relative-container" style={{ flex: 1, overflowY: 'auto' }}>
        {calendarView === 'day' && renderDayView()}
        {calendarView === 'week' && renderWeekView()}
        {calendarView === 'month' && renderMonthView()}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingScheduleId ? '予定を編集' : '予定を追加'}</h3>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="input-group-vertical">
                <label>タイトル</label>
                <input type="text" placeholder="例: 定例ミーティング" value={modalData.title} onChange={e => setModalData({...modalData, title: e.target.value})} />
              </div>
              <div className="input-group-vertical">
                <label>日付</label>
                <input type="date" value={modalData.date} onChange={e => setModalData({...modalData, date: e.target.value})} />
              </div>
              <div className="input-row">
                <div className="input-group-vertical">
                  <label>開始時間</label>
                  <input type="time" value={modalData.start} onChange={e => setModalData({...modalData, start: e.target.value})} />
                </div>
                <div className="input-group-vertical">
                  <label>終了時間</label>
                  <input type="time" value={modalData.end} onChange={e => setModalData({...modalData, end: e.target.value})} />
                </div>
              </div>
              <div className="input-group-vertical">
                <label>カラータグ</label>
                <div className="color-picker">
                  {['blue', 'pink', 'green', 'yellow'].map(c => (
                    <div 
                      key={c} 
                      className={`color-circle bg-${c} ${modalData.color === c ? 'selected' : ''}`}
                      onClick={() => setModalData({...modalData, color: c})}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {editingScheduleId && (
                  <button className="btn" style={{ color: 'var(--status-meeting)' }} onClick={handleDelete}>
                    <Trash2 size={16} /> 削除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={closeModal}>キャンセル</button>
                <button className="btn btn-primary" onClick={handleSave}>保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
