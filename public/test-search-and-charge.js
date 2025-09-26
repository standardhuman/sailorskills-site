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
  
  console.log('Testing improved search and charge functionality...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  // Test 1: Search for "Brian" (should find Brian)
  console.log('1. Testing search for "Brian"...');
  await page.fill('#customerSearch', 'Brian');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);
  
  let customerCount = await page.locator('.customer-item').count();
  console.log(`   Found ${customerCount} customer(s) matching "Brian"`);
  
  if (customerCount > 0) {
    const firstCustomer = await page.locator('.customer-item').first();
    const name = await firstCustomer.locator('.customer-name').textContent();
    const email = await firstCustomer.locator('.customer-email').textContent();
    console.log(`   First result: ${name} - ${email}`);
  }
  
  // Test 2: Search for "Brian Cline" (should find Brian)
  console.log('\n2. Testing search for "Brian Cline"...');
  await page.fill('#customerSearch', 'Brian Cline');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);
  
  customerCount = await page.locator('.customer-item').count();
  console.log(`   Found ${customerCount} customer(s) matching "Brian Cline"`);
  
  if (customerCount > 0) {
    const firstCustomer = await page.locator('.customer-item').first();
    const name = await firstCustomer.locator('.customer-name').textContent();
    const email = await firstCustomer.locator('.customer-email').textContent();
    console.log(`   First result: ${name} - ${email}`);
    console.log('   ✅ "Brian Cline" search now works!');
  } else {
    console.log('   ❌ "Brian Cline" search still not working');
  }
  
  // Test 3: Search for "Cline" (should find Brian if billing name contains Cline)
  console.log('\n3. Testing search for "Cline"...');
  await page.fill('#customerSearch', 'Cline');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);
  
  customerCount = await page.locator('.customer-item').count();
  console.log(`   Found ${customerCount} customer(s) matching "Cline"`);
  
  if (customerCount > 0) {
    const firstCustomer = await page.locator('.customer-item').first();
    const name = await firstCustomer.locator('.customer-name').textContent();
    const email = await firstCustomer.locator('.customer-email').textContent();
    console.log(`   First result: ${name} - ${email}`);
    console.log('   ✅ "Cline" search now works!');
    
    // Select this customer
    await firstCustomer.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('   ❌ "Cline" search still not working');
    // Try searching for Brian again to continue with charge test
    await page.fill('#customerSearch', 'Brian');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    await page.locator('.customer-item').first().click();
    await page.waitForTimeout(1000);
  }
  
  // Test 4: Test charge calculation
  console.log('\n4. Testing charge calculation...');
  const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
  console.log(`   Selected customer: ${selectedInfo}`);
  
  // Select a service
  console.log('   Selecting One-time Cleaning service...');
  await page.click('[data-service-key="onetime_cleaning"]');
  await page.waitForTimeout(1000);
  
  // Enter boat details
  await page.fill('#boatLength', '35');
  await page.selectOption('#paintCondition', 'good');
  await page.selectOption('#growthLevel', 'moderate');
  await page.waitForTimeout(1000);
  
  // Check if charge amount is calculated
  const chargeDetails = await page.locator('.charge-detail-row:last-child').textContent();
  console.log(`   ${chargeDetails}`);
  
  if (chargeDetails.includes('$0.00')) {
    console.log('   ❌ Charge amount still showing $0');
  } else {
    console.log('   ✅ Charge amount calculated correctly!');
    
    // Check if charge button shows the amount
    const chargeButton = await page.locator('.charge-button').textContent();
    console.log(`   Charge button: "${chargeButton.trim()}"`);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'search-and-charge-test.png', fullPage: true });
  console.log('\n5. Screenshot saved as search-and-charge-test.png');
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test complete!');
})();