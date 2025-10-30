import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    if (msg.type() !== 'log') console.log(`Console ${msg.type()}:`, msg.text());
  });

  console.log('=== HEAVY GROWTH BUTTON DEBUG TEST ===\n');

  console.log('1. Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(3000);

  console.log('2. Clicking on Recurring Cleaning twice...');
  // First click to select
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(500);

  // Second click to enter wizard
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(3000);

  // Check initial state
  console.log('\n3. INITIAL STATE CHECK');
  const initialState = await page.evaluate(() => {
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const wizardGrowth = document.getElementById('wizardGrowthLevel');
    const actualGrowth = document.getElementById('actualGrowthLevel');
    const selectedButton = document.querySelector('#wizardGrowthLevelButtons button.selected');

    return {
      wizardTotal: wizardTotal ? wizardTotal.textContent.trim() : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      wizardGrowthValue: wizardGrowth ? wizardGrowth.value : 'Not found',
      actualGrowthValue: actualGrowth ? actualGrowth.value : 'Not found',
      selectedButtonText: selectedButton ? selectedButton.textContent.trim() : 'None',
      selectedButtonValue: selectedButton ? selectedButton.dataset.value : 'None'
    };
  });
  console.log('Initial state:', initialState);

  console.log('\n4. TESTING HEAVY BUTTON CLICK');

  // Test the Heavy button click with detailed logging
  const clickResult = await page.evaluate(() => {
    const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
    if (!heavyButton) {
      return { success: false, error: 'Heavy button not found' };
    }

    console.log('Heavy button found:', heavyButton);
    console.log('Heavy button onclick:', heavyButton.onclick);
    console.log('Heavy button data-value:', heavyButton.dataset.value);

    // Check if function exists
    if (typeof window.selectWizardGrowthLevel !== 'function') {
      return { success: false, error: 'selectWizardGrowthLevel function not found' };
    }

    console.log('About to click Heavy button...');
    heavyButton.click();

    return { success: true, clicked: true };
  });

  console.log('Click result:', clickResult);

  // Wait and check immediate state after click
  await page.waitForTimeout(1000);

  console.log('\n5. STATE IMMEDIATELY AFTER CLICKING HEAVY');
  const immediateState = await page.evaluate(() => {
    const wizardGrowth = document.getElementById('wizardGrowthLevel');
    const actualGrowth = document.getElementById('actualGrowthLevel');
    const selectedButton = document.querySelector('#wizardGrowthLevelButtons button.selected');
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');

    return {
      wizardGrowthValue: wizardGrowth ? wizardGrowth.value : 'Not found',
      actualGrowthValue: actualGrowth ? actualGrowth.value : 'Not found',
      selectedButtonText: selectedButton ? selectedButton.textContent.trim() : 'None',
      selectedButtonValue: selectedButton ? selectedButton.dataset.value : 'None',
      wizardTotal: wizardTotal ? wizardTotal.textContent.trim() : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found'
    };
  });
  console.log('Immediate state after Heavy click:', immediateState);

  console.log('\n6. MANUALLY CALLING selectWizardGrowthLevel("heavy")');
  await page.evaluate(() => {
    console.log('Manually calling selectWizardGrowthLevel("heavy")');
    if (window.selectWizardGrowthLevel) {
      window.selectWizardGrowthLevel('heavy');
    }
  });

  await page.waitForTimeout(2000);

  console.log('\n7. STATE AFTER MANUAL CALL');
  const manualState = await page.evaluate(() => {
    const wizardGrowth = document.getElementById('wizardGrowthLevel');
    const actualGrowth = document.getElementById('actualGrowthLevel');
    const selectedButton = document.querySelector('#wizardGrowthLevelButtons button.selected');
    const wizardTotal = document.getElementById('wizardTotalPrice');
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const costBreakdown = document.getElementById('costBreakdown');

    return {
      wizardGrowthValue: wizardGrowth ? wizardGrowth.value : 'Not found',
      actualGrowthValue: actualGrowth ? actualGrowth.value : 'Not found',
      selectedButtonText: selectedButton ? selectedButton.textContent.trim() : 'None',
      selectedButtonValue: selectedButton ? selectedButton.dataset.value : 'None',
      wizardTotal: wizardTotal ? wizardTotal.textContent.trim() : 'Not found',
      hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      breakdown: costBreakdown ? costBreakdown.textContent.substring(0, 200) : 'Not found'
    };
  });
  console.log('State after manual call:', manualState);

  console.log('\n8. EXPECTED vs ACTUAL PRICING ANALYSIS');
  const boatLength = 35;
  const baseRate = 4.5;
  const basePrice = boatLength * baseRate; // $157.50

  // Heavy growth should add 35% surcharge
  const heavySurcharge = 0.35;
  const expectedHeavyPrice = basePrice * (1 + heavySurcharge); // $212.63

  console.log(`Expected pricing analysis:
    - Base price (${boatLength}ft × $${baseRate}/ft): $${basePrice.toFixed(2)}
    - Heavy growth surcharge (35%): $${(basePrice * heavySurcharge).toFixed(2)}
    - Expected total with Heavy: $${expectedHeavyPrice.toFixed(2)}
    - Current wizard total: ${manualState.wizardTotal}
    - Current hidden total: ${manualState.hiddenTotal}`);

  console.log('\n9. TESTING ALL GROWTH LEVELS');
  const growthLevels = ['minimal', 'moderate', 'heavy', 'severe'];

  for (const level of growthLevels) {
    console.log(`\nTesting ${level}...`);
    await page.evaluate((level) => {
      if (window.selectWizardGrowthLevel) {
        window.selectWizardGrowthLevel(level);
      }
    }, level);

    await page.waitForTimeout(1000);

    const levelState = await page.evaluate(() => {
      const wizardGrowth = document.getElementById('wizardGrowthLevel');
      const selectedButton = document.querySelector('#wizardGrowthLevelButtons button.selected');
      const hiddenTotal = document.getElementById('totalCostDisplay');

      return {
        wizardGrowthValue: wizardGrowth ? wizardGrowth.value : 'Not found',
        selectedButtonValue: selectedButton ? selectedButton.dataset.value : 'None',
        hiddenTotal: hiddenTotal ? hiddenTotal.textContent : 'Not found'
      };
    });

    console.log(`${level} result:`, levelState);
  }

  console.log('\n=== TEST SUMMARY ===');
  console.log('The Heavy button functionality test is complete.');
  console.log('Key findings:');
  console.log('- Initial price (Minimal): $157.50');
  console.log('- Expected Heavy price: $212.63');
  console.log('- Check the results above to see if Heavy button updates the price correctly');

  // Keep browser open for inspection
  console.log('\nBrowser will remain open for 5 minutes for manual inspection...');
  await page.waitForTimeout(300000);

  await browser.close();
})();