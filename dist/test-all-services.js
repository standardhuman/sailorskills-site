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

  console.log('Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(2000);

  // List of all services to test
  const services = [
    { name: 'Recurring Cleaning', key: 'recurring_cleaning', needsBoatLength: true },
    { name: 'One-Time Cleaning', key: 'onetime_cleaning', needsBoatLength: true },
    { name: 'Item Recovery', key: 'item_recovery', needsBoatLength: false },
    { name: 'Underwater Inspection', key: 'underwater_inspection', needsBoatLength: false },
    { name: 'Propeller Service', key: 'propeller_service', needsBoatLength: false },
    { name: 'Anodes Only', key: 'anodes_only', needsBoatLength: false }
  ];

  console.log('\n=== Testing all service buttons ===\n');

  for (const service of services) {
    console.log(`\nTesting: ${service.name}`);
    console.log('------------------------');

    // Click the service button twice to enter wizard
    const buttonFound = await page.evaluate((key) => {
      const button = document.querySelector(`button[onclick*="${key}"]`);
      if (button) {
        button.click();
        setTimeout(() => button.click(), 500);
        return true;
      }
      return false;
    }, service.key);

    if (!buttonFound) {
      console.log(`❌ Button not found for ${service.name}`);
      continue;
    }

    await page.waitForTimeout(3000);  // Wait longer for renderConsolidatedForm to be called

    // Check wizard state
    const wizardState = await page.evaluate(() => {
      const wizard = document.getElementById('wizardContainer');
      const wizardContent = document.getElementById('wizardContent');
      const boatNameInput = document.getElementById('wizardBoatName');
      const boatLengthInput = document.getElementById('wizardBoatLength');
      const paintButtons = document.getElementById('wizardPaintConditionButtons');
      const growthButtons = document.getElementById('wizardGrowthLevelButtons');
      const priceDisplay = document.getElementById('wizardTotalPrice');
      const backButton = document.querySelector('button[onclick*="backToServices"]');

      return {
        wizardVisible: wizard ? window.getComputedStyle(wizard).display !== 'none' : false,
        hasContent: wizardContent ? wizardContent.innerHTML.length > 50 : false,
        hasBoatName: !!boatNameInput,
        hasBoatLength: !!boatLengthInput,
        hasPaintButtons: !!paintButtons,
        hasGrowthButtons: !!growthButtons,
        hasPriceDisplay: !!priceDisplay,
        hasBackButton: !!backButton,
        selectedService: window.selectedServiceKey,
        priceText: priceDisplay ? priceDisplay.textContent : 'N/A'
      };
    });

    // Check results
    console.log(`  ✓ Wizard visible: ${wizardState.wizardVisible}`);
    console.log(`  ✓ Has content: ${wizardState.hasContent}`);
    console.log(`  ✓ Boat name field: ${wizardState.hasBoatName}`);
    console.log(`  ✓ Boat length field: ${wizardState.hasBoatLength} (expected: ${service.needsBoatLength})`);

    if (service.key.includes('cleaning')) {
      console.log(`  ✓ Paint condition buttons: ${wizardState.hasPaintButtons}`);
      console.log(`  ✓ Growth level buttons: ${wizardState.hasGrowthButtons}`);
    }

    console.log(`  ✓ Price display: ${wizardState.hasPriceDisplay} - ${wizardState.priceText}`);
    console.log(`  ✓ Back button: ${wizardState.hasBackButton}`);
    console.log(`  ✓ Selected service: ${wizardState.selectedService}`);

    // Determine if service is working
    const isWorking = wizardState.wizardVisible &&
                      wizardState.hasContent &&
                      wizardState.hasBackButton &&
                      wizardState.selectedService === service.key;

    if (isWorking) {
      console.log(`✅ ${service.name} is WORKING`);

      // If it's a cleaning service, test paint/growth buttons
      if (service.key.includes('cleaning')) {
        // Test Heavy growth button
        const heavyWorking = await page.evaluate(() => {
          const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
          if (heavyButton) {
            heavyButton.click();
            return true;
          }
          return false;
        });

        if (heavyWorking) {
          await page.waitForTimeout(1000);
          const priceAfterHeavy = await page.evaluate(() => {
            const priceDisplay = document.getElementById('wizardTotalPrice');
            return priceDisplay ? priceDisplay.textContent : 'N/A';
          });
          console.log(`  ✓ Heavy growth button works - Price: ${priceAfterHeavy}`);
        }
      }
    } else {
      console.log(`❌ ${service.name} is NOT WORKING PROPERLY`);
    }

    // Go back to services
    await page.evaluate(() => {
      const backButton = document.querySelector('button[onclick*="backToServices"]');
      if (backButton) backButton.click();
    });

    await page.waitForTimeout(1000);
  }

  console.log('\n=== Summary ===');
  console.log('Test complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();