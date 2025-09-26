import { chromium } from 'playwright';

async function testAnodeButton() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Anode Button Click\n');
  
  // Listen for ALL console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });
  
  try {
    console.log('Loading admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // Select service
    console.log('Selecting service...');
    const serviceBtn = await page.locator('#simpleServiceButtons button').first();
    await serviceBtn.click();
    await page.waitForTimeout(2000);
    
    // Try to click the anode button
    console.log('Looking for anode button...');
    const anodeBtn = await page.locator('button:has-text("Anodes")').first();
    
    if (await anodeBtn.isVisible()) {
      console.log('Found button, clicking...');
      await anodeBtn.click();
      await page.waitForTimeout(3000);
      
      // Check if section is visible
      const section = await page.$('#anodeSection');
      if (section) {
        const isVisible = await section.isVisible();
        console.log('Anode section visible:', isVisible);
        
        if (!isVisible) {
          // Check style
          const style = await section.getAttribute('style');
          console.log('Section style:', style);
        }
      } else {
        console.log('Anode section element not found!');
      }
    } else {
      console.log('Anode button not visible');
    }
    
    await page.screenshot({ path: 'anode-button-test.png' });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAnodeButton();