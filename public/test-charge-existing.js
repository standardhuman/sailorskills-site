import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Charge Customer functionality with existing customer...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  console.log('1. Loading recent customers...');
  await page.waitForTimeout(2000);
  
  // Check if customers loaded
  const customerItems = await page.locator('.customer-item').count();
  console.log(`   Found ${customerItems} recent customer(s)\n`);
  
  if (customerItems > 0) {
    // Click the first customer (Gavin Corn)
    console.log('2. Selecting first customer...');
    await page.locator('.customer-item').first().click();
    await page.waitForTimeout(1000);
    
    const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
    console.log(`   Selected: ${selectedInfo}\n`);
    
    // Select a service
    console.log('3. Selecting service...');
    const serviceButtons = await page.locator('#serviceButtons .service-option').count();
    console.log(`   Available services: ${serviceButtons}`);
    
    if (serviceButtons > 0) {
      // Click Item Recovery for simple flat rate
      await page.click('[data-service-key="item_recovery"]');
      await page.waitForTimeout(500);
      console.log('   Selected: Item Recovery ($150 flat)\n');
      
      await page.waitForTimeout(1000);
      
      // Check the charge summary
      console.log('4. Checking charge summary...');
      const summaryExists = await page.locator('.charge-summary').count();
      if (summaryExists > 0) {
        const chargeDetails = await page.locator('.charge-details').textContent();
        console.log('   Charge details:', chargeDetails.replace(/\s+/g, ' ').trim());
        
        const totalAmount = await page.locator('.charge-detail-row:last-child').textContent();
        console.log(`   ${totalAmount.trim()}\n`);
      } else {
        console.log('   ❌ Charge summary not visible\n');
      }
      
      // Check if charge button is available
      const chargeButton = await page.locator('.charge-button').count();
      console.log(`5. Charge button available: ${chargeButton > 0 ? 'YES ✓' : 'NO ❌'}`);
      
      if (chargeButton > 0) {
        const buttonText = await page.locator('.charge-button').textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        console.log('   Ready to charge customer!');
        console.log('   (Not executing actual charge in test)\n');
        
        // Test the charge button is clickable
        const isDisabled = await page.locator('.charge-button').isDisabled();
        console.log(`   Button enabled: ${!isDisabled ? 'YES ✓' : 'NO ❌'}`);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'charge-customer-test.png', fullPage: true });
      console.log('\n6. Screenshot saved as charge-customer-test.png');
      
      // Now test with a per-foot service
      console.log('\n7. Testing with per-foot service...');
      await page.click('[data-service-key="onetime_cleaning"]');
      await page.waitForTimeout(500);
      console.log('   Selected: One-time Cleaning');
      
      // Check if boat details fields appear
      const boatLengthField = await page.locator('#boatLength').count();
      console.log(`   Boat length field visible: ${boatLengthField > 0 ? 'YES ✓' : 'NO ❌'}`);
      
      if (boatLengthField > 0) {
        await page.fill('#boatLength', '40');
        console.log('   Entered boat length: 40 feet');
        
        // Check for paint/growth fields
        const paintField = await page.locator('#paintCondition').count();
        const growthField = await page.locator('#growthLevel').count();
        
        if (paintField > 0) {
          await page.selectOption('#paintCondition', { index: 1 });
          console.log('   Selected paint condition');
        }
        
        if (growthField > 0) {
          await page.selectOption('#growthLevel', { index: 1 });
          console.log('   Selected growth level');
        }
        
        await page.waitForTimeout(1000);
        
        // Check updated charge summary
        const updatedTotal = await page.locator('.charge-detail-row:last-child').textContent();
        console.log(`   Updated total: ${updatedTotal.trim()}`);
      }
    }
  } else {
    console.log('   ❌ No customers found');
    console.log('   Check if API server is running on port 3001');
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test complete!');
  console.log('\nNOTE: Customer "Brian Cline" does not exist in Stripe.');
  console.log('Available customers include: Gavin Corn, Kathleen Eiswald, Hans Hansen, etc.');
})();