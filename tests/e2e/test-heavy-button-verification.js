import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console ERROR:`, msg.text());
    }
  });

  console.log('=== HEAVY GROWTH BUTTON VERIFICATION TEST ===\n');

  try {
    // 1. Navigate to http://localhost:3000/admin.html
    console.log('1. Navigating to http://localhost:3000/admin.html...');
    await page.goto('http://localhost:3000/admin.html');
    await page.waitForTimeout(3000);

    // 2. Click on "Recurring Cleaning" button twice to enter the wizard
    console.log('2. Clicking "Recurring Cleaning" button twice to enter wizard...');
    await page.evaluate(() => {
      const button = document.querySelector('button[onclick*="recurring_cleaning"]');
      if (button) button.click();
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const button = document.querySelector('button[onclick*="recurring_cleaning"]');
      if (button) button.click();
    });

    // 3. Wait for wizard to load
    console.log('3. Waiting for wizard to load...');
    await page.waitForTimeout(3000);

    // 4. Check if selectWizardGrowthLevel function is available in window
    console.log('4. Checking if selectWizardGrowthLevel function is available...');
    const functionExists = await page.evaluate(() => {
      return typeof window.selectWizardGrowthLevel === 'function';
    });
    console.log(`   selectWizardGrowthLevel function available: ${functionExists ? 'YES' : 'NO'}`);

    // 5. Record the initial Total price
    console.log('5. Recording initial Total price...');
    const initialState = await page.evaluate(() => {
      const totalElement = document.getElementById('totalCostDisplay');
      const growthElement = document.getElementById('wizardGrowthLevel');
      const selectedButton = document.querySelector('#wizardGrowthLevelButtons button.selected');

      return {
        totalPrice: totalElement ? totalElement.textContent : 'Not found',
        growthLevel: growthElement ? growthElement.value : 'Not found',
        selectedButtonText: selectedButton ? selectedButton.textContent.trim() : 'None',
        selectedButtonValue: selectedButton ? selectedButton.dataset.value : 'None'
      };
    });
    console.log(`   Initial Total: ${initialState.totalPrice}`);
    console.log(`   Initial Growth Level: ${initialState.growthLevel} (${initialState.selectedButtonText})`);

    // 6. Click on the "Heavy" growth level button
    console.log('6. Clicking on "Heavy" growth level button...');
    const heavyButtonFound = await page.evaluate(() => {
      const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
      if (heavyButton) {
        heavyButton.click();
        return true;
      }
      return false;
    });
    console.log(`   Heavy button found and clicked: ${heavyButtonFound ? 'YES' : 'NO'}`);

    // 7. Wait for updates
    console.log('7. Waiting for pricing updates...');
    await page.waitForTimeout(2000);

    // 8. Record the Total price after clicking Heavy
    console.log('8. Recording Total price after clicking Heavy...');
    const afterState = await page.evaluate(() => {
      const totalElement = document.getElementById('totalCostDisplay');
      const growthElement = document.getElementById('wizardGrowthLevel');
      const selectedButton = document.querySelector('#wizardGrowthLevelButtons button.selected');
      const breakdownElement = document.getElementById('costBreakdown');

      return {
        totalPrice: totalElement ? totalElement.textContent : 'Not found',
        growthLevel: growthElement ? growthElement.value : 'Not found',
        selectedButtonText: selectedButton ? selectedButton.textContent.trim() : 'None',
        selectedButtonValue: selectedButton ? selectedButton.dataset.value : 'None',
        breakdown: breakdownElement ? breakdownElement.textContent.substring(0, 300) : 'Not found'
      };
    });
    console.log(`   Final Total: ${afterState.totalPrice}`);
    console.log(`   Final Growth Level: ${afterState.growthLevel} (${afterState.selectedButtonText})`);

    // 9. Verify the growth level actually changed to 'heavy'
    console.log('9. Verifying growth level changed to "heavy"...');
    const growthChanged = afterState.growthLevel === 'heavy' && afterState.selectedButtonValue === 'heavy';
    console.log(`   Growth level correctly set to 'heavy': ${growthChanged ? 'YES' : 'NO'}`);

    // Final verification
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log(`Expected Initial: $157.50 (Good paint + Minimal growth)`);
    console.log(`Actual Initial: ${initialState.totalPrice}`);
    console.log(`Expected After Heavy: $212.63 (Good paint + Heavy growth, 35% surcharge)`);
    console.log(`Actual After Heavy: ${afterState.totalPrice}`);
    console.log('');

    const initialCorrect = initialState.totalPrice === '$157.50';
    const finalCorrect = afterState.totalPrice === '$212.63';
    const priceChanged = initialState.totalPrice !== afterState.totalPrice;

    console.log(`✓ Initial price correct ($157.50): ${initialCorrect ? 'YES' : 'NO'}`);
    console.log(`✓ Heavy button updates UI to 'heavy': ${growthChanged ? 'YES' : 'NO'}`);
    console.log(`✓ Price changes when Heavy clicked: ${priceChanged ? 'YES' : 'NO'}`);
    console.log(`✓ Final price correct ($212.63): ${finalCorrect ? 'YES' : 'NO'}`);
    console.log(`✓ selectWizardGrowthLevel function available: ${functionExists ? 'YES' : 'NO'}`);

    console.log('\n=== BREAKDOWN DETAILS ===');
    console.log(afterState.breakdown);

    if (initialCorrect && growthChanged && priceChanged && finalCorrect && functionExists) {
      console.log('\n🎉 ALL TESTS PASSED - HEAVY BUTTON WORKS CORRECTLY!');
    } else {
      console.log('\n❌ SOME TESTS FAILED - ISSUES DETECTED');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }

  console.log('\nClosing browser...');
  await browser.close();
})();