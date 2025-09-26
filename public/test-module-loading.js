import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for ALL console logs
  page.on('console', msg => {
    console.log('Console:', msg.text());
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  console.log('1. Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');

  // Wait longer for module scripts to load
  await page.waitForTimeout(5000);

  console.log('\n2. Checking if renderConsolidatedForm is the full version...');
  const functionCheck = await page.evaluate(() => {
    const funcString = window.renderConsolidatedForm ? window.renderConsolidatedForm.toString() : 'undefined';
    return {
      functionExists: !!window.renderConsolidatedForm,
      isStub: funcString.includes('Stub renderConsolidatedForm'),
      isFull: funcString.includes('Full renderConsolidatedForm'),
      firstLine: funcString.split('\n')[0]
    };
  });
  console.log('Function check:', functionCheck);

  console.log('\n3. Clicking on Recurring Cleaning...');
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="recurring_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(2000);

  console.log('\n4. Checking if wizard rendered...');
  const wizardCheck = await page.evaluate(() => {
    return {
      wizardContainer: !!document.getElementById('wizardContainer'),
      wizardContent: !!document.getElementById('wizardContent'),
      wizardBoatLength: !!document.getElementById('wizardBoatLength'),
      wizardPaintButtons: !!document.getElementById('wizardPaintConditionButtons'),
      wizardGrowthButtons: !!document.getElementById('wizardGrowthLevelButtons'),
      contentHTML: document.getElementById('wizardContent')?.innerHTML?.substring(0, 100)
    };
  });
  console.log('Wizard check:', wizardCheck);

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();