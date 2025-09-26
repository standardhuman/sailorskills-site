import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing MAIN Vercel production deployment...\n');
  
  // Test the main production URL
  const mainUrl = 'https://cost-calculator-sigma.vercel.app/';
  await page.goto(mainUrl);
  console.log(`Testing URL: ${mainUrl}\n`);
  
  // Wait for service buttons to load
  await page.waitForSelector('.service-option', { timeout: 10000 });
  
  // Test Item Recovery
  console.log('1. Testing Item Recovery flow:');
  const recoveryButton = await page.locator('.service-option:has-text("Item Recovery")').first();
  await recoveryButton.click();
  await page.waitForTimeout(500);
  
  const recoveryNextText = await page.locator('button:has-text("Next"), button:has-text("View Estimate")').first().textContent();
  console.log(`   Next button: "${recoveryNextText}"`);
  console.log(`   Expected: "View Estimate" - ${recoveryNextText === 'View Estimate' ? '✓' : '❌'}`);
  
  await page.locator('button:has-text("Next"), button:has-text("View Estimate")').first().click();
  await page.waitForTimeout(1000);
  
  const anodesAfterRecovery = await page.locator('text=/Anodes to Install/i').count();
  const resultsAfterRecovery = await page.locator('text=/Total Estimate/i').count();
  console.log(`   Shows Anodes: ${anodesAfterRecovery > 0 ? 'YES ❌' : 'NO ✓'}`);
  console.log(`   Shows Results: ${resultsAfterRecovery > 0 ? 'YES ✓' : 'NO ❌'}`);
  
  // Reset
  await page.click('button:has-text("Start Over")');
  await page.waitForTimeout(500);
  
  // Test Underwater Inspection
  console.log('\n2. Testing Underwater Inspection flow:');
  const inspectionButton = await page.locator('.service-option:has-text("Underwater Inspection")').first();
  await inspectionButton.click();
  await page.waitForTimeout(500);
  
  const inspectionNextText = await page.locator('button:has-text("Next"), button:has-text("View Estimate")').first().textContent();
  console.log(`   Next button: "${inspectionNextText}"`);
  console.log(`   Expected: "View Estimate" - ${inspectionNextText === 'View Estimate' ? '✓' : '❌'}`);
  
  await page.locator('button:has-text("Next"), button:has-text("View Estimate")').first().click();
  await page.waitForTimeout(1000);
  
  const anodesAfterInspection = await page.locator('text=/Anodes to Install/i').count();
  const resultsAfterInspection = await page.locator('text=/Total Estimate/i').count();
  console.log(`   Shows Anodes: ${anodesAfterInspection > 0 ? 'YES ❌' : 'NO ✓'}`);
  console.log(`   Shows Results: ${resultsAfterInspection > 0 ? 'YES ✓' : 'NO ❌'}`);
  
  // Take final screenshot
  await page.screenshot({ path: 'main-vercel-inspection.png', fullPage: true });
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  if (anodesAfterRecovery === 0 && anodesAfterInspection === 0 && 
      resultsAfterRecovery > 0 && resultsAfterInspection > 0) {
    console.log('✅ SUCCESS: Both services correctly skip anodes!');
  } else {
    console.log('❌ ISSUE: One or both services not working correctly');
  }
  console.log(`\nDeployment URL: ${mainUrl}`);
})();