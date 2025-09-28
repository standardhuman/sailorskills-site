import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

test('Test direct updateChargeSummary call', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Click Recurring Cleaning
  console.log('Clicking Recurring Cleaning...');
  await page.click('button:has-text("Recurring Cleaning")');
  await page.waitForTimeout(2000);

  // Check current state
  console.log('\n=== BEFORE MANUAL FIX ===');
  let state = await page.evaluate(() => {
    return {
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      windowServiceKey: window.currentServiceKey,
      chargeDetailsText: document.getElementById('chargeDetails')?.textContent?.trim()
    };
  });
  console.log(state);

  // Try to manually fix it
  console.log('\n=== APPLYING MANUAL FIX ===');
  await page.evaluate(() => {
    // Set the service key on adminApp
    if (window.adminApp && window.currentServiceKey) {
      console.log('Setting adminApp.currentServiceKey to:', window.currentServiceKey);
      window.adminApp.currentServiceKey = window.currentServiceKey;

      // Set a price
      const totalCost = document.getElementById('totalCost');
      if (totalCost) {
        totalCost.value = '157.50'; // 35ft * 4.50
        console.log('Set totalCost to 157.50');
      }

      // Call update
      if (typeof window.adminApp.updateChargeSummary === 'function') {
        console.log('Calling adminApp.updateChargeSummary()');
        window.adminApp.updateChargeSummary();
      }
    }
  });

  await page.waitForTimeout(1000);

  console.log('\n=== AFTER MANUAL FIX ===');
  state = await page.evaluate(() => {
    return {
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      windowServiceKey: window.currentServiceKey,
      chargeDetailsText: document.getElementById('chargeDetails')?.textContent?.trim(),
      chargeDetailsHTML: document.getElementById('chargeDetails')?.innerHTML
    };
  });
  console.log('Service Key:', state.adminAppServiceKey);
  console.log('Charge Details:', state.chargeDetailsText);

  // Now test if we can make it work automatically
  console.log('\n=== TESTING AUTOMATIC FIX ===');

  // Add a global function that properly updates everything
  await page.evaluate(() => {
    window.fixChargeSummary = function() {
      if (window.adminApp && window.currentServiceKey) {
        window.adminApp.currentServiceKey = window.currentServiceKey;

        // Get price from wizard display if available
        const wizardPrice = document.getElementById('wizardTotalPrice');
        if (wizardPrice) {
          const priceText = wizardPrice.textContent.replace('$', '');
          const totalCost = document.getElementById('totalCost');
          if (totalCost) {
            totalCost.value = priceText;
          }
        }

        window.adminApp.updateChargeSummary();
        return 'Fixed!';
      }
      return 'Could not fix - missing data';
    };
  });

  // Click One-Time Cleaning to test
  console.log('\n=== Testing with One-Time Cleaning ===');
  await page.click('button:has-text("One-Time Cleaning")');
  await page.waitForTimeout(1000);

  // Call our fix function
  const fixResult = await page.evaluate(() => window.fixChargeSummary());
  console.log('Fix result:', fixResult);

  await page.waitForTimeout(1000);

  const finalState = await page.evaluate(() => {
    return {
      adminAppServiceKey: window.adminApp?.currentServiceKey,
      chargeDetailsText: document.getElementById('chargeDetails')?.textContent?.trim()
    };
  });
  console.log('\nFinal state:');
  console.log('Service:', finalState.adminAppServiceKey);
  console.log('Charge Summary:', finalState.chargeDetailsText);

  // Keep browser open
  console.log('\nKeeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
});