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
  
  // Set boat length to 30 (simpler calculation)
  await page.fill('#boatLength', '30');
  
  // Select monohull (no surcharge)
  await page.click('input[name="hull_type"][value="monohull"]');
  
  // Uncheck twin engines (no surcharge)
  const twinEngines = await page.locator('#has_twin_engines');
  if (await twinEngines.isChecked()) {
    await twinEngines.uncheck();
  }
  
  // Wait for cleaning options to be visible
  await page.waitForSelector('#cleaningOptions', { timeout: 5000 });
  
  // Select MISSING paint (15% surcharge) and minimal growth (0% surcharge)
  await page.selectOption('#actualPaintCondition', 'missing');
  await page.selectOption('#actualGrowthLevel', 'minimal');
  
  // Wait for calculation
  await page.waitForTimeout(1000);
  
  // Get the cost breakdown text from the pre element
  const costBreakdown = await page.locator('pre#costBreakdown').textContent();
  console.log('\n=== Cost Breakdown (Missing Paint + Minimal Growth) ===');
  console.log(costBreakdown);
  
  // Get the total
  const total = await page.locator('#totalCostDisplay').textContent();
  console.log('\n=== Total ===');
  console.log(total);
  
  console.log('\n=== Calculation Verification ===');
  console.log('Base: $6/ft × 30ft = $180');
  console.log('Missing paint: 15% surcharge = $27');
  console.log('Minimal growth: 0% surcharge');
  console.log('Expected subtotal: $207');
  console.log('Expected total (rounded to nearest $10): $210');
  
  // Check that dropdown now shows all 5 options
  const paintOptions = await page.locator('#actualPaintCondition option').allTextContents();
  console.log('\n=== Paint Condition Options ===');
  console.log(paintOptions);
  
  // Check that "Estimate" is not in the breakdown
  const hasEstimate = costBreakdown.includes('Estimate');
  console.log('\n=== Contains "Estimate"? ===');
  console.log(hasEstimate ? 'YES (should be removed)' : 'NO (correct)');
  
  await browser.close();
})();