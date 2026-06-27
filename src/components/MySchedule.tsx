/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { Calendar, Clock, Plus, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const timeToNum = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m / 60);
};

const numToTime = (num: number) => {
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export default function MySchedule({ currentUser }: { currentUser: any }) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | string | null>(null);
  
  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayDate = new Date();
  const todayStr = getLocalDateString(todayDate);

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(todayDate));

  const shiftWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  const [modalData, setModalData] = useState({ title: '', date: todayStr, start: '09:00', end: '10:00', color: 'blue' });

  const mySchedules = currentUser?.schedules || [];

  const renderDay = (dateObj: Date, labelStr?: string) => {
    const dStr = getLocalDateString(dateObj);
    const daySchedules = mySchedules.filter((s: any) => s.date === dStr).sort((a: any, b: any) => a.start - b.start);
    
    // Only show if it's Today/Tomorrow OR if it has schedules
    if (!labelStr && daySchedules.length === 0) return null;

    const displayLabel = labelStr || `${dateObj.getMonth() + 1}/${dateObj.getDate()} (${['日','月','火','水','木','金','土'][dateObj.getDay()]})`;

    // Highlight today
    const isToday = dStr === todayStr;

    return (
      <div className="personal-day" key={dStr} style={isToday ? { borderLeft: '4px solid var(--accent-blue)', paddingLeft: '12px' } : {}}>
        <div className="day-label" style={isToday ? { color: 'var(--text-main)', fontWeight: 'bold' } : {}}>
          {displayLabel} {isToday && <span style={{ fontSize: '11px', color: 'var(--accent-blue)', marginLeft: '8px' }}>今日</span>}
        </div>
        <div className="day-events">
          {daySchedules.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>予定はありません</div>
          ) : (
            daySchedules.map((schedule: any) => (
              <div 
                key={schedule.id} 
                className="schedule-item" 
                style={{ padding: '12px', marginBottom: '8px', cursor: 'pointer', backgroundColor: schedule.color?.startsWith('#') ? schedule.color : `var(--accent-${schedule.color || 'blue'})` }}
                onClick={() => openModal(schedule)}
              >
                <div style={{ fontWeight: 'bold' }}>{numToTime(schedule.start)} - {numToTime(schedule.end)}</div>
                <div>{schedule.title}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const openModal = (schedule?: any) => {
    if (schedule) {
      setEditingScheduleId(schedule.id);
      setModalData({
        title: schedule.title,
        date: schedule.date || todayStr,
        start: numToTime(schedule.start),
        end: numToTime(schedule.end),
        color: schedule.color
      });
    } else {
      setEditingScheduleId(null);
      setModalData({ title: '', date: todayStr, start: '09:00', end: '10:00', color: 'blue' });
    }
    setIsScheduleModalOpen(true);
  };
  
  const closeModal = () => setIsScheduleModalOpen(false);

  const handleSaveSchedule = async () => {
    if (!currentUser?.uid) return;
    let newSchedules = [...mySchedules];
    
    if (editingScheduleId) {
      newSchedules = newSchedules.map((s: any) => s.id === editingScheduleId ? {
        ...s, title: modalData.title, date: modalData.date, start: timeToNum(modalData.start), end: timeToNum(modalData.end), color: modalData.color
      } : s);
    } else {
      newSchedules.push({
        id: Date.now().toString(), title: modalData.title, date: modalData.date, start: timeToNum(modalData.start), end: timeToNum(modalData.end), color: modalData.color
      });
    }
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { schedules: newSchedules }, { merge: true });
      closeModal();
    } catch (e) {
      alert('保存に失敗しました');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!currentUser?.uid || !editingScheduleId) return;
    if (!confirm('この予定を削除しますか？')) return;
    let newSchedules = mySchedules.filter((s: any) => s.id !== editingScheduleId);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { schedules: newSchedules }, { merge: true });
      closeModal();
    } catch (e) {
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="myschedule-container">
      <header className="myschedule-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>マイスケジュール</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> 予定を追加
        </button>
      </header>

      <div className="myschedule-content">
        <div className="myschedule-main glass-panel">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} />
              <h3>今週の予定</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" style={{ padding: '4px 8px' }} onClick={() => shiftWeek(-1)}>前週</button>
              <button className="btn" style={{ padding: '4px 8px' }} onClick={() => setCurrentWeekStart(getMonday(todayDate))}>今週</button>
              <button className="btn" style={{ padding: '4px 8px' }} onClick={() => shiftWeek(1)}>次週</button>
            </div>
          </div>
          <div className="personal-timeline">
            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
               const d = new Date(currentWeekStart);
               d.setDate(d.getDate() + offset);
               return renderDay(d, `${d.getMonth() + 1}/${d.getDate()} (${['日','月','火','水','木','金','土'][d.getDay()]})`);
            })}
          </div>
        </div>

        <div className="myschedule-sidebar">
          <div className="myschedule-card glass-panel">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} />
                <h3>タスクと期限</h3>
              </div>
              <button className="btn" style={{ padding: '4px 8px' }} onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={14} /> 追加
              </button>
            </div>
            <div className="task-list">
              <div className="task-item">
                <input type="checkbox" />
                <span>月間レポート提出 (金曜まで)</span>
              </div>
              <div className="task-item">
                <input type="checkbox" />
                <span>経費精算 (月末まで)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>予定を追加・編集</h3>
              <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="input-group-vertical">
                <label>タイトル</label>
                <input type="text" placeholder="例: クライアント商談" value={modalData.title} onChange={e => setModalData({...modalData, title: e.target.value})} />
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
                <div className="color-picker" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {['blue', 'pink', 'green', 'yellow'].map(c => (
                    <div 
                      key={c} 
                      className={`color-circle bg-${c} ${modalData.color === c ? 'selected' : ''}`}
                      onClick={() => setModalData({...modalData, color: c})}
                    />
                  ))}
                  <div style={{ borderLeft: '1px solid var(--border-color)', height: '24px', margin: '0 4px' }}></div>
                  <input 
                    type="color" 
                    value={modalData.color?.startsWith('#') ? modalData.color : '#cbd5e1'} 
                    onChange={e => setModalData({...modalData, color: e.target.value})} 
                    style={{ width: '32px', height: '32px', border: 'none', padding: 0, borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                    title="カスタムカラー"
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>カスタム</span>
                </div>
              </div>
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
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>タスクを追加</h3>
              <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="input-group-vertical">
                <label>タスク内容</label>
                <input type="text" placeholder="例: 月間レポート提出" />
              </div>
              <div className="input-group-vertical">
                <label>期限 (任意)</label>
                <input type="date" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setIsTaskModalOpen(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(false)}>保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
