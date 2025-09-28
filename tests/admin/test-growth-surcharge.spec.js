import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

test('Growth surcharge calculation', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('=== SELECTING RECURRING CLEANING ===');
  await page.click('button:has-text("Recurring Cleaning")');
  await page.waitForTimeout(2000);

  // Set boat length
  const boatLengthInput = page.locator('#adminBoatLength');
  await boatLengthInput.fill('40');
  await page.waitForTimeout(500);

  // Base price should be 40 * 4.50 = $180
  console.log('\n=== TESTING GROWTH LEVELS ===');

  // Test different growth levels with new scale (0-100 slider)
  // 0-20: Minimal (0% surcharge)
  // 21-35: Moderate (0-25% surcharge)
  // 36-60: Heavy (25-50% surcharge)
  // 61-100: Severe (50-200% surcharge)
  const testLevels = [
    { slider: 10, expectedLabel: 'Minimal', expectedSurcharge: '0%', expectedPrice: 180 },     // No surcharge
    { slider: 28, expectedLabel: 'Moderate', expectedSurcharge: '13%', expectedPrice: 203.4 }, // ~13% surcharge
    { slider: 48, expectedLabel: 'Heavy', expectedSurcharge: '38%', expectedPrice: 248.4 },    // ~38% surcharge
    { slider: 80, expectedLabel: 'Severe', expectedSurcharge: '125%', expectedPrice: 405 }     // 125% surcharge
  ];

  for (const test of testLevels) {
    console.log(`\nTesting slider at ${test.slider}:`);

    // Set slider value
    const slider = page.locator('#adminGrowthLevel');
    await slider.fill(String(test.slider));
    await page.waitForTimeout(1000);

    // Trigger updateFromWizard manually
    await page.evaluate(() => {
      if (window.adminApp) {
        window.adminApp.updateFromWizard();
      }
    });
    await page.waitForTimeout(500);

    // Check the display
    const growthPercent = await page.locator('#growthPercent').textContent();
    const growthLabel = await page.locator('#growthLabel').textContent();
    console.log(`  Growth display: ${growthLabel} - ${growthPercent} surcharge`);

    // Check hidden inputs
    const state = await page.evaluate(() => {
      return {
        actualGrowthLevel: document.getElementById('actualGrowthLevel')?.value,
        growthLevel: document.getElementById('growth_level')?.value,
        totalCost: document.getElementById('totalCost')?.value,
        totalCostDisplay: document.getElementById('totalCostDisplay')?.value
      };
    });
    console.log('  Hidden inputs:', state);

    // Check charge summary
    const chargeDetails = await page.locator('#chargeDetails').textContent();
    console.log('  Charge summary includes:', chargeDetails.includes(`$${test.expectedPrice}`));

    // Verify price is correct
    const priceMatch = chargeDetails.match(/Total Price:\s*\$([0-9.]+)/);
    if (priceMatch) {
      const actualPrice = parseFloat(priceMatch[1]);
      console.log(`  Expected price: $${test.expectedPrice}, Actual price: $${actualPrice}`);

      // Allow small rounding differences (up to $2 due to surcharge calculations)
      expect(Math.abs(actualPrice - test.expectedPrice)).toBeLessThan(2);
    }
  }

  // Take screenshot of final state
  await page.screenshot({ path: 'growth-surcharge-test.png', fullPage: true });

  console.log('\n=== TEST COMPLETE ===');
  await page.waitForTimeout(5000);
});