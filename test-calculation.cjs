const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
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
  
  // Select one-time cleaning 
  await page.click('[data-service-key="onetime_cleaning"]');
  await page.waitForTimeout(1000); // Wait for boat config to show
  
  // Set boat length to 55
  await page.fill('#boatLength', '55');
  
  // Select catamaran
  await page.click('input[name="hull_type"][value="catamaran"]');
  
  // Check twin engines
  await page.check('#has_twin_engines');
  
  // Wait for cleaning options to be visible
  await page.waitForSelector('#cleaningOptions', { timeout: 5000 });
  
  // Select good paint condition (within 6 months) - target the visible one
  await page.selectOption('#cleaningOptions #lastPaintedTime', '0-6_months');
  
  // Select recent cleaning (within 2 months) - target the visible one
  await page.selectOption('#cleaningOptions #lastCleanedTime', '0-2_months');
  
  // Wait for calculation
  await page.waitForTimeout(1000);
  
  // Get the cost breakdown text from the pre element
  const costBreakdown = await page.locator('pre#costBreakdown').textContent();
  console.log('\n=== Cost Breakdown ===');
  console.log(costBreakdown);
  
  // Get the total
  const total = await page.locator('#totalCostDisplay').textContent();
  console.log('\n=== Total ===');
  console.log(total);
  
  // Get the charge amount
  const chargeAmount = await page.locator('#editableAmount').inputValue();
  console.log('\n=== Charge Amount ===');
  console.log('$' + chargeAmount);
  
  // Take screenshot
  await page.screenshot({ path: 'test-55-catamaran-twin.png', fullPage: true });
  
  console.log('\n=== Calculation Verification ===');
  console.log('Base: $6/ft × 55ft = $330');
  console.log('Catamaran surcharge: +25% = $82.50');
  console.log('Twin engines surcharge: +10% = $33.00');
  console.log('Expected subtotal: $445.50');
  console.log('Good paint (0% surcharge)');
  console.log('Minimal growth (0% surcharge)');
  console.log('Expected total: $445.50');
  
  await browser.close();
})();