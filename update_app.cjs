const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const syncCode = `
  // Auto-sync Global Status from Schedules
  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.schedules) return;
    
    const checkAndSyncStatus = async () => {
      const now = new Date();
      // Format to YYYY-MM-DD and HH:MM
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const todayStr = \`\${year}-\${month}-\${date}\`;
      const timeStr = now.toTimeString().substring(0, 5);

      const activeSchedule = currentUser.schedules.find((s: any) => {
        const isToday = (s.date || '') <= todayStr && (s.endDate || s.date || '') >= todayStr;
        if (!isToday) return false;
        if (s.isAllDay) return true;
        // Check if current time is within schedule
        const start = typeof s.start === 'number' ? \`\${String(Math.floor(s.start)).padStart(2,'0')}:00\` : s.start || '00:00';
        let end = typeof s.end === 'number' ? \`\${String(Math.floor(s.end)).padStart(2,'0')}:00\` : s.end || '23:59';
        // Handle end time "24:00" which is not a valid time string but valid in logic
        if (end === '24:00') end = '23:59';
        
        return start <= timeStr && end > timeStr;
      });

      if (activeSchedule && activeSchedule.status && activeSchedule.status !== currentUser.status) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), { 
            status: activeSchedule.status,
            lastStatusUpdate: new Date().toISOString()
          }, { merge: true });
        } catch(e) {}
      }
    };

    // Check immediately then every minute
    checkAndSyncStatus();
    const interval = setInterval(checkAndSyncStatus, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);
`;

content = content.replace('const handleLogout = async () => {', syncCode + '\n  const handleLogout = async () => {');

fs.writeFileSync('src/App.tsx', content);
console.log('done');
