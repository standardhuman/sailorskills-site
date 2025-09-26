import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    console.log('Console:', msg.type(), '-', msg.text());
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  console.log('Navigating to admin page...');
  await page.goto('http://localhost:3000/admin.html');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Check if functions exist in window
  const functionsExist = await page.evaluate(() => {
    return {
      selectWizardPaintCondition: typeof window.selectWizardPaintCondition,
      selectWizardGrowthLevel: typeof window.selectWizardGrowthLevel,
      calculateCost: typeof window.calculateCost,
      updateChargeSummary: typeof window.updateChargeSummary,
      updateWizardPricing: typeof window.updateWizardPricing
    };
  });

  console.log('\nFunction availability:');
  Object.entries(functionsExist).forEach(([func, type]) => {
    console.log(`  ${func}: ${type}`);
  });

  console.log('\nSelecting One-time Cleaning service...');
  await page.evaluate(() => {
    const button = document.querySelector('.service-option[data-service-key="onetime_cleaning"]');
    if (button) {
      button.click();
      return true;
    }
    return false;
  });

  await page.waitForTimeout(1000);

  // Click again to enter wizard
  console.log('Entering wizard...');
  await page.evaluate(() => {
    const button = document.querySelector('.service-option[data-service-key="onetime_cleaning"]');
    if (button) {
      button.click();
      return true;
    }
    return false;
  });

  await page.waitForTimeout(2000);

  // Check if wizard is visible
  const wizardVisible = await page.evaluate(() => {
    const wizard = document.getElementById('wizardContainer');
    return wizard ? window.getComputedStyle(wizard).display !== 'none' : false;
  });
  console.log('Wizard visible:', wizardVisible);

  if (wizardVisible) {
    // Set boat length
    console.log('\nSetting boat length to 40...');
    await page.evaluate(() => {
      const input = document.getElementById('wizardBoatLength');
      if (input) {
        input.value = '40';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    });

    await page.waitForTimeout(1000);

    // Test paint condition button directly
    console.log('\nTesting paint condition "poor"...');
    const paintResult = await page.evaluate(() => {
      const results = {};

      // Check if function exists
      results.functionExists = typeof window.selectWizardPaintCondition === 'function';

      // Try to call the function
      if (results.functionExists) {
        try {
          window.selectWizardPaintCondition('poor');
          results.functionCalled = true;
        } catch (e) {
          results.error = e.message;
          results.functionCalled = false;
        }
      }

      // Check if button is selected
      const button = document.querySelector('#wizardPaintConditionButtons button[data-value="poor"]');
      results.buttonExists = !!button;
      if (button) {
        results.buttonSelected = button.classList.contains('selected');
      }

      // Check hidden input value
      const hiddenInput = document.getElementById('wizardPaintCondition');
      results.hiddenValue = hiddenInput ? hiddenInput.value : null;

      // Check pricing display
      const costBreakdown = document.getElementById('wizardCostBreakdown');
      results.costBreakdownText = costBreakdown ? costBreakdown.textContent : null;

      const totalPrice = document.getElementById('wizardTotalPrice');
      results.totalPriceText = totalPrice ? totalPrice.textContent : null;

      // Check hidden cost elements
      const hiddenBreakdown = document.getElementById('costBreakdown');
      results.hiddenBreakdownText = hiddenBreakdown ? hiddenBreakdown.textContent : null;

      const hiddenTotal = document.getElementById('totalCostDisplay');
      results.hiddenTotalText = hiddenTotal ? hiddenTotal.textContent : null;

      return results;
    });

    console.log('Paint condition test results:', paintResult);

    await page.waitForTimeout(1000);

    // Test growth level button
    console.log('\nTesting growth level "heavy"...');
    const growthResult = await page.evaluate(() => {
      const results = {};

      // Check if function exists
      results.functionExists = typeof window.selectWizardGrowthLevel === 'function';

      // Try to call the function
      if (results.functionExists) {
        try {
          window.selectWizardGrowthLevel('heavy');
          results.functionCalled = true;
        } catch (e) {
          results.error = e.message;
          results.functionCalled = false;
        }
      }

      // Check if button is selected
      const button = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
      results.buttonExists = !!button;
      if (button) {
        results.buttonSelected = button.classList.contains('selected');
      }

      // Check hidden input value
      const hiddenInput = document.getElementById('wizardGrowthLevel');
      results.hiddenValue = hiddenInput ? hiddenInput.value : null;

      // Check pricing after 500ms
      setTimeout(() => {
        const costBreakdown = document.getElementById('wizardCostBreakdown');
        console.log('After 500ms - Cost breakdown:', costBreakdown ? costBreakdown.textContent : 'Not found');

        const totalPrice = document.getElementById('wizardTotalPrice');
        console.log('After 500ms - Total price:', totalPrice ? totalPrice.textContent : 'Not found');
      }, 500);

      return results;
    });

    console.log('Growth level test results:', growthResult);
  }

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();