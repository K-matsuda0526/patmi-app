/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const branches = ['全体', '本社', '三宅工場', '坪井工場', '大阪営業所', '福岡営業所', '横浜営業所'];

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
      case 'office': return '社内';
    biztrip: '出張',
    out: '外出',
    meeting: '会議',
    away: '離席',
    offline: '退勤'
  };
  return map[status] || status;
};
  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = new Date();
  const todayFormatted = getLocalDateString(today);
  const todayDisplay = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  const [members, setMembers] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('全体');
  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const todayFormatted = getLocalDateString(calendarDate);
  const getDisplayDate = () => {
    if (calendarView === 'day') return calendarDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    if (calendarView === 'week') {
      const start = getMonday(calendarDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'})} - ${end.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric'})}`;
    }
    return calendarDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  };
  const todayDisplay = getDisplayDate();

  const shiftDate = (offset: number) => {
    const d = new Date(calendarDate);
    if (calendarView === 'day') d.setDate(d.getDate() + offset);
    else if (calendarView === 'week') d.setDate(d.getDate() + offset * 7);
    else if (calendarView === 'month') d.setMonth(d.getMonth() + offset);
    setCalendarDate(d);
  };

  const [members, setMembers] = useState<any[]>([]);
    });
    return () => unsubscribe();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', date: '2026-06-25', start: '09:00', end: '10:00', color: 'blue' });
          key={schedule.id}
          className="schedule-block"
          style={{ 
            left: `${leftPercent}%`, 
            width: `${widthPercent}%`, 
            cursor: isMe ? 'pointer' : 'default',
            backgroundColor: schedule.color?.startsWith('#') ? schedule.color : `var(--accent-${schedule.color || 'blue'})`
          }}
    return schedules.map(schedule => {
      const leftPercent = Math.max(0, ((schedule.start - 8) / 10) * 100);
      const widthPercent = Math.min(100 - leftPercent, ((schedule.end - schedule.start) / 10) * 100);
      
      return (
        <div 
  const renderSchedules = (schedules: any[], isMe: boolean) => {
    return schedules.map(schedule => {
      const leftPercent = Math.max(0, ((schedule.start - 8) / 10) * 100);
      setModalData({
  const renderSchedules = (schedules: any[], isMe: boolean) => {
    // Sort schedules by start time to process lanes properly
    const sorted = [...schedules].sort((a, b) => a.start - b.start);
    
    // Assign lanes to prevent overlapping overlaps
    const lanes: any[][] = [];
    const scheduledWithLanes = sorted.map(schedule => {
      let laneIndex = 0;
      while (lanes[laneIndex] && lanes[laneIndex].some(s => s.start < schedule.end && s.end > schedule.start)) {
        laneIndex++;
      }
      if (!lanes[laneIndex]) lanes[laneIndex] = [];
      lanes[laneIndex].push(schedule);
      return { ...schedule, lane: laneIndex };
    });

    const totalLanes = Math.max(1, lanes.length);
    const laneHeight = 100 / totalLanes;

    return scheduledWithLanes.map(schedule => {
      const leftPercent = Math.max(0, ((schedule.start - 8) / 10) * 100);
      const widthPercent = Math.min(100 - leftPercent, ((schedule.end - schedule.start) / 10) * 100);
      
      return (
        <div 
          key={schedule.id}
          className="schedule-block"
          style={{ 
            left: `${leftPercent}%`, 
            width: `${widthPercent}%`, 
            top: `calc(${schedule.lane * laneHeight}% + 4px)`,
            height: `calc(${laneHeight}% - 8px)`,
            bottom: 'auto',
            cursor: isMe ? 'pointer' : 'default',
            backgroundColor: schedule.color?.startsWith('#') ? schedule.color : `var(--accent-${schedule.color || 'blue'})`
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
        start: numToTime(schedule.start),
        end: numToTime(schedule.end),
        color: schedule.color
      });
    } else {
      setEditingScheduleId(null);
      setModalData({ title: '', date: '2026-06-25', start: '09:00', end: '10:00', color: 'blue' });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => setIsModalOpen(false);

  const handleSaveSchedule = async () => {
    if (!currentUser?.uid) return;
    const me = members.find(m => m.id === currentUser.uid);
    let mySchedules = me?.schedules ? [...me.schedules] : [];
    
    if (editingScheduleId) {
      mySchedules = mySchedules.map(s => s.id === editingScheduleId ? {
        ...s, title: modalData.title, date: modalData.date, start: timeToNum(modalData.start), end: timeToNum(modalData.end), color: modalData.color
      } : s);
    } else {
      mySchedules.push({
        id: Date.now().toString(), title: modalData.title, date: modalData.date, start: timeToNum(modalData.start), end: timeToNum(modalData.end), color: modalData.color
      });
    }
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { schedules: mySchedules }, { merge: true });
      closeModal();
    } catch (e) {
      alert('保存に失敗しました');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!currentUser?.uid || !editingScheduleId) return;
    if (!confirm('この予定を削除しますか？')) return;
    const me = members.find(m => m.id === currentUser.uid);
    let mySchedules = me?.schedules ? [...me.schedules] : [];
    mySchedules = mySchedules.filter(s => s.id !== editingScheduleId);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { schedules: mySchedules }, { merge: true });
      closeModal();
    } catch (e) {
      alert('削除に失敗しました');
    }
  };
  const renderDayView = () => {
    return (
      <div className="timeline-grid glass-panel">
        <div className="timeline-header-row">
          <div className="timeline-header-cell">メンバー</div>
          <div className="timeline-time-slots">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
              <div key={t} className="time-slot-header">{t}</div>
            ))}
  const renderDayView = () => {
    return (
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
          
          return (
            <div key={member.id} className={`timeline-row ${isMe ? 'is-current-user' : ''}`}>
              <div className="member-info">
                <div className="member-name">
                  <span className={`status-badge status-${member.status}`}>{getStatusLabel(member.status)}</span>
                  {member.name} {isMe && <span className="me-badge">自分</span>}
                </div>
                <div className="member-meta">{member.branch} • {member.title}</div>
              </div>
              <div 
                className={`schedule-slots ${isMe ? 'interactive-slot' : 'locked-slot'}`}
                onClick={() => isMe ? openModal() : null}
                title={isMe ? "クリックして予定を追加" : "他人の予定は編集できません"}
              >
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="schedule-grid-line"></div>
                ))}
                {renderSchedules((member.schedules || []).filter((s: any) => s.date === todayFormatted), isMe)}
                
                {(member.schedules || []).filter((s: any) => s.date === todayFormatted).length === 0 && (
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
  };

  const renderWeekView = () => {
    const start = getMonday(calendarDate);
    const weekDays = [0,1,2,3,4,5,6].map(i => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="week-grid glass-panel">
        <div className="week-header-row">
          <div className="week-header-cell">メンバー</div>
          {weekDays.map(d => (
            <div key={d.toISOString()} className={`week-header-cell ${getLocalDateString(d) === getLocalDateString(new Date()) ? 'today' : ''}`}>
              {d.getMonth() + 1}/{d.getDate()} ({['日','月','火','水','木','金','土'][d.getDay()]})
            </div>
          ))}
        </div>
        {displayedMembers.map(member => {
          const isMe = currentUser && (currentUser.uid === member.id || currentUser.id === member.id);
          return (
            <div key={member.id} className={`week-row ${isMe ? 'is-current-user' : ''}`}>
              <div className="week-member-info">
                <div className="member-name">
                  <span className={`status-badge status-${member.status}`} style={{ marginRight: '4px' }}>{getStatusLabel(member.status)}</span>
                  {member.name} {isMe && <span className="me-badge">自分</span>}
                </div>
                <div className="member-meta">{member.branch}</div>
              </div>
              </div>
              {weekDays.map(d => {
                const dStr = getLocalDateString(d);
                const daySchedules = (member.schedules || []).filter((s: any) => s.date === dStr).sort((a: any, b: any) => a.start - b.start);
                return (
                  <div key={dStr} className={`week-cell ${isMe ? 'interactive-slot' : ''}`} onClick={() => {
                    if (isMe) {
                      setEditingScheduleId(null);
                      setModalData({ title: '', date: dStr, start: '09:00', end: '10:00', color: 'blue' });
                      openModal();
                    }
                  }}>
                    {daySchedules.map((s: any) => (
                      <div 
                        key={s.id} 
                        className="week-schedule-chip" 
                        style={{ backgroundColor: s.color?.startsWith('#') ? s.color : `var(--accent-${s.color || 'blue'})` }}
                        onClick={(e) => {
                          if (isMe) {
                            e.stopPropagation();
                            openModal(s);
                          }
                        }}
                      >
                        {numToTime(s.start)} {s.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    
    let currentDay = new Date(firstDayOfMonth);
    const firstDayOfWeek = currentDay.getDay(); 
    const diffToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    currentDay.setDate(currentDay.getDate() + diffToMonday);

    const weeks = [];
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(week);
      if (week[6].getMonth() !== month && w > 3) break;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>現在のステータス:</div>
          {displayedMembers.map(member => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
              <span className={`status-dot status-${member.status}`}></span>
              {member.name}
            </div>
          ))}
        </div>
        <div className="month-grid glass-panel" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <div className="month-header-row">
            {['月','火','水','木','金','土','日'].map(day => (
              <div key={day} className="month-header-cell">{day}</div>
            ))}
          </div>
      <div className="month-grid glass-panel">
        <div className="month-header-row">
              const weekDays = [0,1,2,3,4,5,6].map((i) => {
            <div key={day} className="month-header-cell">{day}</div>
          ))}
        </div>
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="month-row">
            {week.map((d, dIdx) => {
              const dStr = getLocalDateString(d);
              const isCurrentMonth = d.getMonth() === month;
              const isToday = dStr === getLocalDateString(new Date());
              
              const daySchedules: any[] = [];
              displayedMembers.forEach(member => {
                const memberSchedules = (member.schedules || []).filter((s: any) => s.date === dStr);
                memberSchedules.forEach((s: any) => {
                  daySchedules.push({ ...s, member });
                });
              });
              daySchedules.sort((a, b) => a.start - b.start);

              return (
                <div key={dStr} className={`month-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`} onClick={() => {
                    setCalendarView('day');
                    setCalendarDate(new Date(d));
                }}>
                  <div className="month-cell-date">{d.getDate()}</div>
                  <div className="month-cell-events">
                    {daySchedules.map((s: any, idx) => {
                      const isMe = currentUser && (currentUser.uid === s.member.id || currentUser.id === s.member.id);
                      return (
                        <div 
                          key={`${s.id}-${idx}`} 
                          className="month-schedule-chip" 
                          style={{ backgroundColor: s.color?.startsWith('#') ? s.color : `var(--accent-${s.color || 'blue'})`, cursor: isMe ? 'pointer' : 'default' }}
                          onClick={(e) => {
                            if (isMe) {
              );
            })}
          </div>
        ))}
        </div>
      </div>
    );
  };
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
        </div>
        {displayedMembers.map(member => {
          const isMe = currentUser && (currentUser.uid === member.id || currentUser.id === member.id);
          
          return (
            <div key={member.id} className={`timeline-row ${isMe ? 'is-current-user' : ''}`}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className="header-title">タイムライン</h1>
                  {member.name} {isMe && <span className="me-badge">自分</span>}
                </div>
                <div className="member-meta">{member.branch} • {member.title}</div>
              </div>
              <div 
                className={`schedule-slots ${isMe ? 'interactive-slot' : 'locked-slot'}`}
                onClick={() => isMe ? openModal() : null}
                title={isMe ? "クリックして予定を追加" : "他人の予定は編集できません"}
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-office"></span>社内</div>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="schedule-grid-line"></div>
                ))}
                {renderSchedules((member.schedules || []).filter((s: any) => s.date === todayFormatted), isMe)}
                
                {(member.schedules || []).filter((s: any) => s.date === todayFormatted).length === 0 && (
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
  };

  const renderWeekView = () => {
    const start = getMonday(calendarDate);
    const weekDays = [0,1,2,3,4,5,6].map(i => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="week-grid glass-panel">
        <div className="week-header-row">
          <div className="week-header-cell">メンバー</div>
          {weekDays.map(d => (
            <div key={d.toISOString()} className={`week-header-cell ${getLocalDateString(d) === getLocalDateString(new Date()) ? 'today' : ''}`}>
              {d.getMonth() + 1}/{d.getDate()} ({['日','月','火','水','木','金','土'][d.getDay()]})
            </div>
          ))}
        </div>
        {displayedMembers.map(member => {
          const isMe = currentUser && (currentUser.uid === member.id || currentUser.id === member.id);
          return (
            <div key={member.id} className={`week-row ${isMe ? 'is-current-user' : ''}`}>
              <div className="week-member-info">
                <div className="member-name">
                  {member.name} {isMe && <span className="me-badge">自分</span>}
                </div>
                <div className="member-meta">{member.branch}</div>
              </div>
              {weekDays.map(d => {
                const dStr = getLocalDateString(d);
                const daySchedules = (member.schedules || []).filter((s: any) => s.date === dStr).sort((a: any, b: any) => a.start - b.start);
                return (
                  <div key={dStr} className={`week-cell ${isMe ? 'interactive-slot' : ''}`} onClick={() => {
                    if (isMe) {
                      setEditingScheduleId(null);
                      setModalData({ title: '', date: dStr, start: '09:00', end: '10:00', color: 'blue' });
                      setIsModalOpen(true);
                    }
                  }}>
                    {daySchedules.map((s: any) => (
                      <div 
                        key={s.id} 
                        className="week-schedule-chip" 
                        style={{ backgroundColor: s.color?.startsWith('#') ? s.color : `var(--accent-${s.color || 'blue'})` }}
                        onClick={(e) => {
                          if (isMe) {
                            e.stopPropagation();
                            openModal(s);
                          }
                        }}
                      >
                        {numToTime(s.start)} {s.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    // Generate calendar days
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Find the Monday before or on the 1st
    let currentDay = new Date(firstDayOfMonth);
    const firstDayOfWeek = currentDay.getDay(); // 0 is Sunday
    const diffToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    currentDay.setDate(currentDay.getDate() + diffToMonday);

    const weeks = [];
    // 6 weeks max for a month
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(week);
      // If we are at the end of the month, we can stop early
      if (week[6].getMonth() !== month && w > 3) break;
    }

    return (
      <div className="month-grid glass-panel">
        <div className="month-header-row">
          {['月','火','水','木','金','土','日'].map(day => (
            <div key={day} className="month-header-cell">{day}</div>
          ))}
        </div>
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="month-row">
            {week.map((d, dIdx) => {
              const dStr = getLocalDateString(d);
              const isCurrentMonth = d.getMonth() === month;
              const isToday = dStr === getLocalDateString(new Date());
              
              // Gather all schedules for this day from displayed members
              const daySchedules: any[] = [];
              displayedMembers.forEach(member => {
                const memberSchedules = (member.schedules || []).filter((s: any) => s.date === dStr);
                memberSchedules.forEach((s: any) => {
                  daySchedules.push({ ...s, member });
                });
              });
              daySchedules.sort((a, b) => a.start - b.start);

              return (
                <div key={dStr} className={`month-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}>
                  <div className="month-cell-date">{d.getDate()}</div>
                  <div className="month-cell-events">
                    {daySchedules.map((s: any, idx) => {
                      const isMe = currentUser && (currentUser.uid === s.member.id || currentUser.id === s.member.id);
                      return (
                        <div 
                          key={`${s.id}-${idx}`} 
                          className="month-schedule-chip" 
                          style={{ backgroundColor: s.color?.startsWith('#') ? s.color : `var(--accent-${s.color || 'blue'})`, cursor: isMe ? 'pointer' : 'default' }}
                          onClick={(e) => {
                            if (isMe) {
                              e.stopPropagation();
                              openModal(s);
                            }
                          }}
                        >
                          {numToTime(s.start)} [{s.member.name}] {s.title}
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="branch-select"
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
            </div>
          </div>
          <p className="header-date">{todayDisplay}</p>
        </div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-office"></span>出社</div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-biztrip"></span>出張</div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-out"></span>外出</div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-meeting"></span>会議</div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-away"></span>離席</div>
              <div style={{ display: 'flex', alignItems: 'center' }}><span className="status-dot status-offline"></span>退勤</div>
            </div>
          </div>
          <p className="header-date">2026年6月25日 (木)</p>
          <p className="header-date">2026年6月25日 (木)</p>
        </div>
        <div className="header-actions">
          <button className="btn">
            <ChevronLeft size={16} /> 前日
          </button>
              <div className="input-group-vertical">
                <label>カラータグ</label>
                <div className="color-picker" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="calendar-container relative-container">
        {calendarView === 'day' && renderDayView()}
        {calendarView === 'week' && renderWeekView()}
        {calendarView === 'month' && renderMonthView()}
      </div>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="schedule-grid-line"></div>
                  {renderSchedules((member.schedules || []).filter((s: any) => s.date === todayFormatted), isMe)}
                  
                  {(member.schedules || []).filter((s: any) => s.date === todayFormatted).length === 0 && (
                  {renderSchedules(member.schedules, isMe)}
                  
                  {member.schedules.length === 0 && (
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
      </div>

      {/* Schedule Input Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>予定を追加</h3>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="input-group-vertical">
                <label>タイトル</label>
                <input type="text" placeholder="例: 定例ミーティング" value={modalData.title} onChange={e => setModalData({...modalData, title: e.target.value})} />
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
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>キャンセル</button>
              <button className="btn btn-primary" onClick={closeModal}>保存する</button>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {editingScheduleId && (
                  <button className="btn" style={{ color: 'var(--status-meeting)' }} onClick={handleDeleteSchedule}>
                    <Trash2 size={16} /> 削除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={closeModal}>キャンセル</button>
                <button className="btn btn-primary" onClick={handleSaveSchedule}>保存する</button>
              </div>
            </div>
}
