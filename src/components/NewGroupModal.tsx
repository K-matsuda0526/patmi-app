import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function NewGroupModal({ 
  onClose, 
  onCreate, 
  currentUser 
}: { 
  onClose: () => void, 
  onCreate: (name: string, members: string[]) => void,
  currentUser: any 
}) {
  const [name, setName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== currentUser?.uid);
      setUsers(usersData);
    };
    fetchUsers();
  }, [currentUser?.uid]);

  const toggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedUsers.length === 0) return;
    onCreate(name.trim(), selectedUsers);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新規グループ作成</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="input-group-vertical">
            <label>グループ名</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="開発チーム など"
              required
            />
          </div>
          
          <div className="input-group-vertical">
            <label>メンバーを選択 ({selectedUsers.length}名選択中)</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' }}>
              <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="名前で検索..."
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', color: 'var(--text-main)' }}
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => toggleUser(user.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer', borderRadius: '6px', backgroundColor: selectedUsers.includes(user.id) ? 'var(--active-bg)' : 'transparent' }}
                >
                  <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="dir-avatar-placeholder bg-blue" style={{ width: '28px', height: '28px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3b82f6' }}>
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span style={{ fontSize: '14px' }}>{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || selectedUsers.length === 0}>
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}