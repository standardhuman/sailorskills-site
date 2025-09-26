import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    console.log('Console:', msg.text());
  });

  console.log('1. Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(2000);

  console.log('2. Clicking on Recurring Cleaning...');
  // Click Recurring Cleaning twice to enter wizard
  await page.evaluate(() => {
    // First click to select
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    // Second click to enter wizard
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(2000);

  // Check initial state
  console.log('\n3. Checking initial Total price...');
  let totalBefore = await page.evaluate(() => {
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    return {
      wizardTotal: wizardTotal ? wizardTotal.textContent : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found'
    };
  });
  console.log('Total BEFORE clicking Heavy:', totalBefore);

  console.log('\n4. Clicking on Heavy growth level...');
  await page.evaluate(() => {
    // Find and click the Heavy button
    const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
    if (heavyButton) {
      console.log('Found Heavy button, clicking it...');
      heavyButton.click();
      return true;
    } else {
      console.log('Heavy button not found!');
      // Try to find any growth buttons
      const allButtons = document.querySelectorAll('#wizardGrowthLevelButtons button');
      console.log('Found growth buttons:', allButtons.length);
      allButtons.forEach(btn => {
        console.log('  Button:', btn.textContent, 'value:', btn.dataset.value);
      });
      return false;
    }
  });

  // Wait for any updates
  await page.waitForTimeout(1000);

  console.log('\n5. Checking Total price after clicking Heavy...');
  let totalAfter = await page.evaluate(() => {
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const costBreakdown = document.getElementById('costBreakdown');
    const wizardBreakdown = document.getElementById('wizardCostBreakdown');

    return {
      wizardTotal: wizardTotal ? wizardTotal.textContent : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      breakdown: costBreakdown ? costBreakdown.textContent.substring(0, 200) : 'Not found',
      wizardBreakdown: wizardBreakdown ? wizardBreakdown.textContent.substring(0, 200) : 'Not found'
    };
  });
  console.log('Total AFTER clicking Heavy:', totalAfter);

  // Check what paint/growth values are selected
  console.log('\n6. Checking selected conditions...');
  const selectedConditions = await page.evaluate(() => {
    const paintValue = document.getElementById('wizardPaintCondition')?.value;
    const growthValue = document.getElementById('wizardGrowthLevel')?.value;
    const boatLength = document.getElementById('wizardBoatLength')?.value;
    const hiddenBoatLength = document.getElementById('boatLength')?.value;

    // Check which buttons are selected
    const selectedPaint = document.querySelector('#wizardPaintConditionButtons button.selected');
    const selectedGrowth = document.querySelector('#wizardGrowthLevelButtons button.selected');

    return {
      paintValue,
      growthValue,
      boatLength,
      hiddenBoatLength,
      selectedPaintButton: selectedPaint ? selectedPaint.textContent : 'None',
      selectedGrowthButton: selectedGrowth ? selectedGrowth.textContent : 'None'
    };
  });
  console.log('Selected conditions:', selectedConditions);

  // Try manually calling the update functions
  console.log('\n7. Manually calling update functions...');
  await page.evaluate(() => {
    console.log('Calling calculateCost...');
    if (window.calculateCost) window.calculateCost();

    setTimeout(() => {
      console.log('Calling updateWizardPricing...');
      if (window.updateWizardPricing) window.updateWizardPricing();
    }, 500);
  });

  await page.waitForTimeout(1000);

  // Check final state
  console.log('\n8. Final state check...');
  let finalState = await page.evaluate(() => {
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const breakdown = document.getElementById('costBreakdown');

    return {
      wizardTotal: wizardTotal ? wizardTotal.textContent : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      breakdownSnippet: breakdown ? breakdown.textContent.substring(0, 150) : 'Not found',
      selectedServiceKey: window.selectedServiceKey
    };
  });
  console.log('Final state:', finalState);

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();