/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

1: import { useState, useEffect } from 'react';
2: import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
3: import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
4: import { db } from '../lib/firebase';
5: 
6: const branches = ['全体', '本社', '三宅工場', '坪井工場', '大阪営業所', '福岡営業所', '横浜営業所'];
7: 
8: const getStatusLabel = (status: string) => {
9:   const map: Record<string, string> = {
10:     office: '出社',
11:     biztrip: '出張',
12:     out: '外出',
13:     meeting: '会議',
14:     away: '離席',
15:     offline: '退勤'
16:   };
17:   return map[status] || status;
18: };
19: 
20: const timeToNum = (timeStr: string) => {
21:   const [h, m] = timeStr.split(':').map(Number);
22:   return h + (m / 60);
23: };
24: 
25: const numToTime = (num: number) => {
26:   const h = Math.floor(num);
27:   const m = Math.round((num - h) * 60);
28:   return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
29: };
30: 
31: export default function TeamCalendar({ currentUser }: { currentUser: any }) {
32:   const today = new Date();
33:   const todayFormatted = today.toISOString().split('T')[0];
34:   const todayDisplay = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
35: 
36:   const [members, setMembers] = useState<any[]>([]);
37:   const [selectedBranch, setSelectedBranch] = useState('全体');
38:   const [isModalOpen, setIsModalOpen] = useState(false);
39:   const [editingScheduleId, setEditingScheduleId] = useState<number | string | null>(null);
40:   const [modalData, setModalData] = useState({ title: '', date: todayFormatted, start: '09:00', end: '10:00', color: 'blue' });
41: 
42:   // Subscribe to real-time users data
43:   useEffect(() => {
44:     const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
45:       const usersData = snapshot.docs.map(doc => ({
46:         id: doc.id,
47:         ...doc.data(),
48:         schedules: doc.data().schedules || [] // Initialize empty schedules if none
49:       }));
50:       setMembers(usersData);
51:     });
52:     const renderDayView = () => {
53:     const renderDayView = () => {
54:     return (
55:       <div className=\"timeline-grid glass-panel\">
56:         <div className=\"timeline-header-row\">
57:           <div className=\"timeline-header-cell\">メンバー</div>
58:           <div className=\"timeline-time-slots\">
59:             {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
60:               <div key={t} className=\"time-slot-header\">{t}</div>
