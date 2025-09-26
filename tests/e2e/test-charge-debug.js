import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[Console ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  console.log('Testing charge customer functionality with debugging...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  console.log('1. Page loaded, taking initial screenshot...');
  await page.screenshot({ path: 'debug-1-initial.png', fullPage: true });
  
  // Click "Show Recent" to load customers
  console.log('\n2. Loading recent customers...');
  await page.click('button:has-text("Show Recent")');
  await page.waitForTimeout(2000);
  
  const customerCount = await page.locator('.customer-item').count();
  console.log(`   Found ${customerCount} customers`);
  
  if (customerCount > 0) {
    // Select first customer
    console.log('\n3. Selecting first customer...');
    await page.locator('.customer-item').first().click();
    await page.waitForTimeout(1000);
    
    const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
    console.log(`   Selected: ${selectedInfo}`);
    await page.screenshot({ path: 'debug-2-customer-selected.png', fullPage: true });
    
    // Select Item Recovery service
    console.log('\n4. Selecting Item Recovery service...');
    const itemRecoveryButton = await page.locator('[data-service-key="item_recovery"]');
    if (await itemRecoveryButton.count() > 0) {
      await itemRecoveryButton.click();
      console.log('   Clicked Item Recovery button');
      await page.waitForTimeout(2000);
      
      // Check if service is selected
      const isSelected = await itemRecoveryButton.evaluate(el => el.classList.contains('selected'));
      console.log(`   Button selected state: ${isSelected}`);
      
      // Check hidden elements
      console.log('\n5. Checking hidden calculation elements...');
      
      // Check if totalCostDisplay exists and has value
      const totalCostDisplay = await page.locator('#totalCostDisplay');
      if (await totalCostDisplay.count() > 0) {
        const totalValue = await totalCostDisplay.textContent();
        console.log(`   Hidden #totalCostDisplay value: "${totalValue}"`);
      } else {
        console.log('   ❌ #totalCostDisplay element not found!');
      }
      
      // Check if costBreakdown exists
      const costBreakdown = await page.locator('#costBreakdown');
      if (await costBreakdown.count() > 0) {
        const breakdownContent = await costBreakdown.textContent();
        console.log(`   Hidden #costBreakdown content: "${breakdownContent}"`);
      } else {
        console.log('   ❌ #costBreakdown element not found!');
      }
      
      // Check the visible charge summary
      console.log('\n6. Checking visible charge summary...');
      const chargeDetails = await page.locator('#chargeDetails');
      if (await chargeDetails.count() > 0) {
        const detailsContent = await chargeDetails.textContent();
        console.log('   Charge details content:');
        console.log(`   "${detailsContent.replace(/\s+/g, ' ').trim()}"`);
        
        // Check specifically for the total amount row
        const totalAmountRow = await page.locator('.charge-detail-row:last-child');
        if (await totalAmountRow.count() > 0) {
          const totalText = await totalAmountRow.textContent();
          console.log(`   Total Amount row: "${totalText.trim()}"`);
        }
      } else {
        console.log('   ❌ #chargeDetails element not found!');
      }
      
      await page.screenshot({ path: 'debug-3-service-selected.png', fullPage: true });
      
      // Check if charge button is enabled
      console.log('\n7. Checking charge button...');
      const chargeButton = await page.locator('#chargeButton');
      if (await chargeButton.count() > 0) {
        const isDisabled = await chargeButton.isDisabled();
        const buttonText = await chargeButton.textContent();
        console.log(`   Button text: "${buttonText}"`);
        console.log(`   Button disabled: ${isDisabled}`);
      } else {
        console.log('   ❌ Charge button not found!');
      }
      
      // Execute JavaScript to check variables
      console.log('\n8. Checking JavaScript variables...');
      const jsCheck = await page.evaluate(() => {
        return {
          selectedServiceKey: window.selectedServiceKey || 'undefined',
          serviceData: window.serviceData ? Object.keys(window.serviceData).join(', ') : 'undefined',
          calculateCostExists: typeof window.calculateCost === 'function',
          updateChargeSummaryExists: typeof window.updateChargeSummary === 'function',
          selectedCustomer: window.selectedCustomer ? window.selectedCustomer.name : 'undefined'
        };
      });
      console.log('   JavaScript state:', JSON.stringify(jsCheck, null, 2));
      
      // Try manually calling calculateCost
      console.log('\n9. Manually calling calculateCost()...');
      await page.evaluate(() => {
        if (window.calculateCost) {
          window.calculateCost();
        }
      });
      await page.waitForTimeout(1000);
      
      // Check total again after manual call
      const totalAfterManual = await totalCostDisplay.textContent();
      console.log(`   #totalCostDisplay after manual call: "${totalAfterManual}"`);
      
      // Try manually calling updateChargeSummary
      console.log('\n10. Manually calling updateChargeSummary()...');
      await page.evaluate(() => {
        if (window.updateChargeSummary) {
          window.updateChargeSummary();
        }
      });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'debug-4-after-manual-calls.png', fullPage: true });
      
      // Final check of charge details
      const finalDetails = await chargeDetails.textContent();
      console.log('\n11. Final charge details:');
      console.log(`   "${finalDetails.replace(/\s+/g, ' ').trim()}"`);
      
    } else {
      console.log('   ❌ Item Recovery button not found!');
      
      // Check what service buttons exist
      const allServiceButtons = await page.locator('.service-option').all();
      console.log(`   Found ${allServiceButtons.length} service buttons`);
      for (let i = 0; i < Math.min(3, allServiceButtons.length); i++) {
        const btnText = await allServiceButtons[i].textContent();
        const btnKey = await allServiceButtons[i].getAttribute('data-service-key');
        console.log(`   Button ${i + 1}: "${btnText.trim()}" (key: ${btnKey})`);
      }
    }
  } else {
    console.log('   ❌ No customers found!');
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('Debug test complete! Check the screenshots:');
  console.log('- debug-1-initial.png');
  console.log('- debug-2-customer-selected.png');
  console.log('- debug-3-service-selected.png');
  console.log('- debug-4-after-manual-calls.png');
})();