import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  console.log('=== COMPREHENSIVE ADMIN INTERFACE TEST ===\n');
  console.log('Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(2000);

  // Test data for each service
  const testCases = [
    {
      service: { name: 'Recurring Cleaning', key: 'recurring_cleaning', needsBoatLength: true },
      boatLength: '42',
      paintCondition: null, // Will test 'poor' if available
      growthLevel: 'heavy',
      expectedBasePrice: 157.50,
      expectedSurcharge: 0.35, // 35% for heavy growth
    },
    {
      service: { name: 'One-Time Cleaning', key: 'onetime_cleaning', needsBoatLength: true },
      boatLength: '35',
      paintCondition: 'poor',
      growthLevel: 'severe',
      expectedBasePrice: 283.50,
      expectedSurcharge: 1.10, // 10% for poor paint + 100% for severe growth
    },
    {
      service: { name: 'Item Recovery', key: 'item_recovery', needsBoatLength: false },
      expectedBasePrice: 199.00,
    },
    {
      service: { name: 'Underwater Inspection', key: 'underwater_inspection', needsBoatLength: false },
      expectedBasePrice: 150.00,
    },
    {
      service: { name: 'Propeller Service', key: 'propeller_service', needsBoatLength: false },
      expectedBasePrice: 349.00,
    },
    {
      service: { name: 'Anodes Only', key: 'anodes_only', needsBoatLength: false },
      expectedBasePrice: 150.00,
    }
  ];

  let allPassed = true;
  const results = [];

  for (const testCase of testCases) {
    console.log(`\n━━━ Testing: ${testCase.service.name} ━━━`);

    // Click service button twice to enter wizard
    const buttonFound = await page.evaluate((key) => {
      const button = document.querySelector(`button[onclick*="${key}"]`);
      if (button) {
        button.click();
        setTimeout(() => button.click(), 500);
        return true;
      }
      return false;
    }, testCase.service.key);

    if (!buttonFound) {
      console.log(`❌ Button not found for ${testCase.service.name}`);
      allPassed = false;
      results.push({ service: testCase.service.name, passed: false, error: 'Button not found' });
      continue;
    }

    await page.waitForTimeout(2000);

    // Check wizard is visible
    const wizardVisible = await page.evaluate(() => {
      const wizard = document.getElementById('wizardContainer');
      return wizard ? window.getComputedStyle(wizard).display !== 'none' : false;
    });

    if (!wizardVisible) {
      console.log(`❌ Wizard not visible for ${testCase.service.name}`);
      allPassed = false;
      results.push({ service: testCase.service.name, passed: false, error: 'Wizard not visible' });
      continue;
    }

    console.log('✓ Wizard opened successfully');

    // Test boat length input if applicable
    if (testCase.service.needsBoatLength && testCase.boatLength) {
      const boatLengthSet = await page.evaluate((length) => {
        const input = document.getElementById('wizardBoatLength');
        if (input) {
          input.value = length;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, testCase.boatLength);

      if (boatLengthSet) {
        await page.waitForTimeout(1000);
        console.log(`✓ Boat length set to ${testCase.boatLength}ft`);
      }
    }

    // Test growth level buttons if cleaning service
    if (testCase.service.key.includes('cleaning') && testCase.growthLevel) {
      const growthSet = await page.evaluate((level) => {
        const button = document.querySelector(`#wizardGrowthLevelButtons button[data-value="${level}"]`);
        if (button) {
          button.click();
          return true;
        }
        return false;
      }, testCase.growthLevel);

      if (growthSet) {
        await page.waitForTimeout(1000);
        console.log(`✓ Growth level set to ${testCase.growthLevel}`);
      }
    }

    // Test paint condition if cleaning service
    if (testCase.service.key.includes('cleaning') && testCase.paintCondition) {
      const paintSet = await page.evaluate((condition) => {
        const button = document.querySelector(`#wizardPaintConditionButtons button[data-value="${condition}"]`);
        if (button) {
          button.click();
          return true;
        }
        return false;
      }, testCase.paintCondition);

      if (paintSet) {
        await page.waitForTimeout(1000);
        console.log(`✓ Paint condition set to ${testCase.paintCondition}`);
      }
    }

    // Get final price
    const priceInfo = await page.evaluate(() => {
      const priceDisplay = document.getElementById('wizardTotalPrice');
      const priceText = priceDisplay ? priceDisplay.textContent : '';
      const match = priceText.match(/\$([0-9,]+\.?\d*)/);
      return {
        text: priceText,
        value: match ? parseFloat(match[1].replace(',', '')) : 0
      };
    });

    console.log(`Price displayed: ${priceInfo.text}`);

    // Calculate expected price with surcharges
    let expectedPrice = testCase.expectedBasePrice || 0;
    if (testCase.expectedSurcharge) {
      expectedPrice = expectedPrice * (1 + testCase.expectedSurcharge);
    }

    // Check if price is reasonable (within 20% tolerance for calculated prices)
    const pricePassed = testCase.service.needsBoatLength ?
      (priceInfo.value > 0 && Math.abs(priceInfo.value - expectedPrice) / expectedPrice < 0.2) :
      (priceInfo.value === expectedPrice);

    if (pricePassed) {
      console.log(`✓ Price is correct: $${priceInfo.value}`);
    } else {
      console.log(`❌ Price mismatch: Expected ~$${expectedPrice.toFixed(2)}, got $${priceInfo.value}`);
      allPassed = false;
    }

    // Test Back to Services button
    const backButtonWorked = await page.evaluate(() => {
      const backButton = document.querySelector('button[onclick*="backToServices"]');
      if (backButton) {
        backButton.click();
        return true;
      }
      return false;
    });

    await page.waitForTimeout(1000);

    const backToServicesWorked = await page.evaluate(() => {
      const wizard = document.getElementById('wizardContainer');
      const buttons = document.getElementById('simpleServiceButtons');
      return wizard && buttons &&
             window.getComputedStyle(wizard).display === 'none' &&
             window.getComputedStyle(buttons).display !== 'none';
    });

    if (backToServicesWorked) {
      console.log('✓ Back to Services button works');
    } else {
      console.log('❌ Back to Services button failed');
      allPassed = false;
    }

    results.push({
      service: testCase.service.name,
      passed: pricePassed && backToServicesWorked,
      price: priceInfo.value
    });
  }

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('              TEST SUMMARY              ');
  console.log('═══════════════════════════════════════\n');

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const priceStr = result.price ? ` ($${result.price})` : '';
    console.log(`${icon} ${result.service}${priceStr}`);
  });

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }

  console.log('\nBrowser will remain open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('Test complete.');
})();