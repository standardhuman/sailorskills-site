import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('calculateCost') || msg.text().includes('selectedServiceKey')) {
      console.log(`[Console]: ${msg.text()}`);
    }
  });
  
  console.log('Manual Test Steps:\n');
  console.log('Step 1: Navigate to http://localhost:3000/charge-customer.html');
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'manual-step1-loaded.png' });
  
  console.log('Step 2: Click "Show Recent" button');
  await page.click('button:has-text("Show Recent")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'manual-step2-recent.png' });
  
  console.log('Step 3: Click on Brian (standardhuman@gmail.com)');
  const customers = await page.locator('.customer-item').all();
  for (const customer of customers) {
    const email = await customer.locator('.customer-email').textContent();
    if (email.includes('standardhuman@gmail.com')) {
      await customer.click();
      break;
    }
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'manual-step3-brian-selected.png' });
  
  console.log('Step 4: Click on "Item Recovery" service');
  await page.click('[data-service-key="item_recovery"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'manual-step4-service-selected.png' });
  
  console.log('\nStep 5: Check the current state');
  const state = await page.evaluate(() => {
    return {
      selectedServiceKey: window.selectedServiceKey,
      totalCostDisplay: document.getElementById('totalCostDisplay')?.textContent,
      chargeButton: document.getElementById('chargeButton')?.textContent,
      chargeDetailsHTML: document.getElementById('chargeDetails')?.innerHTML
    };
  });
  
  console.log('Current state:');
  console.log('- selectedServiceKey:', state.selectedServiceKey);
  console.log('- totalCostDisplay:', state.totalCostDisplay);
  console.log('- chargeButton:', state.chargeButton);
  
  if (state.totalCostDisplay === '$0' || state.totalCostDisplay === '$0.00') {
    console.log('\n❌ ISSUE: Total is still $0. Trying to manually trigger updateChargeSummary...');
    
    await page.evaluate(() => {
      if (window.updateChargeSummary) {
        window.updateChargeSummary();
      }
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'manual-step5-after-update.png' });
    
    const newState = await page.evaluate(() => {
      return {
        totalCostDisplay: document.getElementById('totalCostDisplay')?.textContent,
        chargeButton: document.getElementById('chargeButton')?.textContent
      };
    });
    
    console.log('\nAfter manual updateChargeSummary:');
    console.log('- totalCostDisplay:', newState.totalCostDisplay);
    console.log('- chargeButton:', newState.chargeButton);
  } else {
    console.log('\n✅ SUCCESS: Charge amount is displayed correctly!');
    await page.screenshot({ path: 'manual-success.png' });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Screenshots saved:');
  console.log('- manual-step1-loaded.png');
  console.log('- manual-step2-recent.png');
  console.log('- manual-step3-brian-selected.png');
  console.log('- manual-step4-service-selected.png');
  console.log('- manual-step5-after-update.png (if needed)');
  console.log('- manual-success.png (if successful)');
  
  await page.waitForTimeout(5000); // Keep browser open for inspection
  await browser.close();
})();