import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, Smile, MoreVertical, CheckCheck, MessageSquare, Users, Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import NewGroupModal from './NewGroupModal';
import NewChatModal from './NewChatModal';
import { UserPlus } from 'lucide-react';

export default function Chat({ currentUser, initialTargetUserId }: { currentUser: any, initialTargetUserId?: string | null }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Cache for user details (avatar, name)
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  // 1. Fetch all users to build cache
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const cache: Record<string, any> = {};
      snapshot.forEach(doc => {
        cache[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUserCache(cache);
    };
    fetchUsers();
  }, []);

  // 2. Fetch or auto-create direct message rooms for all users
  useEffect(() => {
    if (!currentUser?.uid || Object.keys(userCache).length === 0) return;

    // First, query existing rooms where user is a member (Removed orderBy to avoid composite index requirement)
    const q = query(
      collection(db, 'chatRooms'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let fetchedRooms = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      
      // Sort rooms by updatedAt descending in memory
      fetchedRooms.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setRooms(fetchedRooms);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, userCache]);

  // Handle initialTargetUserId when navigating from Directory
  useEffect(() => {
    if (!initialTargetUserId || rooms.length === 0 || !currentUser?.uid) return;
    
    // Check if room exists
    const existingRoom = rooms.find(r => r.type === 'direct' && r.members.includes(initialTargetUserId));
    if (existingRoom) {
      setSelectedRoom(existingRoom);
    } else {
      // Room doesn't exist, create it
      handleCreateChat(initialTargetUserId);
    }
  }, [initialTargetUserId, rooms.length, currentUser?.uid]);

  // 3. Fetch messages when a room is selected
  useEffect(() => {
    if (!selectedRoom?.id) return;
    
    const q = query(
      collection(db, `chatRooms/${selectedRoom.id}/messages`),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setMessages(msgs);
      
      // Auto scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Mark as read (add self to readBy array)
      msgs.forEach(msg => {
        if (msg.senderId !== currentUser?.uid && (!msg.readBy || !msg.readBy.includes(currentUser?.uid))) {
          const msgRef = doc(db, `chatRooms/${selectedRoom.id}/messages`, msg.id);
          const newReadBy = msg.readBy ? [...msg.readBy, currentUser?.uid] : [currentUser?.uid];
          updateDoc(msgRef, { readBy: newReadBy }).catch(e => console.error(e));
        }
      });
    });
    
    return () => unsubscribe();
  }, [selectedRoom?.id, currentUser?.uid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedRoom) return;
    
    const msgText = message.trim();
    setMessage('');
    
    try {
      // Add message
      await addDoc(collection(db, `chatRooms/${selectedRoom.id}/messages`), {
        text: msgText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        readBy: []
      });
      
      // Update room lastMessage
      await updateDoc(doc(db, 'chatRooms', selectedRoom.id), {
        lastMessage: {
          text: msgText,
          senderId: currentUser.uid,
          createdAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error sending message", e);
    }
  };

  const handleCreateGroup = async (name: string, selectedMembers: string[]) => {
    try {
      const members = [...selectedMembers, currentUser.uid];
      await addDoc(collection(db, 'chatRooms'), {
        type: 'group',
        name,
        members,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null
      });
      setShowNewGroup(false);
    } catch (e) {
      console.error("Error creating group", e);
    }
  };

  const handleCreateChat = async (userId: string) => {
    try {
      const dmId1 = `${currentUser.uid}_${userId}`;
      
      // Check if room already exists
      const existingRoom = rooms.find(r => r.type === 'direct' && r.members.includes(userId));
      
      if (existingRoom) {
        setSelectedRoom(existingRoom);
        setShowNewChat(false);
        return;
      }

      await setDoc(doc(db, 'chatRooms', dmId1), {
        type: 'direct',
        members: [currentUser.uid, userId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null
      }, { merge: true });
      
      setShowNewChat(false);
      // Let the snapshot handle adding it to the list, then we can select it
      // For immediate feedback we could set selected room here
    } catch (e) {
      console.error("Error creating chat", e);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    if (!window.confirm('このチャットを削除してもよろしいですか？（相手の画面からも消える場合があります）')) return;

    try {
      await deleteDoc(doc(db, 'chatRooms', selectedRoom.id));
      setSelectedRoom(null);
    } catch (e) {
      console.error("Error deleting room", e);
    }
  };

  // Helper to get room display info
  const getRoomDisplay = (room: any) => {
    if (room.type === 'group') {
      return { name: room.name, avatar: null, isGroup: true, isOnline: false };
    } else {
      const otherUid = room.members.find((id: string) => id !== currentUser?.uid);
      const otherUser = userCache[otherUid] || { name: 'Unknown', isOnline: false };
      return { name: otherUser.name, avatar: otherUser.avatar, isGroup: false, isOnline: otherUser.isOnline };
    }
  };

  return (
    <div className="chat-container glass-panel" style={{ display: 'flex', height: 'calc(100vh - 40px)', overflow: 'hidden', padding: 0 }}>
      {/* Sidebar - Chat List */}
      <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-sidebar)' }}>トーク</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="icon-btn" onClick={() => setShowNewChat(true)} title="新しいチャット" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sidebar)' }}>
              <UserPlus size={20} />
            </button>
            <button className="icon-btn" onClick={() => setShowNewGroup(true)} title="新規グループ" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sidebar)' }}>
              <Users size={20} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.map(room => {
            const display = getRoomDisplay(room);
            return (
              <div 
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                style={{ 
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: selectedRoom?.id === room.id ? 'var(--active-bg)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ position: 'relative' }}>
                  {display.isGroup ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} />
                    </div>
                  ) : display.avatar ? (
                    <img src={display.avatar} alt={display.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="dir-avatar-placeholder bg-blue" style={{ width: '40px', height: '40px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3b82f6' }}>
                      {display.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  {!display.isGroup && display.isOnline && (
                    <span className="online-indicator" style={{ position: 'absolute', bottom: '0px', right: '0px', width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', border: '2px solid var(--bg-sidebar)' }}></span>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-sidebar)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {display.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {room.lastMessage ? room.lastMessage.text : 'まだメッセージはありません'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-body)' }}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-sidebar)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(() => {
                  const display = getRoomDisplay(selectedRoom);
                  return (
                    <>
                      {display.isGroup ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={18} />
                        </div>
                      ) : display.avatar ? (
                        <img src={display.avatar} alt={display.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div className="dir-avatar-placeholder bg-blue" style={{ width: '36px', height: '36px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3b82f6' }}>
                          {display.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{display.name}</div>
                    </>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="icon-btn" 
                  onClick={handleDeleteRoom}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="チャットを削除"
                >
                  <Trash2 size={18} />
                </button>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', margin: '16px 0' }}>
                  メッセージはまだありません
                </div>
              )}
              
              {messages.map(msg => {
                const isMine = msg.senderId === currentUser?.uid;
                const sender = userCache[msg.senderId] || { name: 'Unknown' };
                const readCount = msg.readBy ? msg.readBy.length : 0;
                
                return (
                  <div key={msg.id} style={{ display: 'flex', gap: '12px', maxWidth: '70%', alignSelf: isMine ? 'flex-end' : 'flex-start', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    {!isMine && (
                      sender.avatar ? (
                        <img src={sender.avatar} alt={sender.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div className="dir-avatar-placeholder bg-blue" style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3b82f6' }}>
                          {sender.name?.charAt(0) || 'U'}
                        </div>
                      )
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {!isMine && `${sender.name} • `}
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ 
                          backgroundColor: isMine ? '#10b981' : '#ffffff', 
                          color: isMine ? 'white' : 'var(--text-main)', 
                          padding: '12px 16px', 
                          borderRadius: isMine ? '16px 0 16px 16px' : '0 16px 16px 16px', 
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
                          fontSize: '15px', 
                          lineHeight: '1.5', 
                          fontWeight: 500,
                          border: isMine ? 'none' : '1px solid var(--border-color)'
                        }}>
                          {msg.text}
                        </div>
                        {isMine && readCount > 0 && (
                          <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                            既読 <CheckCheck size={14} color="#10b981" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <button type="button" className="icon-btn" style={{ padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} title="ファイルを添付">
                  <Paperclip size={20} />
                </button>
                <button type="button" className="icon-btn" style={{ padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} title="画像を添付">
                  <ImageIcon size={20} />
                </button>
                <div style={{ flex: 1, backgroundColor: 'var(--bg-body)', borderRadius: '24px', padding: '8px 16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="メッセージを入力..." 
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px', color: 'var(--text-main)' }}
                  />
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    <Smile size={20} />
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={!message.trim()}
                  style={{ 
                    backgroundColor: message.trim() ? '#10b981' : 'var(--border-color)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '40px', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: message.trim() ? 'pointer' : 'default',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <Send size={18} style={{ marginLeft: '2px' }} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>チャット</h3>
            <p>左側のリストからチャット相手を選択してください</p>
          </div>
        )}
      </div>

      {showNewGroup && (
        <NewGroupModal 
          onClose={() => setShowNewGroup(false)} 
          onCreate={handleCreateGroup} 
          currentUser={currentUser} 
        />
      )}
      {showNewChat && (
        <NewChatModal 
          onClose={() => setShowNewChat(false)} 
          onCreate={handleCreateChat} 
          currentUser={currentUser} 
        />
      )}
    </div>
  );
}
