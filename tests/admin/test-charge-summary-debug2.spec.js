import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 },
  video: 'on'
});

test('Debug charge summary with real-time checks', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Monitor console
  page.on('console', msg => {
    if (msg.text().includes('adminApp') || msg.text().includes('currentServiceKey') || msg.text().includes('totalCost')) {
      console.log('Console:', msg.text());
    }
  });

  console.log('=== INITIAL STATE ===');
  let state = await page.evaluate(() => {
    return {
      adminApp: !!window.adminApp,
      currentServiceKey: window.currentServiceKey,
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      totalCostValue: document.getElementById('totalCost')?.value,
      chargeDetails: document.getElementById('chargeDetails')?.textContent?.trim()
    };
  });
  console.log(state);

  console.log('\n=== CLICKING SERVICE BUTTON ===');
  await page.click('button:has-text("Recurring Cleaning")');

  // Wait for wizard to be visible
  await page.waitForSelector('#wizardContainer', { state: 'visible' });
  await page.waitForTimeout(1000);

  console.log('\n=== AFTER CLICKING SERVICE ===');
  state = await page.evaluate(() => {
    return {
      currentServiceKey: window.currentServiceKey,
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      totalCostValue: document.getElementById('totalCost')?.value,
      wizardVisible: document.getElementById('wizardContainer')?.style.display === 'block',
      chargeDetails: document.getElementById('chargeDetails')?.textContent?.trim()
    };
  });
  console.log(state);

  // Wait for setInterval to sync (should happen within 500ms)
  await page.waitForTimeout(1500);

  console.log('\n=== AFTER SETINTERVAL SYNC (1.5s) ===');
  state = await page.evaluate(() => {
    return {
      currentServiceKey: window.currentServiceKey,
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      totalCostValue: document.getElementById('totalCost')?.value,
      chargeDetails: document.getElementById('chargeDetails')?.textContent?.trim()
    };
  });
  console.log(state);

  // Enter boat length to trigger price calculation
  console.log('\n=== ENTERING BOAT LENGTH ===');
  const boatLengthInput = page.locator('#wizardBoatLength');
  if (await boatLengthInput.isVisible()) {
    await boatLengthInput.fill('40');
    await boatLengthInput.press('Tab');
    console.log('Entered boat length: 40');
    await page.waitForTimeout(1000);
  }

  console.log('\n=== AFTER BOAT LENGTH ===');
  state = await page.evaluate(() => {
    return {
      boatLength: document.getElementById('boatLength')?.value,
      wizardBoatLength: document.getElementById('wizardBoatLength')?.value,
      totalCostValue: document.getElementById('totalCost')?.value,
      wizardTotalPrice: document.getElementById('wizardTotalPrice')?.textContent,
      chargeDetails: document.getElementById('chargeDetails')?.textContent?.trim()
    };
  });
  console.log(state);

  // Manually call updateChargeSummary
  console.log('\n=== MANUALLY CALLING updateChargeSummary ===');
  await page.evaluate(() => {
    if (window.adminApp && typeof window.adminApp.updateChargeSummary === 'function') {
      console.log('Calling adminApp.updateChargeSummary()');
      window.adminApp.updateChargeSummary();
    }
  });

  await page.waitForTimeout(1000);

  console.log('\n=== FINAL STATE ===');
  state = await page.evaluate(() => {
    return {
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      serviceData: window.serviceData ? Object.keys(window.serviceData) : [],
      totalCostValue: document.getElementById('totalCost')?.value,
      chargeDetails: document.getElementById('chargeDetails')?.textContent?.trim(),
      chargeDetailsHTML: document.getElementById('chargeDetails')?.innerHTML
    };
  });
  console.log(state);

  // Screenshot for verification
  await page.screenshot({ path: 'charge-summary-debug2.png', fullPage: true });

  // Keep browser open for manual inspection
  console.log('\n=== BROWSER OPEN FOR INSPECTION (15s) ===');
  await page.waitForTimeout(15000);
});