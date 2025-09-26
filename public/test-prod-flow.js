import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing PRODUCTION Item Recovery flow...\n');
  
  // Test production URL
  const prodUrl = 'https://cost-calculator-hgwbcpm7v-brians-projects-bc2d3592.vercel.app/';
  await page.goto(prodUrl);
  console.log(`Testing URL: ${prodUrl}\n`);
  
  // Wait for service buttons to load
  await page.waitForSelector('.service-option', { timeout: 10000 });
  
  // Click Item Recovery
  console.log('1. Clicking Item Recovery service...');
  const recoveryButton = await page.locator('.service-option:has-text("Item Recovery")').first();
  await recoveryButton.click();
  await page.waitForTimeout(1000);
  
  // Check Next button text
  const nextButtonText = await page.locator('button:has-text("Next"), button:has-text("View Estimate")').first().textContent();
  console.log(`   Next button text: "${nextButtonText}"`);
  
  // Click Next
  console.log('\n2. Clicking Next/View Estimate button...');
  await page.locator('button:has-text("Next"), button:has-text("View Estimate")').first().click();
  await page.waitForTimeout(2000);
  
  // Check what content is visible
  console.log('\n3. Checking visible content:');
  
  // Check for anodes content
  const anodesVisible = await page.locator('text=/Anodes to Install/i').count();
  console.log(`   "Anodes to Install" text visible: ${anodesVisible > 0 ? 'YES ❌ BUG!' : 'NO ✓'}`);
  
  // Check for results content
  const resultsVisible = await page.locator('text=/Cost Estimate/i, text=/Total Estimate/i').count();
  console.log(`   Results/Estimate content visible: ${resultsVisible > 0 ? 'YES ✓' : 'NO ❌'}`);
  
  // Take screenshot
  await page.screenshot({ path: 'prod-item-recovery-flow.png', fullPage: true });
  console.log('\n4. Screenshot saved as prod-item-recovery-flow.png');
  
  // Check page title or heading
  const visibleHeadings = await page.locator('h2:visible').allTextContents();
  console.log('\n5. Visible H2 headings:', visibleHeadings);
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  if (anodesVisible > 0) {
    console.log('❌ BUG CONFIRMED IN PRODUCTION: Item Recovery is showing Anodes!');
    console.log('   The production deployment may be out of sync.');
  } else if (resultsVisible > 0) {
    console.log('✓ WORKING IN PRODUCTION: Item Recovery correctly skips to Results!');
  } else {
    console.log('⚠️ UNEXPECTED: Neither Anodes nor Results are clearly visible');
  }
})();