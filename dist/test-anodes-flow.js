import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Item Recovery flow to verify anodes are skipped...\n');
  
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('#serviceButtons .service-option');
  
  // Click Item Recovery
  console.log('1. Clicking Item Recovery service...');
  await page.click('[data-service-key="item_recovery"]');
  await page.waitForTimeout(1000);
  
  // Check current step and Next button text
  const nextButtonText = await page.locator('#nextButton').textContent();
  console.log(`   Next button text: "${nextButtonText}"`);
  
  // Click Next
  console.log('\n2. Clicking Next button...');
  await page.click('#nextButton');
  await page.waitForTimeout(1000);
  
  // Check which step we're on now
  const step0Visible = await page.locator('#step-0').isVisible();
  const step7Visible = await page.locator('#step-7').isVisible();
  const step8Visible = await page.locator('#step-8').isVisible();
  
  console.log('\n3. Checking which step is visible:');
  console.log(`   Step 0 (Service Selection): ${step0Visible ? 'VISIBLE' : 'hidden'}`);
  console.log(`   Step 7 (Anodes): ${step7Visible ? 'VISIBLE ❌ BUG!' : 'hidden ✓'}`);
  console.log(`   Step 8 (Results): ${step8Visible ? 'VISIBLE ✓' : 'hidden ❌'}`);
  
  // Check if anodes input is visible
  const anodesLabel = await page.locator('label:has-text("Anodes to Install")').count();
  console.log(`\n4. Anodes input field present: ${anodesLabel > 0 ? 'YES ❌ BUG!' : 'NO ✓'}`);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'item-recovery-flow.png', fullPage: true });
  console.log('\n5. Screenshot saved as item-recovery-flow.png');
  
  // Check the heading text if on step 7
  if (step7Visible) {
    const headingText = await page.locator('#step-7 h2').textContent();
    console.log(`\n   Step 7 heading: "${headingText}"`);
  }
  
  // Check the heading text if on step 8
  if (step8Visible) {
    const headingText = await page.locator('#step-8 h2').textContent();
    console.log(`\n   Step 8 heading: "${headingText}"`);
    
    // Check if cost breakdown is visible
    const costBreakdown = await page.locator('#costBreakdown').textContent();
    console.log(`   Cost breakdown: ${costBreakdown ? 'Present' : 'Empty'}`);
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  if (step7Visible) {
    console.log('❌ BUG CONFIRMED: Item Recovery is showing Anodes step!');
  } else if (step8Visible) {
    console.log('✓ WORKING: Item Recovery correctly skips to Results!');
  } else {
    console.log('⚠️ UNEXPECTED: Neither Anodes nor Results are visible');
  }
})();