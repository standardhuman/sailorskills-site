import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing service flows...\n');
  
  // Test Recovery Service Flow
  console.log('1. Testing Item Recovery flow:');
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('#serviceButtons .service-option');
  
  // Click Item Recovery
  await page.click('[data-service-key="item_recovery"]');
  await page.waitForTimeout(500);
  
  // Check Next button text
  const recoveryButtonText = await page.locator('#nextButton').textContent();
  console.log(`   - Next button says: "${recoveryButtonText}"`);
  console.log(`   - Expected: "View Estimate"`);
  console.log(`   - ${recoveryButtonText === 'View Estimate' ? '✓ PASS' : '✗ FAIL'}`);
  
  // Click Next to go to results
  await page.click('#nextButton');
  await page.waitForTimeout(500);
  
  // Check if we're on results page
  const resultsVisible = await page.locator('#step-8').isVisible();
  console.log(`   - Results page visible: ${resultsVisible ? '✓ PASS' : '✗ FAIL'}`);
  
  // Reset
  await page.click('#nextButton'); // Start Over
  await page.waitForTimeout(500);
  
  console.log('\n2. Testing Underwater Inspection flow:');
  // Click Underwater Inspection
  await page.click('[data-service-key="underwater_inspection"]');
  await page.waitForTimeout(500);
  
  // Check Next button text
  const inspectionButtonText = await page.locator('#nextButton').textContent();
  console.log(`   - Next button says: "${inspectionButtonText}"`);
  console.log(`   - Expected: "View Estimate"`);
  console.log(`   - ${inspectionButtonText === 'View Estimate' ? '✓ PASS' : '✗ FAIL'}`);
  
  // Click Next to go to results
  await page.click('#nextButton');
  await page.waitForTimeout(500);
  
  // Check if we're on results page
  const resultsVisible2 = await page.locator('#step-8').isVisible();
  console.log(`   - Results page visible: ${resultsVisible2 ? '✓ PASS' : '✗ FAIL'}`);
  
  // Reset
  await page.click('#nextButton'); // Start Over
  await page.waitForTimeout(500);
  
  console.log('\n3. Testing One-time Cleaning flow (should still have anodes):');
  // Click One-time Cleaning
  await page.click('[data-service-key="onetime_cleaning"]');
  await page.waitForTimeout(500);
  
  // Check Next button text
  const cleaningButtonText = await page.locator('#nextButton').textContent();
  console.log(`   - Next button says: "${cleaningButtonText}"`);
  console.log(`   - Expected: "Next (Boat Length)"`);
  console.log(`   - ${cleaningButtonText === 'Next (Boat Length)' ? '✓ PASS' : '✗ FAIL'}`);
  
  await browser.close();
  console.log('\n✅ Test complete!');
})();