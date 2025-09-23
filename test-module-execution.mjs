import { chromium } from 'playwright';

async function testModule() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Module') || text.includes('renderConsolidatedForm')) {
      console.log('Console:', text);
    }
  });
  
  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });
  
  try {
    console.log('Loading admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);
    
    console.log('\nAll console logs:');
    logs.forEach(log => console.log(' -', log));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testModule();