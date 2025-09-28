import { test } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

test('Interactive debug - keep browser open', async ({ page }) => {
  // Navigate to admin page
  await page.goto('http://localhost:3000/admin/admin.html');

  // Open DevTools console
  await page.evaluate(() => {
    console.log('=== PAGE LOADED ===');
    console.log('adminApp:', window.adminApp);
    console.log('serviceData:', window.serviceData);
    console.log('updateChargeSummary:', typeof window.updateChargeSummary);
  });

  // Monitor all console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log('ERROR:', error.message);
  });

  console.log('\nBrowser is open. Please:');
  console.log('1. Click on "Recurring Cleaning" button');
  console.log('2. Check the Charge Summary box');
  console.log('3. Open DevTools Console (F12)');
  console.log('4. Type: window.adminApp.currentServiceKey');
  console.log('5. Type: window.adminApp.updateChargeSummary()');
  console.log('\nI will wait 2 minutes for you to inspect...\n');

  // Keep browser open for 2 minutes
  await page.waitForTimeout(120000);
});