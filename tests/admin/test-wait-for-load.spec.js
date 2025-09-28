import { test, expect } from '@playwright/test';

test('Wait for modules to load then test', async ({ page }) => {
  // Navigate to admin page
  await page.goto('http://localhost:3000/admin/admin.html');

  // Wait for modules to load
  await page.waitForFunction(() => {
    return typeof window.renderConsolidatedForm === 'function';
  }, { timeout: 10000 }).catch(e => {
    console.log('renderConsolidatedForm never loaded');
  });

  // Check what's available after waiting
  const functionsAfterWait = await page.evaluate(() => {
    return {
      selectServiceDirect: typeof window.selectServiceDirect,
      renderConsolidatedForm: typeof window.renderConsolidatedForm,
      adminApp: typeof window.adminApp,
      updateWizardPricing: typeof window.updateWizardPricing,
      calculateCost: typeof window.calculateCost
    };
  });
  console.log('Functions after waiting:', functionsAfterWait);

  // Now try clicking a button
  const recurringBtn = page.locator('button:has-text("Recurring Cleaning")');
  await recurringBtn.click();
  await page.waitForTimeout(1000);

  // Check wizard state
  const wizardState = await page.evaluate(() => {
    const container = document.getElementById('wizardContainer');
    const content = document.getElementById('wizardContent');
    return {
      containerDisplay: container ? window.getComputedStyle(container).display : 'not found',
      hasContent: content ? content.innerHTML.length > 0 : false,
      currentServiceKey: window.currentServiceKey
    };
  });
  console.log('Wizard state after click:', wizardState);

  // Take screenshot
  await page.screenshot({ path: 'admin-test-screenshot.png' });
});