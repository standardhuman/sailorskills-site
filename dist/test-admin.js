import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to admin page...');
  await page.goto('http://localhost:3000/admin.html');

  // Wait for page to load
  await page.waitForTimeout(2000);

  console.log('Selecting One-time Cleaning service...');
  // Click on One-time Cleaning service
  const cleaningButton = page.locator('.service-option[data-service-key="onetime_cleaning"]');
  await cleaningButton.click();
  await page.waitForTimeout(1000);

  // Click again to enter wizard
  console.log('Entering wizard by clicking service again...');
  await cleaningButton.click();
  await page.waitForTimeout(2000);

  // Check if wizard is visible
  const wizardContainer = page.locator('#wizardContainer');
  const isWizardVisible = await wizardContainer.isVisible();
  console.log('Wizard visible:', isWizardVisible);

  // Enter boat length
  console.log('Setting boat length to 40...');
  await page.fill('#wizardBoatLength', '40');
  await page.waitForTimeout(500);

  // Test paint condition buttons
  console.log('\nTesting paint condition buttons...');
  const paintConditions = ['excellent', 'good', 'fair', 'poor', 'missing'];

  for (const condition of paintConditions) {
    console.log(`\nClicking ${condition} paint condition...`);
    const paintButton = page.locator(`#wizardPaintConditionButtons button[data-value="${condition}"]`);

    // Check if button exists
    const exists = await paintButton.count() > 0;
    if (!exists) {
      console.log(`  ❌ Button for ${condition} not found!`);
      continue;
    }

    await paintButton.click();
    await page.waitForTimeout(1000);

    // Check if button is selected
    const isSelected = await paintButton.evaluate(el => el.classList.contains('selected'));
    console.log(`  Button selected: ${isSelected}`);

    // Check pricing display
    const pricingBreakdown = await page.locator('#wizardCostBreakdown').textContent();
    const totalPrice = await page.locator('#wizardTotalPrice').textContent();
    console.log(`  Breakdown: ${pricingBreakdown ? pricingBreakdown.substring(0, 50) + '...' : 'Empty'}`);
    console.log(`  Total: ${totalPrice}`);

    // Check charge summary
    const chargeDetails = await page.locator('#chargeDetails').textContent();
    console.log(`  Charge summary: ${chargeDetails ? chargeDetails.substring(0, 50) + '...' : 'Empty'}`);
  }

  // Test growth level buttons
  console.log('\n\nTesting growth level buttons...');
  const growthLevels = ['minimal', 'moderate', 'heavy', 'severe'];

  for (const level of growthLevels) {
    console.log(`\nClicking ${level} growth level...`);
    const growthButton = page.locator(`#wizardGrowthLevelButtons button[data-value="${level}"]`);

    // Check if button exists
    const exists = await growthButton.count() > 0;
    if (!exists) {
      console.log(`  ❌ Button for ${level} not found!`);
      continue;
    }

    await growthButton.click();
    await page.waitForTimeout(1000);

    // Check if button is selected
    const isSelected = await growthButton.evaluate(el => el.classList.contains('selected'));
    console.log(`  Button selected: ${isSelected}`);

    // Check pricing display
    const pricingBreakdown = await page.locator('#wizardCostBreakdown').textContent();
    const totalPrice = await page.locator('#wizardTotalPrice').textContent();
    console.log(`  Breakdown: ${pricingBreakdown ? pricingBreakdown.substring(0, 50) + '...' : 'Empty'}`);
    console.log(`  Total: ${totalPrice}`);

    // Check hidden cost elements
    const costBreakdown = await page.locator('#costBreakdown').textContent();
    const totalCostDisplay = await page.locator('#totalCostDisplay').textContent();
    console.log(`  Hidden breakdown: ${costBreakdown ? costBreakdown.substring(0, 50) + '...' : 'Empty'}`);
    console.log(`  Hidden total: ${totalCostDisplay}`);
  }

  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open for inspection
  await page.waitForTimeout(300000);
})();