import { test, expect } from '@playwright/test';

test.describe('Debug Service Buttons', () => {
  test('Check service button clicks and functions', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin/admin.html');
    await page.waitForLoadState('networkidle');

    // Add console listener to capture errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Check if selectServiceDirect function exists
    const functionsExist = await page.evaluate(() => {
      return {
        selectServiceDirect: typeof window.selectServiceDirect,
        renderConsolidatedForm: typeof window.renderConsolidatedForm,
        updatePricing: typeof window.updatePricing,
        updateChargeSummary: typeof window.updateChargeSummary,
        adminApp: typeof window.adminApp
      };
    });
    console.log('Functions availability:', functionsExist);

    // Test Recurring Cleaning button
    console.log('\n=== Testing Recurring Cleaning Button ===');
    const recurringBtn = page.locator('button:has-text("Recurring Cleaning")');
    await expect(recurringBtn).toBeVisible();

    // Check onclick attribute
    const recurringOnclick = await recurringBtn.getAttribute('onclick');
    console.log('Recurring Cleaning onclick:', recurringOnclick);

    // Click and check for errors
    await recurringBtn.click();
    await page.waitForTimeout(1000);

    // Check if service was selected
    const recurringSelected = await page.evaluate(() => {
      return {
        currentServiceKey: window.currentServiceKey,
        wizardVisible: document.getElementById('wizardContainer')?.style.display !== 'none',
        wizardContent: document.getElementById('wizardContent')?.innerHTML?.substring(0, 100)
      };
    });
    console.log('After Recurring click:', recurringSelected);

    // Test One-Time Cleaning button
    console.log('\n=== Testing One-Time Cleaning Button ===');
    const onetimeBtn = page.locator('button:has-text("One-Time Cleaning")');
    await expect(onetimeBtn).toBeVisible();

    const onetimeOnclick = await onetimeBtn.getAttribute('onclick');
    console.log('One-Time Cleaning onclick:', onetimeOnclick);

    await onetimeBtn.click();
    await page.waitForTimeout(1000);

    const onetimeSelected = await page.evaluate(() => {
      return {
        currentServiceKey: window.currentServiceKey,
        wizardVisible: document.getElementById('wizardContainer')?.style.display !== 'none',
        wizardContent: document.getElementById('wizardContent')?.innerHTML?.substring(0, 100)
      };
    });
    console.log('After One-Time click:', onetimeSelected);

    // Test Underwater Inspection button
    console.log('\n=== Testing Underwater Inspection Button ===');
    const underwaterBtn = page.locator('button:has-text("Underwater Inspection")');
    await expect(underwaterBtn).toBeVisible();

    const underwaterOnclick = await underwaterBtn.getAttribute('onclick');
    console.log('Underwater Inspection onclick:', underwaterOnclick);

    await underwaterBtn.click();
    await page.waitForTimeout(1000);

    const underwaterSelected = await page.evaluate(() => {
      return {
        currentServiceKey: window.currentServiceKey,
        wizardVisible: document.getElementById('wizardContainer')?.style.display !== 'none',
        wizardContent: document.getElementById('wizardContent')?.innerHTML?.substring(0, 100)
      };
    });
    console.log('After Underwater click:', underwaterSelected);

    // Check all script loading
    const scriptsLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => ({
        src: s.src,
        type: s.type,
        hasContent: s.innerHTML?.length > 0
      }));
      return scripts;
    });
    console.log('\nLoaded scripts:', scriptsLoaded);

    // Check for JavaScript errors in admin-wizard.js
    const wizardModuleCheck = await page.evaluate(() => {
      return {
        hasRenderConsolidatedForm: typeof window.renderConsolidatedForm === 'function',
        hasUpdateWizardPricing: typeof window.updateWizardPricing === 'function',
        hasCalculateCost: typeof window.calculateCost === 'function'
      };
    });
    console.log('\nWizard module functions:', wizardModuleCheck);
  });
});