import { useState, useEffect } from 'react';
import { X, Save, UserPlus, Users, Edit2 } from 'lucide-react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GroupSettingsModalProps {
  room: any;
  currentUser: any;
  onClose: () => void;
}

export default function GroupSettingsModal({ room, currentUser, onClose }: GroupSettingsModalProps) {
  const [groupName, setGroupName] = useState(room.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(users.filter(u => u.id !== currentUser.uid));
    };
    fetchUsers();
  }, [currentUser]);

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === room.name) {
      setIsEditingName(false);
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'chatRooms', room.id), {
        name: groupName.trim()
      });
      setIsEditingName(false);
    } catch (e) {
      console.error(e);
      alert('グループ名の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    setLoading(true);
    try {
      const newMembers = [...new Set([...room.members, ...selectedNewMembers])];
      
      const newUnreadCount = { ...room.unreadCount };
      selectedNewMembers.forEach(m => {
        if (newUnreadCount[m] === undefined) {
          newUnreadCount[m] = 0;
        }
      });

      await updateDoc(doc(db, 'chatRooms', room.id), {
        members: newMembers,
        unreadCount: newUnreadCount
      });
      setSelectedNewMembers([]);
      alert('メンバーを追加しました');
    } catch (e) {
      console.error(e);
      alert('メンバーの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    if (selectedNewMembers.includes(userId)) {
      setSelectedNewMembers(selectedNewMembers.filter(id => id !== userId));
    } else {
      setSelectedNewMembers([...selectedNewMembers, userId]);
    }
  };

  // Filter out existing members
  const availableUsers = allUsers.filter(u => !room.members.includes(u.id));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Users size={20} color="var(--accent-green)" /> グループ設定
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>グループ名</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
              disabled={!isEditingName || loading}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: isEditingName ? 'var(--bg-body)' : 'var(--bg-sidebar)', color: 'var(--text-main)' }} 
            />
            {isEditingName ? (
              <button onClick={handleUpdateName} disabled={loading} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                <Save size={16} />
              </button>
            ) : (
              <button onClick={() => setIsEditingName(true)} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px' }}>
                <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>メンバーを追加</label>
          {availableUsers.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>追加できるメンバーがいません</div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '16px', backgroundColor: 'var(--bg-body)' }}>
              {availableUsers.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <input 
                    type="checkbox" 
                    id={`user-${user.id}`} 
                    checked={selectedNewMembers.includes(user.id)}
                    onChange={() => toggleMemberSelection(user.id)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor={`user-${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="bg-blue" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 'bold' }}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-main)' }}>{user.name}</span>
                  </label>
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={handleAddMembers} 
            disabled={selectedNewMembers.length === 0 || loading}
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', opacity: selectedNewMembers.length === 0 ? 0.5 : 1 }}
          >
            <UserPlus size={18} />
            選択したメンバーを追加
          </button>
        </div>
      </div>
    </div>
  );
}
