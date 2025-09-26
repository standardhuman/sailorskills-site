import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Console:', msg.text());
    }
  });

  console.log('Navigating to admin page...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(2000);

  // Set up the service and enter wizard
  console.log('\nSetting up One-time Cleaning service...');
  await page.evaluate(() => {
    // Set the service key directly
    window.selectedServiceKey = 'onetime_cleaning';
    console.log('Set selectedServiceKey to:', window.selectedServiceKey);

    // Call selectServiceDirect twice to enter wizard
    if (window.selectServiceDirect) {
      window.selectServiceDirect('onetime_cleaning');
      setTimeout(() => window.selectServiceDirect('onetime_cleaning'), 500);
    }
  });

  await page.waitForTimeout(2000);

  // Set boat length and test calculations
  console.log('\nTesting pricing calculations directly...');
  const result = await page.evaluate(() => {
    const results = {};

    // Set boat length
    const boatLengthInput = document.getElementById('wizardBoatLength');
    if (boatLengthInput) {
      boatLengthInput.value = '40';
      boatLengthInput.dispatchEvent(new Event('input', { bubbles: true }));
      results.boatLength = boatLengthInput.value;
    }

    // Check if calculateCost exists and call it
    results.calculateCostExists = typeof window.calculateCost === 'function';
    if (window.calculateCost) {
      console.log('Calling calculateCost...');
      window.calculateCost();
    }

    // Check the hidden elements
    const costBreakdown = document.getElementById('costBreakdown');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    results.hiddenBreakdown = costBreakdown ? costBreakdown.textContent : 'Not found';
    results.hiddenTotal = totalCostDisplay ? totalCostDisplay.textContent : 'Not found';

    // Check wizard display elements
    const wizardBreakdown = document.getElementById('wizardCostBreakdown');
    const wizardTotal = document.getElementById('wizardTotalPrice');
    results.wizardBreakdown = wizardBreakdown ? wizardBreakdown.textContent : 'Not found';
    results.wizardTotal = wizardTotal ? wizardTotal.textContent : 'Not found';

    // Check service data
    results.serviceData = window.serviceData ? Object.keys(window.serviceData) : [];
    results.selectedServiceKey = window.selectedServiceKey;

    // Try to get the actual service object
    if (window.serviceData && window.selectedServiceKey) {
      results.currentService = window.serviceData[window.selectedServiceKey];
    }

    return results;
  });

  console.log('\nInitial calculation result:', JSON.stringify(result, null, 2));

  // Now test different paint conditions
  console.log('\nTesting paint conditions...');
  for (const condition of ['excellent', 'good', 'fair', 'poor', 'missing']) {
    const conditionResult = await page.evaluate((cond) => {
      // Select the paint condition
      if (window.selectWizardPaintCondition) {
        window.selectWizardPaintCondition(cond);
      } else {
        console.log('selectWizardPaintCondition not found, trying direct button click');
        const button = document.querySelector(`#wizardPaintConditionButtons button[data-value="${cond}"]`);
        if (button) button.click();
      }

      // Wait a bit and check pricing
      return new Promise(resolve => {
        setTimeout(() => {
          const total = document.getElementById('wizardTotalPrice');
          const hiddenTotal = document.getElementById('totalCostDisplay');
          resolve({
            condition: cond,
            wizardPrice: total ? total.textContent : 'Not found',
            hiddenPrice: hiddenTotal ? hiddenTotal.textContent : 'Not found'
          });
        }, 500);
      });
    }, condition);

    console.log(`Paint ${condition}:`, conditionResult);
  }

  // Test growth levels
  console.log('\nTesting growth levels...');
  for (const level of ['minimal', 'moderate', 'heavy', 'severe']) {
    const levelResult = await page.evaluate((lvl) => {
      // Select the growth level
      if (window.selectWizardGrowthLevel) {
        window.selectWizardGrowthLevel(lvl);
      } else {
        console.log('selectWizardGrowthLevel not found, trying direct button click');
        const button = document.querySelector(`#wizardGrowthLevelButtons button[data-value="${lvl}"]`);
        if (button) button.click();
      }

      // Wait a bit and check pricing
      return new Promise(resolve => {
        setTimeout(() => {
          const total = document.getElementById('wizardTotalPrice');
          const hiddenTotal = document.getElementById('totalCostDisplay');
          resolve({
            level: lvl,
            wizardPrice: total ? total.textContent : 'Not found',
            hiddenPrice: hiddenTotal ? hiddenTotal.textContent : 'Not found'
          });
        }, 500);
      });
    }, level);

    console.log(`Growth ${level}:`, levelResult);
  }

  // Debug: Check what's in the console for calculateCost
  await page.evaluate(() => {
    console.log('Debug - selectedServiceKey:', window.selectedServiceKey);
    console.log('Debug - serviceData exists:', !!window.serviceData);
    console.log('Debug - calculateCost exists:', typeof window.calculateCost);

    // Try calling calculateCost with debug
    if (window.calculateCost) {
      console.log('Manually calling calculateCost...');
      window.calculateCost();

      // Check results after calculation
      setTimeout(() => {
        const breakdown = document.getElementById('costBreakdown');
        const total = document.getElementById('totalCostDisplay');
        console.log('After manual calc - breakdown:', breakdown ? breakdown.textContent : 'null');
        console.log('After manual calc - total:', total ? total.textContent : 'null');
      }, 100);
    }
  });

  await page.waitForTimeout(2000);

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();