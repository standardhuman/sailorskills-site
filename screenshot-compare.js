import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  // Screenshot Wix original
  const page1 = await context.newPage();
  await page1.goto('https://www.sailorskills.com/training');
  await page1.waitForLoadState('networkidle');
  await page1.screenshot({
    path: '/Users/brian/app-development/sailorskills/wix-training-current.png',
    fullPage: true
  });
  console.log('✓ Captured Wix original');

  // Screenshot local recreation
  const page2 = await context.newPage();
  await page2.goto('http://localhost:3003/training/training.html');
  await page2.waitForLoadState('networkidle');
  await page2.screenshot({
    path: '/Users/brian/app-development/sailorskills/local-training-current.png',
    fullPage: true
  });
  console.log('✓ Captured local recreation');

  await browser.close();
  console.log('Screenshots saved successfully!');
})();
