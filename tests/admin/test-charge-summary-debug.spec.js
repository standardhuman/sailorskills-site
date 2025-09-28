import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 },
  video: 'on'
});

test('Debug charge summary not updating', async ({ page }) => {
  // Navigate to admin page
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');

  // Monitor ALL console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Monitor errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  console.log('\n=== INITIAL STATE ===');

  // Check if AdminApp exists
  const adminAppCheck = await page.evaluate(() => {
    return {
      adminAppExists: typeof window.adminApp !== 'undefined',
      adminAppType: typeof window.adminApp,
      hasUpdateChargeSummary: window.adminApp && typeof window.adminApp.updateChargeSummary === 'function',
      currentServiceKey: window.adminApp?.currentServiceKey,
      windowCurrentServiceKey: window.currentServiceKey
    };
  });
  console.log('AdminApp check:', adminAppCheck);

  // Check if updateChargeSummary is properly defined
  const functionCheck = await page.evaluate(() => {
    return {
      updateChargeSummary: typeof window.updateChargeSummary,
      calculateCost: typeof window.calculateCost,
      updateWizardPricing: typeof window.updateWizardPricing
    };
  });
  console.log('Function check:', functionCheck);

  // Check charge summary elements
  const elementsCheck = await page.evaluate(() => {
    return {
      chargeDetails: document.getElementById('chargeDetails') !== null,
      chargeButton: document.getElementById('chargeButton') !== null,
      totalCost: document.getElementById('totalCost') !== null,
      totalCostDisplay: document.getElementById('totalCostDisplay') !== null,
      boatLength: document.getElementById('boatLength') !== null
    };
  });
  console.log('Elements check:', elementsCheck);

  console.log('\n=== CLICKING RECURRING CLEANING ===');

  // Click Recurring Cleaning
  await page.click('button:has-text("Recurring Cleaning")');
  await page.waitForTimeout(1000);

  // Check service key after click
  const afterClickCheck = await page.evaluate(() => {
    return {
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      windowServiceKey: window.currentServiceKey,
      serviceData: window.serviceData ? Object.keys(window.serviceData) : []
    };
  });
  console.log('After click check:', afterClickCheck);

  // Check if wizard loaded
  const wizardCheck = await page.evaluate(() => {
    const wizardContainer = document.getElementById('wizardContainer');
    const wizardContent = document.getElementById('wizardContent');
    return {
      containerVisible: wizardContainer ? getComputedStyle(wizardContainer).display : 'not found',
      hasContent: wizardContent ? wizardContent.innerHTML.length > 0 : false,
      boatLengthInput: document.getElementById('wizardBoatLength') !== null
    };
  });
  console.log('Wizard check:', wizardCheck);

  console.log('\n=== ENTERING BOAT LENGTH ===');

  // Enter boat length
  const boatLengthInput = page.locator('#wizardBoatLength');
  if (await boatLengthInput.isVisible()) {
    await boatLengthInput.fill('40');
    await boatLengthInput.press('Tab'); // Trigger change event
    await page.waitForTimeout(1000);

    // Check if values updated
    const afterBoatLength = await page.evaluate(() => {
      return {
        hiddenBoatLength: document.getElementById('boatLength')?.value,
        totalCostValue: document.getElementById('totalCost')?.value,
        totalCostDisplayValue: document.getElementById('totalCostDisplay')?.value,
        wizardPriceText: document.getElementById('wizardTotalPrice')?.textContent
      };
    });
    console.log('After boat length:', afterBoatLength);
  }

  console.log('\n=== MANUALLY CALLING UPDATE FUNCTIONS ===');

  // Try manually calling update functions
  const manualUpdate = await page.evaluate(() => {
    const results = {};

    // Try updateWizardPricing
    if (typeof window.updateWizardPricing === 'function') {
      try {
        window.updateWizardPricing();
        results.wizardPricingCalled = true;
      } catch (e) {
        results.wizardPricingError = e.message;
      }
    }

    // Try updateChargeSummary
    if (typeof window.updateChargeSummary === 'function') {
      try {
        window.updateChargeSummary();
        results.chargeSummaryCalled = true;
      } catch (e) {
        results.chargeSummaryError = e.message;
      }
    }

    // Check charge details content
    const chargeDetails = document.getElementById('chargeDetails');
    results.chargeDetailsContent = chargeDetails ? chargeDetails.textContent.trim() : 'not found';

    // Check if charge button enabled
    const chargeButton = document.getElementById('chargeButton');
    results.chargeButtonEnabled = chargeButton ? !chargeButton.disabled : false;

    return results;
  });
  console.log('Manual update results:', manualUpdate);

  console.log('\n=== CHECKING FINAL STATE ===');

  // Final state check
  const finalState = await page.evaluate(() => {
    return {
      chargeDetailsHTML: document.getElementById('chargeDetails')?.innerHTML,
      chargeButtonDisabled: document.getElementById('chargeButton')?.disabled,
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      serviceDataKeys: window.serviceData ? Object.keys(window.serviceData) : [],
      totalCostValue: document.getElementById('totalCost')?.value,
      boatLengthValue: document.getElementById('boatLength')?.value
    };
  });
  console.log('Final state:', finalState);

  // Take screenshot
  await page.screenshot({ path: 'charge-summary-debug.png', fullPage: true });
  console.log('Screenshot saved as charge-summary-debug.png');

  // Keep browser open for manual inspection
  console.log('\n=== Browser will remain open for 20 seconds for inspection ===');
  await page.waitForTimeout(20000);
});