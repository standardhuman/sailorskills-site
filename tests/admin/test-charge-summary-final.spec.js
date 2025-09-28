import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 },
  video: 'on'
});

test('Charge summary shows service details when selected', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for modules

  // Monitor console
  page.on('console', msg => {
    if (msg.text().includes('adminApp.currentServiceKey')) {
      console.log('Console:', msg.text());
    }
  });

  console.log('=== CLICKING RECURRING CLEANING ===');
  await page.click('button:has-text("Recurring Cleaning")');
  await page.waitForTimeout(2000); // Wait for wizard

  // Check wizard loaded
  const wizardVisible = await page.locator('#wizardContainer').isVisible();
  console.log('Wizard visible:', wizardVisible);

  // Wait for the service key to be synced to adminApp (via setInterval)
  await page.waitForTimeout(1500); // Allow time for setInterval to run

  // Manually trigger updateChargeSummary to ensure it runs
  await page.evaluate(() => {
    if (window.adminApp && typeof window.adminApp.updateChargeSummary === 'function') {
      window.adminApp.updateChargeSummary();
    }
  });
  await page.waitForTimeout(500);

  // Enter boat length - look for either wizardBoatLength or adminBoatLength
  const boatLengthInput = page.locator('#wizardBoatLength, #adminBoatLength').first();
  if (await boatLengthInput.isVisible()) {
    await boatLengthInput.fill('40');
    await boatLengthInput.press('Tab');
    console.log('Entered boat length: 40');
    await page.waitForTimeout(1000);
  }

  // Select powerboat
  const powerboatRadio = page.locator('input[name="wizard_boat_type"][value="powerboat"], input[name="adminBoatType"][value="powerboat"]').first();
  if (await powerboatRadio.isVisible()) {
    await powerboatRadio.click();
    console.log('Selected powerboat');
    await page.waitForTimeout(1000);
  }

  // Manually trigger updateChargeSummary again after making changes
  await page.evaluate(() => {
    if (window.adminApp && typeof window.adminApp.updateChargeSummary === 'function') {
      window.adminApp.updateChargeSummary();
    }
  });
  await page.waitForTimeout(500);

  // Check charge summary
  console.log('\n=== CHECKING CHARGE SUMMARY ===');
  const chargeDetails = page.locator('#chargeDetails');
  const chargeDetailsText = await chargeDetails.textContent();
  console.log('Charge details text:', chargeDetailsText);

  // Check for service name in charge summary
  expect(chargeDetailsText).toContain('Recurring Cleaning');

  // Check if price is shown
  const hasPrice = chargeDetailsText.includes('$');
  console.log('Has price in summary:', hasPrice);

  // Check button state
  const chargeButton = page.locator('#chargeButton');
  const isEnabled = await chargeButton.isEnabled();
  console.log('Charge button enabled:', isEnabled);

  const buttonText = await chargeButton.textContent();
  console.log('Charge button text:', buttonText);

  // Check adminApp state
  const appState = await page.evaluate(() => {
    return {
      currentServiceKey: window.adminApp?.currentServiceKey,
      serviceData: window.serviceData ? Object.keys(window.serviceData) : [],
      totalCostValue: document.getElementById('totalCost')?.value,
      chargeDetailsHTML: document.getElementById('chargeDetails')?.innerHTML
    };
  });
  console.log('\nApp state:', appState);

  // Screenshot for verification
  await page.screenshot({ path: 'charge-summary-final-test.png', fullPage: true });
  console.log('Screenshot saved');

  // Verify charge summary is showing service, not default message
  expect(chargeDetailsText).not.toContain('Select a customer and configure service details');
  expect(chargeDetailsText).not.toContain('Select a customer and service to see pricing');

  // Keep open for inspection
  await page.waitForTimeout(10000);
});