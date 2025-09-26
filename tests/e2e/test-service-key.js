import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[Console]: ${msg.text()}`);
  });
  
  console.log('Testing service key issue...\n');
  
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  // Load customers and select one
  await page.click('button:has-text("Show Recent")');
  await page.waitForTimeout(2000);
  await page.locator('.customer-item').first().click();
  
  console.log('\n1. Initial state:');
  let state = await page.evaluate(() => {
    return {
      selectedServiceKey_window: window.selectedServiceKey,
      selectedServiceKey_type: typeof window.selectedServiceKey
    };
  });
  console.log(state);
  
  console.log('\n2. Clicking Item Recovery...');
  await page.click('[data-service-key="item_recovery"]');
  await page.waitForTimeout(1000);
  
  console.log('\n3. After clicking:');
  state = await page.evaluate(() => {
    return {
      selectedServiceKey_window: window.selectedServiceKey,
      selectedServiceKey_type: typeof window.selectedServiceKey
    };
  });
  console.log(state);
  
  console.log('\n4. Testing direct call to selectService:');
  const directResult = await page.evaluate(() => {
    // Call selectService directly
    window.selectService('item_recovery');
    
    return {
      after_direct_call: window.selectedServiceKey
    };
  });
  console.log(directResult);
  
  await page.waitForTimeout(2000);
  await browser.close();
})();