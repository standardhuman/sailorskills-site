import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing main calculator...');
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000); // Wait for JS to populate buttons
  
  // Take screenshot
  await page.screenshot({ path: 'main-calculator-buttons.png', fullPage: true });
  
  // Check if buttons exist
  const buttonCount = await page.locator('#serviceButtons .service-option').count();
  console.log(`Found ${buttonCount} service buttons on main calculator`);
  
  if (buttonCount === 0) {
    console.log('ERROR: No service buttons found!');
    // Check console errors
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.log('Page error:', error.message));
    await page.reload();
    await page.waitForTimeout(2000);
  }
  
  console.log('\nTesting charge customer page...');
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(3000); // Wait longer for module loading
  
  // Take screenshot
  await page.screenshot({ path: 'charge-customer-buttons.png', fullPage: true });
  
  // Check if serviceButtons element exists
  const serviceButtonsEl = await page.locator('#serviceButtons').count();
  console.log(`serviceButtons element exists: ${serviceButtonsEl > 0}`);
  
  const chargeButtonCount = await page.locator('#serviceButtons .service-option').count();
  console.log(`Found ${chargeButtonCount} service buttons on charge customer page`);
  
  await browser.close();
})();