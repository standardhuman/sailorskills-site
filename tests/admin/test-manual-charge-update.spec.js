import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

test('Manually set adminApp.currentServiceKey and test charge summary', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for modules to load

  console.log('=== INITIAL CHECK ===');
  let check = await page.evaluate(() => {
    return {
      adminApp: typeof window.adminApp,
      currentServiceKey: window.adminApp?.currentServiceKey,
      updateChargeSummary: typeof window.adminApp?.updateChargeSummary
    };
  });
  console.log(check);

  console.log('\n=== MANUALLY SETTING SERVICE KEY ===');
  await page.evaluate(() => {
    if (window.adminApp) {
      window.adminApp.currentServiceKey = 'recurring_cleaning';
      window.currentServiceKey = 'recurring_cleaning';

      // Set boat length
      const boatLengthEl = document.getElementById('boatLength');
      if (boatLengthEl) boatLengthEl.value = '40';

      // Set total cost
      const totalCostEl = document.getElementById('totalCost');
      if (totalCostEl) totalCostEl.value = '180'; // 40ft * 4.50

      // Call updateChargeSummary
      if (typeof window.adminApp.updateChargeSummary === 'function') {
        window.adminApp.updateChargeSummary();
      }
    }
  });

  await page.waitForTimeout(1000);

  console.log('\n=== AFTER MANUAL UPDATE ===');
  const result = await page.evaluate(() => {
    const chargeDetails = document.getElementById('chargeDetails');
    const chargeButton = document.getElementById('chargeButton');

    return {
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      chargeDetailsText: chargeDetails?.textContent?.trim(),
      chargeDetailsHTML: chargeDetails?.innerHTML,
      chargeButtonDisabled: chargeButton?.disabled,
      totalCostValue: document.getElementById('totalCost')?.value
    };
  });
  console.log(result);

  // Check if charge summary shows the service
  if (result.chargeDetailsText) {
    console.log('\nCharge summary content:', result.chargeDetailsText);
    expect(result.chargeDetailsText).toContain('Recurring Cleaning');
  }

  await page.waitForTimeout(10000); // Keep browser open
});