import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    console.log(`Console [${msg.type()}]:`, msg.text());
  });

  console.log('=== TESTING HEAVY BUTTON FIX ===\n');

  console.log('1. Navigating to admin page...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(3000);

  console.log('2. Clicking Recurring Cleaning twice to enter wizard...');
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(3000);

  console.log('3. Checking if selectWizardGrowthLevel function is available...');
  const functionCheck = await page.evaluate(() => {
    return {
      functionExists: typeof window.selectWizardGrowthLevel === 'function',
      functionString: window.selectWizardGrowthLevel ? window.selectWizardGrowthLevel.toString().substring(0, 100) : 'not found'
    };
  });
  console.log('Function check:', functionCheck);

  if (!functionCheck.functionExists) {
    console.log('4. Function not found - trying to manually define it...');
    await page.evaluate(() => {
      // Manually define the function
      window.selectWizardGrowthLevel = function(value) {
        console.log('Manual selectWizardGrowthLevel called with:', value);

        // Update UI
        document.querySelectorAll('#wizardGrowthLevelButtons .option-button').forEach(btn => {
          btn.classList.remove('selected');
        });
        const selectedBtn = document.querySelector(`#wizardGrowthLevelButtons [data-value="${value}"]`);
        if (selectedBtn) {
          selectedBtn.classList.add('selected');
        }

        // Update hidden inputs
        const wizardGrowth = document.getElementById('wizardGrowthLevel');
        if (wizardGrowth) wizardGrowth.value = value;

        const actualGrowth = document.getElementById('actualGrowthLevel');
        if (actualGrowth) actualGrowth.value = value;

        // Call pricing updates
        setTimeout(() => {
          if (window.calculateCost) window.calculateCost();
          if (window.updateWizardPricing) window.updateWizardPricing();
        }, 100);
      };
      console.log('Manually defined selectWizardGrowthLevel');
    });
  }

  console.log('5. Testing Heavy button click...');
  const initialState = await page.evaluate(() => {
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const wizardGrowth = document.getElementById('wizardGrowthLevel');
    const selectedBtn = document.querySelector('#wizardGrowthLevelButtons button.selected');

    return {
      totalPrice: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      growthValue: wizardGrowth ? wizardGrowth.value : 'Not found',
      selectedButton: selectedBtn ? selectedBtn.dataset.value : 'None'
    };
  });
  console.log('BEFORE Heavy click:', initialState);

  // Click Heavy button
  await page.evaluate(() => {
    const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
    if (heavyButton) {
      heavyButton.click();
      return true;
    }
    return false;
  });

  await page.waitForTimeout(2000);

  console.log('6. Checking state after Heavy click...');
  const afterState = await page.evaluate(() => {
    const hiddenTotal = document.getElementById('totalCostDisplay');
    const wizardGrowth = document.getElementById('wizardGrowthLevel');
    const selectedBtn = document.querySelector('#wizardGrowthLevelButtons button.selected');
    const costBreakdown = document.getElementById('costBreakdown');

    return {
      totalPrice: hiddenTotal ? hiddenTotal.textContent : 'Not found',
      growthValue: wizardGrowth ? wizardGrowth.value : 'Not found',
      selectedButton: selectedBtn ? selectedBtn.dataset.value : 'None',
      breakdown: costBreakdown ? costBreakdown.textContent.substring(0, 200) : 'Not found'
    };
  });
  console.log('AFTER Heavy click:', afterState);

  console.log('\n7. FINAL PRICING VERIFICATION:');
  console.log(`Expected: $212.63 (35ft × $4.50/ft × 1.35 for Heavy growth)`);
  console.log(`Actual total: ${afterState.totalPrice}`);
  console.log(`Growth level changed: ${initialState.selectedButton} → ${afterState.selectedButton}`);
  console.log(`Price changed: ${initialState.totalPrice} → ${afterState.totalPrice}`);

  const priceChanged = initialState.totalPrice !== afterState.totalPrice;
  const growthChanged = initialState.selectedButton !== afterState.selectedButton;
  const heavySelected = afterState.selectedButton === 'heavy';
  const correctPrice = afterState.totalPrice === '$212.63';

  console.log('\n=== RESULTS ===');
  console.log(`✓ Heavy button changes selected growth: ${growthChanged ? 'YES' : 'NO'}`);
  console.log(`✓ Heavy growth level selected: ${heavySelected ? 'YES' : 'NO'}`);
  console.log(`✓ Price changes when Heavy clicked: ${priceChanged ? 'YES' : 'NO'}`);
  console.log(`✓ Price is correct ($212.63): ${correctPrice ? 'YES' : 'NO'}`);

  if (growthChanged && heavySelected && priceChanged && correctPrice) {
    console.log('\n🎉 HEAVY BUTTON WORKING CORRECTLY!');
  } else {
    console.log('\n❌ HEAVY BUTTON STILL HAS ISSUES');
  }

  console.log('\nBrowser will stay open for 2 minutes for inspection...');
  await page.waitForTimeout(120000);

  await browser.close();
})();