/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { Bell, Shield, User, UploadCloud, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';

export default function Settings({ currentUser }: { currentUser: any }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    mobile: currentUser?.mobile || '',
    branch: currentUser?.branch || '',
    title: currentUser?.title || ''
  });

  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleNotificationToggle = async (key: 'soundEnabled' | 'popupEnabled', value: boolean) => {
    if (!currentUser?.uid) return;
    const currentSettings = currentUser.notifications || {};
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        notifications: { ...currentSettings, [key]: value }
      }, { merge: true });
    } catch (e) {
      console.error('設定の保存に失敗しました', e);
    }
  };

  const handleMemberMuteToggle = async (memberId: string, isMuted: boolean) => {
    if (!currentUser?.uid) return;
    const currentSettings = currentUser.notifications || {};
    let newMutedMembers = currentSettings.mutedMembers || [];
    
    if (isMuted) {
      if (!newMutedMembers.includes(memberId)) newMutedMembers.push(memberId);
    } else {
      newMutedMembers = newMutedMembers.filter((id: string) => id !== memberId);
    }
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        notifications: { ...currentSettings, mutedMembers: newMutedMembers }
      }, { merge: true });
    } catch (e) {
      console.error('設定の保存に失敗しました', e);
    }
  };


  const handleSave = async () => {
    if (currentUser?.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          ...formData
        }, { merge: true });
        setIsEditing(false);
        alert('プロフィールを保存しました');
      } catch (e) {
        console.error(e);
        alert('保存に失敗しました');
      }
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas ctx null'));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', 0.6); // 60% quality jpeg
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!currentUser?.uid) return;
    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'users', currentUser.uid), { avatar: url }, { merge: true });
      alert('アバター画像を更新しました！');
    } catch (e) {
      console.error(e);
      alert('画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAvatarUpload(e.target.files[0]);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPass !== passwordData.confirm) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }
    if (passwordData.newPass.length < 6) {
      setPasswordError('新しいパスワードは6文字以上で入力してください');
      return;
    }
    setPasswordError('');
    setIsChangingPassword(true);

    try {
      if (!auth.currentUser || !auth.currentUser.email) throw new Error("ユーザー情報の取得に失敗しました");
      
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordData.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, passwordData.newPass);
      
      alert('パスワードを変更しました');
      setIsPasswordModalOpen(false);
      setPasswordData({ current: '', newPass: '', confirm: '' });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/invalid-credential') {
        setPasswordError('現在のパスワードが間違っています');
      } else {
        setPasswordError('パスワードの変更に失敗しました');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  return (
    <div className="settings-container">
      <header className="settings-header">
        <h2>設定</h2>
      </header>

      <div className="settings-content">
        <div className="settings-section glass-panel">
          <div className="settings-section-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} />
              <h3>プロフィール設定</h3>
            </div>
            {isEditing ? (
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }} onClick={handleSave}>
                <Save size={14} /> 保存する
              </button>
            ) : (
              <button className="settings-btn" onClick={() => setIsEditing(true)}>情報を編集する</button>
            )}
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <div className="settings-label">表示名</div>
              <div className="settings-value">
                {isEditing ? (
                  <input type="text" className="search-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                ) : (
                  formData.name || '未設定'
                )}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">携帯番号</div>
              <div className="settings-value">
                {isEditing ? (
                  <input type="text" className="search-input" placeholder="090-0000-0000" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                ) : (
                  formData.mobile || '未設定'
                )}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">営業所</div>
              <div className="settings-value">
                {isEditing ? (
                  <select className="search-input" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                    <option value="">選択してください</option>
                    <option value="本社">本社</option>
                    <option value="三宅工場">三宅工場</option>
                    <option value="坪井工場">坪井工場</option>
                    <option value="大阪営業所">大阪営業所</option>
                    <option value="福岡営業所">福岡営業所</option>
                    <option value="横浜営業所">横浜営業所</option>
                  </select>
                ) : (
                  formData.branch || '未設定'
                )}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">役職</div>
              <div className="settings-value">
                {isEditing ? (
                  <input type="text" className="search-input" placeholder="例: マネージャー" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                ) : (
                  formData.title || '未設定'
                )}
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">アバター画像</div>
              <div className="settings-value" style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="dir-avatar-placeholder bg-blue" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div 
                  className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleAvatarUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  style={{ cursor: 'pointer', opacity: isUploading ? 0.5 : 1, pointerEvents: isUploading ? 'none' : 'auto' }}
                >
                  <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleFileChange} />
                  <UploadCloud size={32} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                  <p>{isUploading ? 'アップロード中...' : 'ここに画像をドラッグ＆ドロップ'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>またはクリックして選択</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section glass-panel">
          <div className="settings-section-header">
            <Bell size={18} />
            <h3>リアルタイム通知設定</h3>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <div className="settings-label">ポップアップ通知を表示する</div>
              <div className="settings-value">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={currentUser?.notifications?.popupEnabled !== false} 
                    onChange={e => handleNotificationToggle('popupEnabled', e.target.checked)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">通知音を鳴らす</div>
              <div className="settings-value">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={currentUser?.notifications?.soundEnabled !== false} 
                    onChange={e => handleNotificationToggle('soundEnabled', e.target.checked)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="settings-label" style={{ marginBottom: '16px' }}>メンバー個別設定（この人の更新だけ通知を受け取るか）</div>
              <div className="settings-value" style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  {members.filter(m => m.id !== currentUser?.uid).map(member => {
                    const isMuted = (currentUser?.notifications?.mutedMembers || []).includes(member.id);
                    return (
                      <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {member.avatar ? (
                            <img src={member.avatar} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="dir-avatar-placeholder bg-blue" style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                              {member.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span>{member.name}</span>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={!isMuted} 
                            onChange={e => handleMemberMuteToggle(member.id, !e.target.checked)} 
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    );
                  })}
                  {members.length <= 1 && <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>他のメンバーがいません</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section glass-panel">
          <div className="settings-section-header">
            <Shield size={18} />
            <h3>セキュリティ</h3>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <div className="settings-label">パスワード</div>
              <div className="settings-value">********</div>
              <button className="settings-btn" onClick={() => setIsPasswordModalOpen(true)}>変更</button>
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>パスワード変更</h3>
              <button className="icon-btn" onClick={() => { setIsPasswordModalOpen(false); setPasswordError(''); setPasswordData({ current: '', newPass: '', confirm: '' }); }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {passwordError && <div style={{ color: 'var(--status-meeting)', fontSize: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>{passwordError}</div>}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>現在のパスワード</label>
                <input 
                  type="password" 
                  className="search-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={passwordData.current} 
                  onChange={e => setPasswordData({...passwordData, current: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>新しいパスワード</label>
                <input 
                  type="password" 
                  className="search-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={passwordData.newPass} 
                  onChange={e => setPasswordData({...passwordData, newPass: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>新しいパスワード（確認用）</label>
                <input 
                  type="password" 
                  className="search-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={passwordData.confirm} 
                  onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setIsPasswordModalOpen(false); setPasswordError(''); setPasswordData({ current: '', newPass: '', confirm: '' }); }}>キャンセル</button>
              <button className="btn btn-primary" onClick={handlePasswordChange} disabled={isChangingPassword || !passwordData.current || !passwordData.newPass || !passwordData.confirm}>
                {isChangingPassword ? '変更中...' : 'パスワードを変更する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
