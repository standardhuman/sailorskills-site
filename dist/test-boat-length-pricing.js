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
  console.log('\n3. Checking initial state (should be 35ft boat)...');
  let initialState = await page.evaluate(() => {
    const wizardBoatLength = document.getElementById('wizardBoatLength');
    const boatLength = document.getElementById('boatLength');
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    return {
      wizardBoatLength: wizardBoatLength ? wizardBoatLength.value : 'Not found',
      boatLength: boatLength ? boatLength.value : 'Not found',
      wizardTotal: wizardTotal ? wizardTotal.textContent : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found'
    };
  });
  console.log('Initial state:', initialState);

  console.log('\n4. Changing boat length to 42...');
  await page.evaluate(() => {
    const wizardBoatLength = document.getElementById('wizardBoatLength');
    if (wizardBoatLength) {
      wizardBoatLength.value = '42';
      wizardBoatLength.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Wait for calculations to complete
  await page.waitForTimeout(1000);

  console.log('\n5. Checking state after boat length change...');
  let afterBoatChange = await page.evaluate(() => {
    const wizardBoatLength = document.getElementById('wizardBoatLength');
    const boatLength = document.getElementById('boatLength');
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const costBreakdown = document.getElementById('costBreakdown');
    const wizardBreakdown = document.getElementById('wizardCostBreakdown');

    return {
      wizardBoatLength: wizardBoatLength ? wizardBoatLength.value : 'Not found',
      boatLength: boatLength ? boatLength.value : 'Not found',
      wizardTotal: wizardTotal ? wizardTotal.textContent : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      breakdownSnippet: costBreakdown ? costBreakdown.textContent.substring(0, 100) : 'Not found',
      wizardBreakdownSnippet: wizardBreakdown ? wizardBreakdown.textContent.substring(0, 100) : 'Not found'
    };
  });
  console.log('After boat length change:', afterBoatChange);

  console.log('\n6. Clicking on Heavy growth level...');
  await page.evaluate(() => {
    // Find and click the Heavy button
    const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
    if (heavyButton) {
      console.log('Found Heavy button, clicking it...');
      heavyButton.click();
      return true;
    } else {
      console.log('Heavy button not found!');
      return false;
    }
  });

  // Wait for any updates
  await page.waitForTimeout(1000);

  console.log('\n7. Checking Total price after clicking Heavy...');
  let afterHeavy = await page.evaluate(() => {
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const costBreakdown = document.getElementById('costBreakdown');
    const wizardBreakdown = document.getElementById('wizardCostBreakdown');
    const wizardBoatLength = document.getElementById('wizardBoatLength');
    const boatLength = document.getElementById('boatLength');

    // Check which buttons are selected
    const selectedPaint = document.querySelector('#wizardPaintConditionButtons button.selected');
    const selectedGrowth = document.querySelector('#wizardGrowthLevelButtons button.selected');

    return {
      wizardBoatLength: wizardBoatLength ? wizardBoatLength.value : 'Not found',
      boatLength: boatLength ? boatLength.value : 'Not found',
      wizardTotal: wizardTotal ? wizardTotal.textContent : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      selectedPaintButton: selectedPaint ? selectedPaint.textContent : 'None',
      selectedGrowthButton: selectedGrowth ? selectedGrowth.textContent : 'None',
      breakdownSnippet: costBreakdown ? costBreakdown.textContent.substring(0, 150) : 'Not found',
      wizardBreakdownSnippet: wizardBreakdown ? wizardBreakdown.textContent.substring(0, 150) : 'Not found'
    };
  });
  console.log('After clicking Heavy:', afterHeavy);

  console.log('\n8. Expected: 42ft boat with Heavy growth (35% surcharge) should show price around $255.15');
  console.log('(Base 42ft = $189, with 35% surcharge = $255.15)');

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();