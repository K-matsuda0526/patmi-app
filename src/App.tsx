/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, User, Users, Settings, LogOut, MessageSquare, Menu } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import './index.css';
import './components.css'; // Import the new styles

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Directory from './components/Directory';
import MySchedule from './components/MySchedule';
import SettingsView from './components/Settings';
import TeamCalendar from './components/TeamCalendar';
import Chat from './components/Chat';
import NotificationProvider from './components/NotificationProvider';
import { collection, query, where } from 'firebase/firestore';

// Mock data removed

function App() {
  const [theme, setTheme] = useState('cool');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [targetUserIdForChat, setTargetUserIdForChat] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalUnreadChat, setTotalUnreadChat] = useState(0);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // First check if doc exists to not fail initially
        const userDocRef = doc(db, 'users', user.uid);
        
        // Listen to realtime updates of the current user document
        unsubscribeSnapshot = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setCurrentUser({ uid: user.uid, id: user.uid, ...snapshot.data() });
            setLoading(false);
          } else {
            // Auto-create missing user document
            const defaultUser = {
              name: user.displayName || '未設定ユーザー',
              branch: '未設定',
              title: 'メンバー',
              status: 'office',
              emails: [user.email || ''],
              uid: user.uid,
              createdAt: new Date().toISOString()
            };
            setDoc(userDocRef, defaultUser).then(() => {
              setCurrentUser({ id: user.uid, ...defaultUser });
              setLoading(false);
            }).catch(e => {
              console.error("Failed to create missing user doc", e);
              setCurrentUser({ uid: user.uid, id: user.uid, name: '新規ユーザー' });
              setLoading(false);
            });
          }
        });
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        setCurrentUser(null);
        setLoading(false);
      }
    });
    
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  // Calculate total unread chats
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'chatRooms'), where('members', 'array-contains', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      let count = 0;
      snapshot.forEach((doc: any) => {
        const room = doc.data();
        if (room.unreadCount && room.unreadCount[currentUser.uid]) {
          count += room.unreadCount[currentUser.uid];
        }
      });
      setTotalUnreadChat(count);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Handle Online Presence
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), { 
          isOnline,
          lastActive: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to update presence", e);
      }
    };

    // Set online initially
    if (document.visibilityState === 'visible') {
      updateOnlineStatus(true);
    }

    const handleVisibilityChange = () => {
      updateOnlineStatus(document.visibilityState === 'visible');
    };

    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat every 3 minutes while visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus(true);
      }
    }, 3 * 60 * 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [currentUser?.uid]);

  
  // Auto-sync Global Status from Schedules
  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.schedules) return;
    
    const checkAndSyncStatus = async () => {
      const now = new Date();
      // Format to YYYY-MM-DD and HH:MM
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;
      const timeStr = now.toTimeString().substring(0, 5);

      const activeSchedule = currentUser.schedules.find((s: any) => {
        const isToday = (s.date || '') <= todayStr && (s.endDate || s.date || '') >= todayStr;
        if (!isToday) return false;
        if (s.isAllDay) return true;
        // Check if current time is within schedule
        const start = typeof s.start === 'number' ? `${String(Math.floor(s.start)).padStart(2,'0')}:00` : s.start || '00:00';
        let end = typeof s.end === 'number' ? `${String(Math.floor(s.end)).padStart(2,'0')}:00` : s.end || '23:59';
        // Handle end time "24:00" which is not a valid time string but valid in logic
        if (end === '24:00') end = '23:59';
        
        return start <= timeStr && end > timeStr;
      });

      if (activeSchedule && activeSchedule.status && activeSchedule.status !== currentUser.status) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), { 
            status: activeSchedule.status,
            lastStatusUpdate: new Date().toISOString()
          }, { merge: true });
        } catch(e) {}
      }
    };

    // Check immediately then every minute
    checkAndSyncStatus();
    const interval = setInterval(checkAndSyncStatus, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>読み込み中...</div>;
  }

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <Login />;
  }

  // Render main app content
  return (
    <NotificationProvider currentUser={currentUser}>
      <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSidebarCollapsed ? '40px' : '8px' }}>
          {!isSidebarCollapsed && <div className="sidebar-logo" style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.5px', margin: 0 }}>Patmi</div>}
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={isSidebarCollapsed ? "メニューを展開" : "メニューを折りたたむ"}
          >
            <Menu size={24} />
          </button>
        </div>
        {!isSidebarCollapsed && <div className="sidebar-subtitle" style={{ fontSize: '11px', letterSpacing: '1px', opacity: 0.8, marginBottom: '40px' }}>スケジュール管理</div>}
        
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} title={isSidebarCollapsed ? "ダッシュボード" : ""}>
            <LayoutDashboard size={18} />
            <span>ダッシュボード</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('calendar'); }} title={isSidebarCollapsed ? "カレンダー" : ""}>
            <CalendarDays size={18} />
            <span>カレンダー</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'myschedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('myschedule'); }} title={isSidebarCollapsed ? "マイスケジュール" : ""}>
            <User size={18} />
            <span>マイスケジュール</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('directory'); }} title={isSidebarCollapsed ? "ディレクトリ" : ""}>
            <Users size={18} />
            <span>ディレクトリ</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('chat'); }} style={{ position: 'relative' }} title={isSidebarCollapsed ? "チャット" : ""}>
            <MessageSquare size={18} />
            <span>チャット</span>
            {totalUnreadChat > 0 && (
              <span className={`chat-badge ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                {isSidebarCollapsed ? '' : totalUnreadChat}
              </span>
            )}
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} title={isSidebarCollapsed ? "設定" : ""}>
            <Settings size={18} />
            <span>設定</span>
          </a>
        </nav>

        {/* Theme Switcher */}
        <div className="theme-switcher">
          <div className="theme-title">カラーテーマ</div>
          <div className="theme-options" style={{ flexDirection: 'row', gap: '16px', padding: '4px 0' }}>
            <button 
              className={`theme-color-btn ${theme === 'cool' ? 'active' : ''}`} 
              style={{ backgroundColor: '#46698C' }}
              onClick={() => setTheme('cool')}
              title="大人かっこいい"
            />
            <button 
              className={`theme-color-btn ${theme === 'cafe' ? 'active' : ''}`} 
              style={{ backgroundColor: '#d4a373' }}
              onClick={() => setTheme('cafe')}
              title="おしゃれカフェ風"
            />
          </div>
          
          <button 
            className="theme-btn" 
            style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e11d48' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> ログアウト
          </button>
        </div>
      </aside>

      {/* Main Content Area Routing */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {activeTab === 'calendar' && <TeamCalendar currentUser={currentUser} />}
        {activeTab === 'myschedule' && <MySchedule currentUser={currentUser} />}
        {activeTab === 'directory' && <Directory onStartChat={(userId: string) => { setActiveTab('chat'); setTargetUserIdForChat(userId); }} />}
        {activeTab === 'chat' && <Chat currentUser={currentUser} initialTargetUserId={targetUserIdForChat} />}
        {activeTab === 'settings' && <SettingsView currentUser={currentUser} theme={theme} setTheme={setTheme} />}
      </main>
    </div>
    </NotificationProvider>
  );
}

export default App;
