import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Taking screenshots of Heavy button functionality...');

  // Navigate and setup
  await page.goto('http://localhost:3000/admin.html');
  await page.waitForTimeout(3000);

  // Enter recurring cleaning wizard
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

  // Screenshot initial state
  await page.screenshot({ path: '/Users/brian/app-development/cost-calculator/heavy-button-initial.png', fullPage: true });
  console.log('Screenshot saved: heavy-button-initial.png');

  // Click Heavy button
  await page.evaluate(() => {
    const heavyButton = document.querySelector('#wizardGrowthLevelButtons button[data-value="heavy"]');
    if (heavyButton) heavyButton.click();
  });
  await page.waitForTimeout(2000);

  // Screenshot after Heavy click
  await page.screenshot({ path: '/Users/brian/app-development/cost-calculator/heavy-button-after.png', fullPage: true });
  console.log('Screenshot saved: heavy-button-after.png');

  await browser.close();
})();