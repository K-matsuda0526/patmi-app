/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bell } from 'lucide-react';

interface NotificationProviderProps {
  currentUser: any;
  children: React.ReactNode;
}

let globalAudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

export default function NotificationProvider({ currentUser, children }: NotificationProviderProps) {
  const prevMembersRef = useRef<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Unlock audio on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      getAudioCtx();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const newMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const prevMembers = prevMembersRef.current;
      
      if (prevMembers.length > 0) {
        newMembers.forEach(newMember => {
          // 自分自身の変更は通知しない
          if (newMember.id === currentUser.uid || newMember.id === currentUser.id) return;

          const oldMember: any = prevMembers.find(m => m.id === newMember.id);
          if (oldMember) {
             const getHash = (schedules: any[]) => {
               if (!schedules) return '';
               return schedules.map(s => `${s.id || ''}-${s.title || ''}-${s.start || ''}-${s.end || ''}-${s.date || ''}`).sort().join('|');
             };
             
             const oldHash = getHash(oldMember.schedules);
             const newHash = getHash((newMember as any).schedules);
             
             if (oldHash !== newHash) {
               // Schedule changed!
               triggerNotification(newMember);
             }
          }
        });
      }

      prevMembersRef.current = newMembers;
    });

    return () => unsubscribe();
  }, [currentUser]);

  const triggerNotification = (member: any) => {
    const settings = currentUser?.notifications || {};
    const mutedMembers = settings.mutedMembers || [];
    
    // Check if this member is muted
    if (mutedMembers.includes(member.id)) return;

    // Show popup
    if (settings.popupEnabled !== false) {
      setToast(`${member.name || 'メンバー'}さんが予定を更新しました`);
      setTimeout(() => setToast(null), 5000);
    }

    // Play sound
    if (settings.soundEnabled !== false) {
      // 'Pikon' sound (two quick notes)
      try {
        const audioCtx = getAudioCtx();
        const t = audioCtx.currentTime;

        // First note: 'Pi'
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t); // A5
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.4, t + 0.02);
        gain1.gain.linearRampToValueAtTime(0, t + 0.12);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(t);
        osc1.stop(t + 0.12);

        // Second note: 'Kon'
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, t + 0.12); // E6
        gain2.gain.setValueAtTime(0, t + 0.12);
        gain2.gain.linearRampToValueAtTime(0.4, t + 0.14);
        gain2.gain.linearRampToValueAtTime(0, t + 0.3);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(t + 0.12);
        osc2.stop(t + 0.3);
      } catch (e) {
        console.error("Audio playback failed", e);
      }
    }
  };

  return (
    <>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          borderLeft: '4px solid var(--status-office)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <Bell size={20} color="var(--status-office)" />
          <span style={{ fontWeight: 'bold' }}>{toast}</span>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
