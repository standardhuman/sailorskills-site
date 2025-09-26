const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    console.log(`${type.toUpperCase()}: ${text}`);
  });
  
  // Collect errors
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });
  
  // Navigate to the page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  // Search for and select Brian
  await page.fill('#customerSearch', 'Brian');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(1000);
  
  // Select first customer
  const customerItems = await page.locator('.customer-item');
  if (await customerItems.count() > 0) {
    await customerItems.first().click();
    console.log('Selected customer');
  }
  
  // Select one-time cleaning to show boat config
  await page.click('[data-service-key="onetime_cleaning"]');
  await page.waitForTimeout(500);
  
  // Check if boat config section is visible
  const boatConfigVisible = await page.locator('#boatConfigSection').isVisible();
  console.log('Boat config section visible:', boatConfigVisible);
  
  // Check for hull type options
  const hullTypes = await page.locator('input[name="hull_type"]').count();
  console.log('Hull type options found:', hullTypes);
  
  // Check for twin engines checkbox
  const twinEnginesExists = await page.locator('#has_twin_engines').count() > 0;
  console.log('Twin engines checkbox exists:', twinEnginesExists);
  
  // Take screenshot
  await page.screenshot({ path: 'charge-customer-state.png', fullPage: true });
  
  // Print all console errors
  console.log('\n=== Console Errors ===');
  consoleMessages.filter(m => m.type === 'error').forEach(m => {
    console.log('ERROR:', m.text);
  });
  
  await browser.close();
})();