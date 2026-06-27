/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { useState } from 'react';
import { Lock, User, Mail, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('パスワード再設定用のメールを送信しました。メールボックスをご確認ください。');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('このメールアドレスは登録されていません。');
      } else {
        setError('エラーが発生しました: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email.trim() || !password.trim()) {
      setError('必須項目を入力してください。');
      return;
    }
    
    setLoading(true);
    try {
      if (isRegistering) {
        if (!name.trim()) {
          setError('名前を入力してください。');
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name: name,
          branch: '東京営業所', // Default
          title: 'メンバー', // Default
          status: 'office',
          emails: [email],
          uid: userCred.user.uid,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが間違っています。');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に登録されています。');
      } else {
        setError('認証エラー: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isResetting) {
    return (
      <div className="login-container">
        <div className="login-box glass-panel">
          <div className="login-logo" style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '32px', letterSpacing: '-1px' }}>Patmi</div>
          <p className="login-subtitle">パスワードの再設定</p>
          
          <form onSubmit={handleResetPassword} className="login-form">
            {error && <div className="login-error">{error}</div>}
            {message && <div style={{ background: 'rgba(46, 204, 113, 0.2)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{message}</div>}
            
            <div className="input-group">
              <div className="input-icon"><Mail size={16} /></div>
              <input 
                type="email" 
                placeholder="登録済みのメールアドレス" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '送信中...' : '再設定メールを送信'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
              <a href="#" style={{ color: 'var(--text-main)' }} onClick={(e) => { e.preventDefault(); setIsResetting(false); setError(''); setMessage(''); }}>
                ログイン画面に戻る
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box glass-panel">
        <div className="login-logo" style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: '32px', letterSpacing: '-1px' }}>Patmi</div>
        <p className="login-subtitle">スケジュール管理</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          {isRegistering && (
            <div className="input-group">
              <div className="input-icon"><User size={16} /></div>
              <input 
                type="text" 
                placeholder="氏名 (例: 山田 太郎)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <div className="input-icon"><Mail size={16} /></div>
            <input 
              type="email" 
              placeholder="メールアドレス" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group" style={{ position: 'relative' }}>
            <div className="input-icon"><Lock size={16} /></div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="パスワード (6文字以上)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '処理中...' : (isRegistering ? 'アカウント作成' : 'ログイン')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="#" style={{ color: 'var(--text-main)' }} onClick={(e) => { e.preventDefault(); setIsRegistering(!isRegistering); setError(''); }}>
              {isRegistering ? 'すでにアカウントをお持ちですか？ ログイン' : 'はじめてですか？ アカウントを作成'}
            </a>
            {!isRegistering && (
              <a href="#" style={{ color: 'var(--text-muted)' }} onClick={(e) => { e.preventDefault(); setIsResetting(true); setError(''); }}>
                パスワードをお忘れですか？
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
