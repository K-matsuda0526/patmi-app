import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Bell, MessageSquare } from 'lucide-react';

interface NotificationProviderProps {
  currentUser: any;
  children: React.ReactNode;
}

let globalAudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioCtx;
};

// Play a pleasant "pop" or "ding"
const playNotificationSound = (type: 'chat' | 'schedule') => {
  const audioCtx = getAudioCtx();
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => playSound(audioCtx, type)).catch(console.warn);
  } else {
    playSound(audioCtx, type);
  }
};

const playSound = (audioCtx: AudioContext, type: 'chat' | 'schedule') => {
  try {
    const t = audioCtx.currentTime;
    
    if (type === 'chat') {
      // Chat: Soft "Pop"
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } else {
      // Schedule: "Pikon" (Two quick notes)
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
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function NotificationProvider({ currentUser, children }: NotificationProviderProps) {
  const prevMembersRef = useRef<any[]>([]);
  const prevRoomsRef = useRef<any[]>([]);
  const [toast, setToast] = useState<{ title: string, type: 'chat' | 'schedule' } | null>(null);

  // Request browser notification permission and FCM token
  useEffect(() => {
    const setupFCM = async () => {
      if (!currentUser || !messaging) return;
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Replace with actual VAPID key
          const currentToken = await getToken(messaging, { vapidKey: 'BLnX_Xb_Cvqof_rE_jGBOPFGHEbDa4jZypGflpQ7uPmFxOxiVBivQyBIFzLQd-bxUkZouyyZU-pTOOhqu2jwnJ4' });
          if (currentToken) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              fcmTokens: arrayUnion(currentToken)
            });
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };
    setupFCM();

    // Handle foreground messages from FCM
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        // Note: The UI is already updated via firestore onSnapshot, so we don't necessarily
        // need to show a duplicate toast here. 
        // If we want to show a toast specifically from FCM, we can do it here.
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Unlock audio on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }
      
      // Play silent sound to unlock
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.01);
      } catch(e) {}

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

  // Monitor Schedule updates (users collection)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const newMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const prevMembers = prevMembersRef.current;
      
      if (prevMembers.length > 0) {
        newMembers.forEach(newMember => {
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
               triggerScheduleNotification(newMember);
             }
          }
        });
      }
      prevMembersRef.current = newMembers;
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Monitor Chat updates
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(collection(db, 'chatRooms'), where('members', 'array-contains', currentUser.uid || currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const room = { id: change.doc.id, ...change.doc.data() } as any;
          const oldRoom = prevRoomsRef.current.find(r => r.id === room.id);
          
          if (room.lastMessage && oldRoom) {
            const oldTime = oldRoom.lastMessage?.createdAt?.toMillis ? oldRoom.lastMessage.createdAt.toMillis() : 0;
            const newTime = room.lastMessage?.createdAt?.toMillis ? room.lastMessage.createdAt.toMillis() : 0;
            
            // Only trigger if it's a new message and I am not the sender
            if (newTime > oldTime && room.lastMessage.senderId !== (currentUser.uid || currentUser.id)) {
              triggerChatNotification(room);
            }
          }
        }
      });
      prevRoomsRef.current = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  const triggerScheduleNotification = (member: any) => {
    const settings = currentUser?.notifications || {};
    const mutedMembers = settings.mutedMembers || [];
    if (mutedMembers.includes(member.id)) return;

    const popupEnabled = settings.schedulePopupEnabled ?? settings.popupEnabled ?? true;
    const soundEnabled = settings.scheduleSoundEnabled ?? settings.soundEnabled ?? true;

    if (popupEnabled) {
      const title = `${member.name || 'メンバー'}さんが予定を更新しました`;
      showToast(title, 'schedule');
    }
    if (soundEnabled) playNotificationSound('schedule');
  };

  const triggerChatNotification = (room: any) => {
    const settings = currentUser?.notifications || {};
    const popupEnabled = settings.chatPopupEnabled ?? settings.popupEnabled ?? true;
    const soundEnabled = settings.chatSoundEnabled ?? settings.soundEnabled ?? true;

    // Optional: find sender name from prevMembersRef
    const sender = prevMembersRef.current.find(m => m.id === room.lastMessage.senderId);
    const senderName = sender ? sender.name : 'メンバー';

    if (popupEnabled) {
      const title = room.type === 'group' 
        ? `[${room.name}] ${senderName}: 新しいメッセージ`
        : `${senderName}さんから新着メッセージ`;
      
      showToast(title, 'chat');
    }
    if (soundEnabled) playNotificationSound('chat');
  };

  const showToast = (title: string, type: 'chat' | 'schedule') => {
    setToast({ title, type });
    setTimeout(() => setToast(null), 5000);
    
    // OS Native Notification if permitted and page is hidden
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(type === 'chat' ? '新着チャット' : 'スケジュール更新', { body: title });
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
          borderLeft: `4px solid ${toast.type === 'chat' ? '#10b981' : 'var(--status-office)'}`,
          animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {toast.type === 'chat' ? (
            <MessageSquare size={20} color="#10b981" />
          ) : (
            <Bell size={20} color="var(--status-office)" />
          )}
          <span style={{ fontWeight: 'bold' }}>{toast.title}</span>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
