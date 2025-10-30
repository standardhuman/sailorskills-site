import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('❌ Page error:', error.message));
  
  // Listen for network failures
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url(), '-', request.failure().errorText);
  });
  
  console.log('Testing Charge Customer page manually...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  console.log('1. Page loaded\n');
  
  await page.waitForTimeout(2000);
  
  // Check if service buttons are loaded
  const serviceButtonCount = await page.locator('#serviceButtons .service-option').count();
  console.log(`2. Service buttons loaded: ${serviceButtonCount} buttons\n`);
  
  // Try clicking "Show Recent" button
  console.log('3. Clicking "Show Recent" button...');
  const showRecentButton = await page.locator('button:has-text("Show Recent")').first();
  await showRecentButton.click();
  console.log('   Button clicked\n');
  
  await page.waitForTimeout(3000);
  
  // Check customer list
  const customerCount = await page.locator('.customer-item').count();
  console.log(`4. Customers loaded: ${customerCount} customers`);
  
  if (customerCount === 0) {
    // Check error message
    const errorMsg = await page.locator('.no-customers').textContent();
    console.log(`   Message displayed: "${errorMsg}"\n`);
    
    // Try manual API call from browser context
    console.log('5. Testing API call directly from browser context...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/stripe-customers?limit=5');
        const data = await response.json();
        return { success: true, count: data.customers?.length || 0, customers: data.customers?.slice(0, 2) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (apiResponse.success) {
      console.log(`   ✓ API call successful: Found ${apiResponse.count} customers`);
      if (apiResponse.customers && apiResponse.customers.length > 0) {
        console.log('   First customer:', apiResponse.customers[0].name, '-', apiResponse.customers[0].email);
      }
    } else {
      console.log(`   ❌ API call failed: ${apiResponse.error}`);
    }
  } else {
    console.log('   ✓ Customers loaded successfully!');
    
    // Click first customer
    await page.locator('.customer-item').first().click();
    const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
    console.log(`   Selected: ${selectedInfo}`);
  }
  
  // Keep browser open for manual inspection
  console.log('\n6. Browser will stay open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('\nTest complete!');
})();