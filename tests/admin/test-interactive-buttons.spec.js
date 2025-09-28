import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 },
  video: 'on'
});

test('Interactive test - click service buttons', async ({ page }) => {
  // Navigate to admin page
  console.log('Opening admin page...');
  await page.goto('http://localhost:3000/admin/admin.html');

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Log all console messages
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });

  // Log any page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  // Check initial state
  console.log('\n=== Checking initial page state ===');

  const functionsExist = await page.evaluate(() => {
    return {
      selectServiceDirect: typeof window.selectServiceDirect,
      renderConsolidatedForm: typeof window.renderConsolidatedForm,
      adminApp: typeof window.adminApp
    };
  });
  console.log('Functions loaded:', functionsExist);

  // Test Recurring Cleaning button
  console.log('\n=== Clicking Recurring Cleaning ===');
  const recurringBtn = page.locator('button:has-text("Recurring Cleaning")').first();
  await recurringBtn.scrollIntoViewIfNeeded();
  await recurringBtn.click();

  await page.waitForTimeout(2000);

  // Check what happened
  const afterRecurring = await page.evaluate(() => {
    const wizard = document.getElementById('wizardContainer');
    const content = document.getElementById('wizardContent');
    return {
      wizardDisplay: wizard ? getComputedStyle(wizard).display : 'not found',
      hasContent: content ? content.innerHTML.length > 0 : false,
      contentPreview: content ? content.innerHTML.substring(0, 200) : 'no content'
    };
  });
  console.log('After Recurring click:', afterRecurring);

  // Test One-Time Cleaning button
  console.log('\n=== Clicking One-Time Cleaning ===');
  const onetimeBtn = page.locator('button:has-text("One-Time Cleaning")').first();
  await onetimeBtn.scrollIntoViewIfNeeded();
  await onetimeBtn.click();

  await page.waitForTimeout(2000);

  const afterOnetime = await page.evaluate(() => {
    const wizard = document.getElementById('wizardContainer');
    const content = document.getElementById('wizardContent');
    return {
      wizardDisplay: wizard ? getComputedStyle(wizard).display : 'not found',
      hasContent: content ? content.innerHTML.length > 0 : false,
      contentPreview: content ? content.innerHTML.substring(0, 200) : 'no content'
    };
  });
  console.log('After One-Time click:', afterOnetime);

  // Test Underwater Inspection
  console.log('\n=== Clicking Underwater Inspection ===');
  const underwaterBtn = page.locator('button:has-text("Underwater Inspection")').first();
  await underwaterBtn.scrollIntoViewIfNeeded();
  await underwaterBtn.click();

  await page.waitForTimeout(2000);

  const afterUnderwater = await page.evaluate(() => {
    const wizard = document.getElementById('wizardContainer');
    const content = document.getElementById('wizardContent');
    return {
      wizardDisplay: wizard ? getComputedStyle(wizard).display : 'not found',
      hasContent: content ? content.innerHTML.length > 0 : false,
      contentPreview: content ? content.innerHTML.substring(0, 200) : 'no content'
    };
  });
  console.log('After Underwater click:', afterUnderwater);

  // Take screenshot
  await page.screenshot({ path: 'admin-buttons-test.png', fullPage: true });
  console.log('\nScreenshot saved as admin-buttons-test.png');

  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
});