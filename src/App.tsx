/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, User, Users, Settings, LogOut, MessageSquare } from 'lucide-react';
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
import NotificationProvider from './components/NotificationProvider';
import Chat from './components/Chat';

// Mock data removed

function App() {
  const [theme, setTheme] = useState('cool');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          } else {
            setCurrentUser({ uid: user.uid, id: user.uid, name: '新規ユーザー' });
          }
          setLoading(false);
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

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [currentUser?.uid]);

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
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '28px', letterSpacing: '-0.5px' }}>Patmi</div>
        <div className="sidebar-subtitle" style={{ fontSize: '11px', letterSpacing: '1px', opacity: 0.8 }}>スケジュール管理</div>
        
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <LayoutDashboard size={18} />
            <span>ダッシュボード</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('calendar'); }}>
            <CalendarDays size={18} />
            <span>カレンダー</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'myschedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('myschedule'); }}>
            <User size={18} />
            <span>マイスケジュール</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('directory'); }}>
            <Users size={18} />
            <span>ディレクトリ</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('chat'); }}>
            <MessageSquare size={18} />
            <span>メッセージ</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}>
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
              style={{ backgroundColor: '#1e293b' }}
              onClick={() => setTheme('cool')}
              title="大人かっこいい"
            />
            <button 
              className={`theme-color-btn ${theme === 'cafe' ? 'active' : ''}`} 
              style={{ backgroundColor: '#8c7c73' }}
              onClick={() => setTheme('cafe')}
              title="おしゃれなカフェ風"
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
        {activeTab === 'directory' && <Directory />}
        {activeTab === 'chat' && <Chat currentUser={currentUser} />}
        {activeTab === 'settings' && <SettingsView currentUser={currentUser} />}
      </main>
    </div>
    </NotificationProvider>
  );
}

export default App;
