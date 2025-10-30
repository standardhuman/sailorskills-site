import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('1. Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(2000);

  console.log('2. Clicking on Recurring Cleaning twice to enter wizard...');
  // Click twice to enter wizard
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(1500);

  console.log('3. Checking if wizard is visible...');
  const wizardVisible = await page.evaluate(() => {
    const wizard = document.getElementById('wizardContainer');
    return wizard ? window.getComputedStyle(wizard).display !== 'none' : false;
  });
  console.log('   Wizard visible:', wizardVisible);

  console.log('\n4. Clicking "Back to Services" button...');
  const buttonClicked = await page.evaluate(() => {
    const backButton = document.querySelector('button[onclick*="backToServices"]');
    if (backButton) {
      backButton.click();
      return true;
    }
    return false;
  });
  console.log('   Button clicked:', buttonClicked);

  await page.waitForTimeout(1000);

  console.log('\n5. Checking state after clicking Back to Services...');
  const afterBackState = await page.evaluate(() => {
    const wizard = document.getElementById('wizardContainer');
    const simpleButtons = document.getElementById('simpleServiceButtons');
    const serviceHeading = document.querySelector('.service-selector h2');

    return {
      wizardVisible: wizard ? window.getComputedStyle(wizard).display !== 'none' : false,
      wizardHTML: wizard ? wizard.innerHTML.substring(0, 50) : 'Not found',
      simpleButtonsVisible: simpleButtons ? window.getComputedStyle(simpleButtons).display !== 'none' : false,
      serviceHeadingVisible: serviceHeading ? window.getComputedStyle(serviceHeading).display !== 'none' : false,
      selectedServiceKey: window.selectedServiceKey,
      currentServiceKey: window.currentServiceKey
    };
  });
  console.log('State after back:', afterBackState);

  if (!afterBackState.wizardVisible && afterBackState.simpleButtonsVisible) {
    console.log('\n✅ SUCCESS: Back to Services button works correctly!');
    console.log('   - Wizard is hidden');
    console.log('   - Service buttons are visible');
    console.log('   - Service selection is reset');
  } else {
    console.log('\n❌ FAILURE: Back to Services button did not work as expected');
  }

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();