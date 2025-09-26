import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console logs
  page.on('console', msg => {
    if (msg.text().includes('calculateCost') || msg.text().includes('selectedServiceKey')) {
      console.log(`[Console ${msg.type()}]: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  console.log('Testing charge functionality until it works...\n');
  
  // Go to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  console.log('1. Searching for Brian Cline...');
  // Search for Brian
  await page.fill('#customerSearch', 'Brian');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);
  
  // Find and select Brian Cline
  const customers = await page.locator('.customer-item').all();
  let brianFound = false;
  
  for (const customer of customers) {
    const name = await customer.locator('.customer-name').textContent();
    const email = await customer.locator('.customer-email').textContent();
    
    if (email.includes('standardhuman@gmail.com')) {
      console.log(`   Found Brian: ${name} - ${email}`);
      await customer.click();
      brianFound = true;
      await page.waitForTimeout(1000);
      break;
    }
  }
  
  if (!brianFound) {
    console.log('   ❌ Brian not found, using Show Recent...');
    await page.click('button:has-text("Show Recent")');
    await page.waitForTimeout(2000);
    
    // Try to find Brian in recent
    const recentCustomers = await page.locator('.customer-item').all();
    for (const customer of recentCustomers) {
      const email = await customer.locator('.customer-email').textContent();
      if (email.includes('standardhuman@gmail.com')) {
        await customer.click();
        brianFound = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
  }
  
  if (!brianFound) {
    console.log('   ❌ Could not find Brian Cline!');
    await browser.close();
    return;
  }
  
  const selectedInfo = await page.locator('#selectedCustomerInfo').textContent();
  console.log(`   Selected: ${selectedInfo}`);
  
  // Take screenshot after selecting customer
  await page.screenshot({ path: 'test-1-customer-selected.png', fullPage: true });
  
  console.log('\n2. Selecting Item Recovery service...');
  
  // Check the state before clicking
  let state = await page.evaluate(() => {
    return {
      before_click: {
        selectedServiceKey: window.selectedServiceKey,
        serviceData_exists: !!window.serviceData,
        calculateCost_exists: typeof window.calculateCost === 'function',
        totalValue: document.getElementById('totalCostDisplay')?.textContent
      }
    };
  });
  console.log('   State before click:', JSON.stringify(state, null, 2));
  
  // Click Item Recovery
  await page.click('[data-service-key="item_recovery"]');
  await page.waitForTimeout(2000);
  
  // Check state after clicking
  state = await page.evaluate(() => {
    return {
      after_click: {
        selectedServiceKey: window.selectedServiceKey,
        totalValue: document.getElementById('totalCostDisplay')?.textContent,
        chargeAmount: document.querySelector('.charge-detail-row:last-child')?.textContent?.trim()
      }
    };
  });
  console.log('   State after click:', JSON.stringify(state, null, 2));
  
  // Take screenshot after selecting service
  await page.screenshot({ path: 'test-2-service-selected.png', fullPage: true });
  
  // If total is still $0, try to fix it
  if (state.after_click.totalValue === '$0.00' || state.after_click.totalValue === '$0') {
    console.log('\n3. Total still $0, attempting manual fix...');
    
    // Try to manually trigger the calculation
    const fixResult = await page.evaluate(() => {
      const logs = [];
      
      // Make sure selectedServiceKey is set
      if (!window.selectedServiceKey) {
        window.selectedServiceKey = 'item_recovery';
        logs.push('Set selectedServiceKey to item_recovery');
      }
      
      // Re-initialize the display elements
      if (!window.costBreakdownEl || !window.totalCostDisplayEl) {
        window.costBreakdownEl = document.getElementById('costBreakdown');
        window.totalCostDisplayEl = document.getElementById('totalCostDisplay');
        logs.push('Re-initialized display elements');
      }
      
      // Call calculateCost
      if (window.calculateCost) {
        window.calculateCost();
        logs.push('Called calculateCost()');
      }
      
      // Get the new total
      const newTotal = document.getElementById('totalCostDisplay')?.textContent;
      
      // Update charge summary
      if (window.updateChargeSummary) {
        window.updateChargeSummary();
        logs.push('Called updateChargeSummary()');
      }
      
      const chargeAmount = document.querySelector('.charge-detail-row:last-child')?.textContent?.trim();
      
      return {
        logs: logs,
        newTotal: newTotal,
        chargeAmount: chargeAmount,
        selectedServiceKey: window.selectedServiceKey
      };
    });
    
    console.log('   Fix attempt logs:', fixResult.logs);
    console.log('   New total:', fixResult.newTotal);
    console.log('   Charge amount:', fixResult.chargeAmount);
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-3-after-manual-fix.png', fullPage: true });
  }
  
  // Check if charge button is enabled
  console.log('\n4. Checking charge button...');
  const chargeButton = await page.locator('#chargeButton, .charge-button').first();
  if (await chargeButton.count() > 0) {
    const isDisabled = await chargeButton.isDisabled();
    const buttonText = await chargeButton.textContent();
    console.log(`   Button text: "${buttonText.trim()}"`);
    console.log(`   Button enabled: ${!isDisabled}`);
    
    if (!isDisabled && !buttonText.includes('$0')) {
      console.log('\n5. ✅ SUCCESS! Charge button is ready with amount!');
      await page.screenshot({ path: 'test-success.png', fullPage: true });
      
      // Test the actual charge
      console.log('\n6. Testing charge (dry run - not actually charging)...');
      // We won't actually click it to avoid charging your card
      console.log('   Would charge:', buttonText.trim());
    } else {
      console.log('\n5. ❌ Button still shows $0 or is disabled');
      
      // One more attempt - try selecting a different service then back
      console.log('\n6. Trying service switch workaround...');
      await page.click('[data-service-key="underwater_inspection"]');
      await page.waitForTimeout(1000);
      await page.click('[data-service-key="item_recovery"]');
      await page.waitForTimeout(2000);
      
      const finalAmount = await page.locator('.charge-detail-row:last-child').textContent();
      console.log('   Final charge amount after switch:', finalAmount.trim());
      
      await page.screenshot({ path: 'test-4-after-switch.png', fullPage: true });
    }
  } else {
    console.log('   ❌ Charge button not found!');
  }
  
  // Final state check
  console.log('\n7. Final state:');
  const finalState = await page.evaluate(() => {
    return {
      selectedServiceKey: window.selectedServiceKey,
      totalCostDisplay: document.getElementById('totalCostDisplay')?.textContent,
      chargeDetailAmount: document.querySelector('.charge-detail-row:last-child')?.textContent?.trim(),
      chargeButtonText: document.querySelector('#chargeButton, .charge-button')?.textContent?.trim()
    };
  });
  console.log(JSON.stringify(finalState, null, 2));
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test complete! Check screenshots:');
  console.log('- test-1-customer-selected.png');
  console.log('- test-2-service-selected.png');
  console.log('- test-3-after-manual-fix.png');
  console.log('- test-4-after-switch.png');
  console.log('- test-success.png (if successful)');
})();