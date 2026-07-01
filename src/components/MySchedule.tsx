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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskModalData, setTaskModalData] = useState({ title: '', dueDate: '' });
  const [isCompletedTasksOpen, setIsCompletedTasksOpen] = useState(false);
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

  const [modalData, setModalData] = useState({ title: '', date: todayStr, endDate: todayStr, start: '09:00', end: '10:00', color: 'blue', isAllDay: false });

  const mySchedules = currentUser?.schedules || [];
  const myTasks = currentUser?.tasks || [];
  const activeTasks = myTasks.filter((t: any) => !t.completed);
  const completedTasks = myTasks.filter((t: any) => t.completed);

  const renderDay = (dateObj: Date, labelStr?: string) => {
    const dStr = getLocalDateString(dateObj);
    const daySchedules = mySchedules.filter((s: any) => dStr >= (s.date || '') && dStr <= (s.endDate || s.date || '')).sort((a: any, b: any) => a.start - b.start);
    
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
                <div style={{ fontWeight: 'bold' }}>{schedule.isAllDay ? '終日' : `${numToTime(schedule.start)} - ${numToTime(schedule.end)}`}</div>
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
        endDate: schedule.endDate || schedule.date || todayStr,
        start: typeof schedule.start === 'number' ? numToTime(schedule.start) : schedule.start,
        end: typeof schedule.end === 'number' ? numToTime(schedule.end) : schedule.end,
        color: schedule.color || 'blue',
        isAllDay: schedule.isAllDay || false
      });
    } else {
      setEditingScheduleId(null);
      setModalData({ title: '', date: todayStr, endDate: todayStr, start: '09:00', end: '10:00', color: 'blue', isAllDay: false });
    }
    setIsScheduleModalOpen(true);
  };
  
  const closeModal = () => setIsScheduleModalOpen(false);

  const handleSaveSchedule = async () => {
    if (!currentUser?.uid) return;
    let newSchedules = [...mySchedules];
    
    if (editingScheduleId) {
      newSchedules = newSchedules.map((s: any) => s.id === editingScheduleId ? {
        ...s, title: modalData.title, date: modalData.date, endDate: modalData.endDate, start: timeToNum(modalData.start), end: timeToNum(modalData.end), color: modalData.color, isAllDay: modalData.isAllDay
      } : s);
    } else {
      newSchedules.push({
        id: Date.now().toString(), title: modalData.title, date: modalData.date, endDate: modalData.endDate, start: timeToNum(modalData.start), end: timeToNum(modalData.end), color: modalData.color, isAllDay: modalData.isAllDay
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

  const openTaskModal = (task?: any) => {
    if (task) {
      setEditingTaskId(task.id);
      setTaskModalData({ title: task.title, dueDate: task.dueDate || '' });
    } else {
      setEditingTaskId(null);
      setTaskModalData({ title: '', dueDate: '' });
    }
    setIsTaskModalOpen(true);
  };
  const closeTaskModal = () => setIsTaskModalOpen(false);

  const handleSaveTask = async () => {
    if (!currentUser?.uid || !taskModalData.title.trim()) return;
    let newTasks = [...myTasks];
    if (editingTaskId) {
      newTasks = newTasks.map((t: any) => t.id === editingTaskId ? { ...t, title: taskModalData.title, dueDate: taskModalData.dueDate } : t);
    } else {
      newTasks.push({ id: Date.now().toString(), title: taskModalData.title, dueDate: taskModalData.dueDate, completed: false });
    }
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { tasks: newTasks }, { merge: true });
      closeTaskModal();
    } catch (e) {
      alert('保存に失敗しました');
    }
  };

  const handleDeleteTask = async () => {
    if (!currentUser?.uid || !editingTaskId) return;
    if (!confirm('このタスクを削除しますか？')) return;
    let newTasks = myTasks.filter((t: any) => t.id !== editingTaskId);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { tasks: newTasks }, { merge: true });
      closeTaskModal();
    } catch (e) {
      alert('削除に失敗しました');
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!currentUser?.uid) return;
    let newTasks = myTasks.map((t: any) => t.id === taskId ? { ...t, completed: !currentCompleted } : t);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { tasks: newTasks }, { merge: true });
    } catch (e) {
      console.error(e);
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
              <button className="btn" style={{ padding: '4px 8px' }} onClick={() => openTaskModal()}>
                <Plus size={14} /> 追加
              </button>
            </div>
            <div className="task-list">
              {activeTasks.map((task: any) => (
                <div key={task.id} className="task-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" checked={false} onChange={() => handleToggleTask(task.id, false)} style={{ marginTop: '4px' }} />
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openTaskModal(task)}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{task.title}</div>
                    {task.dueDate && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>期限: {task.dueDate}</div>}
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>タスクはありません</div>}
              
              {completedTasks.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div 
                    style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}
                    onClick={() => setIsCompletedTasksOpen(!isCompletedTasksOpen)}
                  >
                    <span style={{ transform: isCompletedTasksOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block', marginRight: '4px' }}>▶</span>
                    完了済み ({completedTasks.length})
                  </div>
                  {isCompletedTasksOpen && (
                    <div style={{ opacity: 0.6 }}>
                      {completedTasks.map((task: any) => (
                        <div key={task.id} className="task-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <input type="checkbox" checked={true} onChange={() => handleToggleTask(task.id, true)} style={{ marginTop: '4px' }} />
                          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openTaskModal(task)}>
                            <div style={{ fontSize: '14px', textDecoration: 'line-through' }}>{task.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                <label>期間・終日</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="date" value={modalData.date} onChange={e => setModalData({...modalData, date: e.target.value})} style={{ flex: 1 }} />
                  <span>〜</span>
                  <input type="date" value={modalData.endDate} onChange={e => setModalData({...modalData, endDate: e.target.value})} style={{ flex: 1 }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={modalData.isAllDay} onChange={e => setModalData({...modalData, isAllDay: e.target.checked})} />
                  終日の予定
                </label>
              </div>
              {!modalData.isAllDay && (
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
              )}
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
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTaskId ? 'タスクを編集' : 'タスクを追加'}</h3>
              <button className="modal-close" onClick={closeTaskModal}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="input-group-vertical">
                <label>タスク内容</label>
                <input type="text" placeholder="例: 月間レポート提出" value={taskModalData.title} onChange={e => setTaskModalData({...taskModalData, title: e.target.value})} />
              </div>
              <div className="input-group-vertical">
                <label>期限 (任意)</label>
                <input type="date" value={taskModalData.dueDate} onChange={e => setTaskModalData({...taskModalData, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {editingTaskId && (
                  <button className="btn" style={{ color: 'var(--status-meeting)' }} onClick={handleDeleteTask}>
                    <Trash2 size={16} /> 削除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={closeTaskModal}>キャンセル</button>
                <button className="btn btn-primary" onClick={handleSaveTask}>保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
