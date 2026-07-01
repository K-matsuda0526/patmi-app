import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function NewChatModal({ 
  onClose, 
  onCreate, 
  currentUser 
}: { 
  onClose: () => void, 
  onCreate: (userId: string) => void,
  currentUser: any 
}) {
  const [users, setUsers] = useState<any[]>([]);
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

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>新しいチャットを始める</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="input-group-vertical">
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px' }}>
              <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="社員を名前で検索..."
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', color: 'var(--text-main)' }}
              />
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>該当するユーザーがいません</div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => onCreate(user.id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                      cursor: 'pointer', borderRadius: '8px', borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--active-bg)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="dir-avatar-placeholder bg-blue" style={{ width: '40px', height: '40px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3b82f6' }}>
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{user.name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}