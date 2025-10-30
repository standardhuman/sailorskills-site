import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Charge Customer functionality...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  console.log('1. Searching for customer "Brian Cline"...');
  
  // Enter search term
  await page.fill('#customerSearch', 'Brian Cline');
  await page.waitForTimeout(500);
  
  // Click search button
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);
  
  // Check if any customers are found
  const customerItems = await page.locator('.customer-item').count();
  console.log(`   Found ${customerItems} customer(s) in search results\n`);
  
  if (customerItems > 0) {
    // Get customer details
    const customers = await page.locator('.customer-item').all();
    for (let i = 0; i < customers.length; i++) {
      const nameElement = await customers[i].locator('.customer-name');
      const emailElement = await customers[i].locator('.customer-email');
      const name = await nameElement.textContent();
      const email = await emailElement.textContent();
      console.log(`   Customer ${i + 1}:`);
      console.log(`   - Name: ${name}`);
      console.log(`   - Email: ${email}`);
      
      // Click to select the first Brian Cline if found
      if (name && name.includes('Brian Cline')) {
        console.log('\n2. Selecting Brian Cline...');
        await customers[i].click();
        await page.waitForTimeout(1000);
        
        // Check if customer is selected
        const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
        console.log(`   Selected: ${selectedInfo}\n`);
        
        // Select a service
        console.log('3. Selecting service...');
        const serviceButtons = await page.locator('#serviceButtons .service-option').count();
        console.log(`   Available services: ${serviceButtons}`);
        
        if (serviceButtons > 0) {
          // Click One-time Cleaning
          await page.click('[data-service-key="onetime_cleaning"]');
          await page.waitForTimeout(500);
          console.log('   Selected: One-time Cleaning\n');
          
          // Enter boat details
          console.log('4. Entering boat details...');
          await page.fill('#boatLength', '35');
          console.log('   Boat length: 35 feet');
          
          // Select paint condition
          await page.selectOption('#paintCondition', 'good');
          console.log('   Paint condition: Good');
          
          // Select growth level
          await page.selectOption('#growthLevel', 'moderate');
          console.log('   Growth level: Moderate\n');
          
          await page.waitForTimeout(1000);
          
          // Check the charge summary
          console.log('5. Checking charge summary...');
          const chargeAmount = await page.locator('.charge-summary .charge-detail-row:last-child').textContent();
          console.log(`   ${chargeAmount}\n`);
          
          // Take screenshot
          await page.screenshot({ path: 'charge-customer-brian.png', fullPage: true });
          console.log('6. Screenshot saved as charge-customer-brian.png');
          
          // Check if charge button is available
          const chargeButton = await page.locator('.charge-button').isVisible();
          console.log(`\n7. Charge button available: ${chargeButton ? 'YES ✓' : 'NO ❌'}`);
          
          if (chargeButton) {
            console.log('   Ready to charge customer!');
            console.log('   (Not executing actual charge in test)');
          }
        }
        break;
      }
    }
  } else {
    console.log('   ❌ No customers found with search "Brian Cline"');
    console.log('   This could mean:');
    console.log('   - The customer doesn\'t exist in Stripe');
    console.log('   - The API server is not running');
    console.log('   - There\'s an issue with the search functionality');
    
    // Try to check if API is responding
    console.log('\n2. Checking API server...');
    const errorMessage = await page.locator('.no-customers').textContent();
    console.log(`   Message: ${errorMessage}`);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test complete!');
})();