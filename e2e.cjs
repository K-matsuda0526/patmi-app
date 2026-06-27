const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    executablePath: 'C:\\Users\\MIYAKE12\\.cache\\puppeteer\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Check if login page or dashboard
    let content = await page.content();
    if (content.includes('ログイン') || content.includes('メールアドレス')) {
      console.log('At login page, logging in...');
      const isRegistering = await page.$$eval('a', links => {
          const link = links.find(l => l.textContent.includes('アカウントを作'));
          if (link) { link.click(); return true; }
          return false;
      });
      if (isRegistering) {
        await new Promise(r => setTimeout(r, 500));
        await page.type('input[type="text"]', 'テストユーザー'); // use input type text
      }

      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'password123');
      
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to appear
      await page.waitForFunction(() => {
        return document.body.innerText.includes('タイムライン');
      }, { timeout: 10000 });
      console.log('Logged in successfully');
    } else {
      console.log('Already logged in or bypassed');
    }

    console.log('Testing Calendar Navigation...');
    await new Promise(r => setTimeout(r, 2000)); // wait for calendar data
    
    // Click week view
    const clickedWeek = await page.$$eval('button', btns => {
        const btn = btns.find(b => b.textContent.includes('週'));
        if (btn) { btn.click(); return true; }
        return false;
    });
    if (clickedWeek) {
      await new Promise(r => setTimeout(r, 1000));
      console.log('Clicked Week view');
    } else {
      console.log('Week btn not found');
    }

    // Check month view
    const clickedMonth = await page.$$eval('button', btns => {
        const btn = btns.find(b => b.textContent.includes('月'));
        if (btn) { btn.click(); return true; }
        return false;
    });
    if (clickedMonth) {
      await new Promise(r => setTimeout(r, 1000));
      console.log('Clicked Month view');
    } else {
      console.log('Month btn not found');
    }
    
    // Add Schedule Button
    const clickedAdd = await page.$$eval('button', btns => {
        const btn = btns.find(b => b.textContent.includes('予定追加'));
        if (btn) { btn.click(); return true; }
        return false;
    });
    if (clickedAdd) {
      await new Promise(r => setTimeout(r, 1000));
      console.log('Clicked Add Schedule');
      
      // Try to type a title
      const titleInput = await page.$('input[placeholder="例: 定例ミーティング"]');
      if (titleInput) {
        await titleInput.type('E2E Test Meeting');
        console.log('Typed schedule title');
        
        // Save
        const clickedSave = await page.$$eval('button', btns => {
            const btn = btns.find(b => b.textContent.includes('保存する'));
            if (btn) { btn.click(); return true; }
            return false;
        });
        if (clickedSave) {
          console.log('Clicked Save');
          await new Promise(r => setTimeout(r, 1000));
        }
      } else {
         console.log('Modal title input not found');
      }
    } else {
      console.log('Add Schedule btn not found');
    }

    // Go to Settings
    const clickedSettings = await page.$$eval('div', divs => {
        const div = divs.find(d => d.textContent.includes('設定'));
        if (div) { div.click(); return true; }
        return false;
    });
    if (clickedSettings) {
      await new Promise(r => setTimeout(r, 500));
      console.log('Navigated to Settings');
      
      // Try toggling notification
      const toggles = await page.$$('input[type="checkbox"]');
      if (toggles.length > 0) {
         await toggles[0].click();
         console.log('Toggled a notification setting');
         await new Promise(r => setTimeout(r, 500));
      }
    } else {
      console.log('Settings btn not found');
    }
    
    console.log('Test completed successfully!');
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await browser.close();
  }
})();
