import { useState, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Smile, MoreVertical, CheckCheck, MessageSquare } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Chat({ currentUser }: { currentUser: any }) {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Load members for chat list
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== currentUser?.uid);
      setMembers(usersData);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: Send message to Firebase
    setMessage('');
  };

  return (
    <div className="chat-container glass-panel" style={{ display: 'flex', height: 'calc(100vh - 40px)', overflow: 'hidden', padding: 0 }}>
      {/* Sidebar - Chat List */}
      <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-sidebar)' }}>トーク</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {members.map(member => (
            <div 
              key={member.id}
              onClick={() => setSelectedUser(member)}
              style={{ 
                padding: '16px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: selectedUser?.id === member.id ? 'var(--accent-blue)' : 'transparent',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ position: 'relative' }}>
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="dir-avatar-placeholder bg-blue" style={{ width: '40px', height: '40px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: '#3b82f6' }}>
                    {member.name?.charAt(0) || 'U'}
                  </div>
                )}
                {member.isOnline && (
                  <span className="online-indicator" style={{
                    position: 'absolute', bottom: '0px', right: '0px', width: '10px', height: '10px',
                    backgroundColor: '#10b981', borderRadius: '50%', border: '2px solid #fff'
                  }}></span>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-sidebar)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{member.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  メッセージのプレビュー...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-body)' }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-sidebar)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="dir-avatar-placeholder bg-blue" style={{ width: '36px', height: '36px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: '#3b82f6' }}>
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedUser.name}</div>
              </div>
              <div>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={20} color="var(--text-muted)" /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', margin: '16px 0' }}>
                ここからメッセージの履歴です
              </div>
              {/* Dummy Message - Received */}
              <div style={{ display: 'flex', gap: '12px', maxWidth: '70%' }}>
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div className="dir-avatar-placeholder bg-blue" style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: '#3b82f6' }}>
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedUser.name} • 10:42</div>
                  <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '0 16px 16px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.5', fontWeight: 500 }}>
                    よろしくお願いします！チャット機能のベースを作成しました。
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2px 6px', fontSize: '12px', marginTop: '-12px', zIndex: 1, alignSelf: 'flex-start', marginLeft: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    👍 <span style={{ color: 'var(--text-muted)' }}>1</span>
                  </div>
                </div>
              </div>

              {/* Dummy Message - Sent */}
              <div style={{ display: 'flex', gap: '12px', maxWidth: '70%', alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>10:45</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 16px', borderRadius: '16px 0 16px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.5', fontWeight: 500 }}>
                      確認しました。LINEのような画面デザインですね！
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                      既読 <CheckCheck size={14} color="#10b981" />
                    </div>
                  </div>
                </div>
              </div>
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
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '14px' }}
                  />
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    <Smile size={20} />
                  </button>
                </div>
                <button 
                  type="submit" 
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
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <MessageSquare size={32} />
            </div>
            <h3>メッセージ</h3>
            <p>左側のリストからチャットする相手を選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
