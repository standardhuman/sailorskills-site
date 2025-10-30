import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for all console logs
  page.on('console', msg => {
    console.log('Console:', msg.text());
  });

  console.log('Navigating to /admin.html...');
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(2000);

  console.log('\nClicking One-Time Cleaning once...');
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="onetime_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(1500);

  console.log('\nClicking One-Time Cleaning again to enter wizard...');
  await page.evaluate(() => {
    const button = document.querySelector('button[onclick*="onetime_cleaning"]');
    if (button) button.click();
  });
  await page.waitForTimeout(2000);

  console.log('\nChecking wizard content...');
  const wizardState = await page.evaluate(() => {
    const wizardContent = document.getElementById('wizardContent');
    return {
      innerHTML: wizardContent ? wizardContent.innerHTML : 'Not found'
    };
  });

  console.log('Wizard content:', wizardState.innerHTML);

  console.log('\nTest complete. Browser will remain open for inspection.');
  console.log('Press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(300000);
})();