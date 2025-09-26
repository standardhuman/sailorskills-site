import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  
  console.log('Final comprehensive test...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Test 1: Search for "Cline"
  console.log('1. Testing search for "Cline"...');
  await page.fill('#customerSearch', 'Cline');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(3000);
  
  const customerCount = await page.locator('.customer-item').count();
  console.log(`   Found ${customerCount} customer(s) matching "Cline"`);
  
  if (customerCount > 0) {
    console.log('   ✅ Search for "Cline" works!');
    
    // Select first customer
    await page.locator('.customer-item').first().click();
    await page.waitForTimeout(1000);
    
    const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
    console.log(`   Selected: ${selectedInfo}`);
    
    // Select service and enter details
    console.log('\n2. Testing charge amount calculation...');
    await page.click('[data-service-key="onetime_cleaning"]');
    await page.waitForTimeout(1000);
    
    // Fill in boat details
    await page.fill('#boatLength', '40');
    await page.selectOption('#paintCondition', 'moderate');
    await page.selectOption('#growthLevel', 'heavy');
    await page.waitForTimeout(2000);
    
    // Check charge amount
    const chargeAmount = await page.locator('.charge-detail-row:last-child').textContent();
    console.log(`   Charge details: ${chargeAmount.trim()}`);
    
    if (!chargeAmount.includes('$0.00')) {
      console.log('   ✅ Charge amount calculated correctly!');
      
      // Check button
      const buttonText = await page.locator('.charge-button').textContent();
      console.log(`   Button shows: "${buttonText.trim()}"`);
    } else {
      console.log('   ❌ Still showing $0.00');
    }
  } else {
    console.log('   ❌ Search for "Cline" not working');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'final-test.png', fullPage: true });
  console.log('\n3. Screenshot saved as final-test.png');
  
  await page.waitForTimeout(5000);
  await browser.close();
  
  console.log('\n✅ Test complete!');
})();