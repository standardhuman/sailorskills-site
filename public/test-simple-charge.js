import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for all console messages
  page.on('console', msg => {
    if (msg.text().includes('calculateCost') || msg.text().includes('error')) {
      console.log(`[${msg.type()}]: ${msg.text()}`);
    }
  });
  
  console.log('Simple test of charge calculation...\n');
  
  // Go directly to charge customer page
  await page.goto('http://localhost:3000/charge-customer.html');
  await page.waitForTimeout(2000);
  
  // Load recent customers
  await page.click('button:has-text("Show Recent")');
  await page.waitForTimeout(2000);
  
  // Select first customer
  await page.locator('.customer-item').first().click();
  await page.waitForTimeout(500);
  
  console.log('1. Before clicking Item Recovery:');
  let result = await page.evaluate(() => {
    return {
      selectedServiceKey: window.selectedServiceKey,
      costBreakdownEl: document.getElementById('costBreakdown') ? 'exists' : 'null',
      totalCostDisplayEl: document.getElementById('totalCostDisplay') ? 'exists' : 'null',
      totalValue: document.getElementById('totalCostDisplay')?.textContent || 'N/A'
    };
  });
  console.log(JSON.stringify(result, null, 2));
  
  // Click Item Recovery
  console.log('\n2. Clicking Item Recovery...');
  await page.click('[data-service-key="item_recovery"]');
  await page.waitForTimeout(1000);
  
  console.log('\n3. After clicking Item Recovery:');
  result = await page.evaluate(() => {
    return {
      selectedServiceKey: window.selectedServiceKey,
      totalValue: document.getElementById('totalCostDisplay')?.textContent || 'N/A',
      breakdownContent: document.getElementById('costBreakdown')?.textContent || 'N/A'
    };
  });
  console.log(JSON.stringify(result, null, 2));
  
  // Try to manually trigger calculation with console logging
  console.log('\n4. Manually calling calculateCost with debug...');
  const calcResult = await page.evaluate(() => {
    // Add temporary console logging
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    try {
      // Check if we have the service data
      const hasServiceData = window.serviceData && window.serviceData['item_recovery'];
      logs.push(`Has serviceData: ${hasServiceData}`);
      
      if (hasServiceData) {
        logs.push(`Item Recovery rate: ${window.serviceData['item_recovery'].rate}`);
      }
      
      // Try to call calculateCost
      if (window.calculateCost) {
        window.calculateCost();
        logs.push('calculateCost() called');
      } else {
        logs.push('calculateCost is not defined!');
      }
      
      // Get the result
      const totalAfter = document.getElementById('totalCostDisplay')?.textContent || 'N/A';
      
      // Restore console.log
      console.log = originalLog;
      
      return {
        logs: logs,
        totalAfter: totalAfter,
        selectedServiceKey: window.selectedServiceKey
      };
    } catch (error) {
      return {
        error: error.toString(),
        logs: logs
      };
    }
  });
  console.log('Debug logs:', calcResult.logs);
  console.log('Total after manual calc:', calcResult.totalAfter);
  console.log('Selected service key:', calcResult.selectedServiceKey);
  
  // Check the charge summary
  console.log('\n5. Checking charge summary:');
  const chargeAmount = await page.locator('.charge-detail-row:last-child').textContent();
  console.log('Charge amount row:', chargeAmount.trim());
  
  // Try calling updateChargeSummary manually
  console.log('\n6. Manually calling updateChargeSummary...');
  await page.evaluate(() => {
    if (window.updateChargeSummary) {
      window.updateChargeSummary();
    }
  });
  await page.waitForTimeout(500);
  
  const finalAmount = await page.locator('.charge-detail-row:last-child').textContent();
  console.log('Final charge amount:', finalAmount.trim());
  
  await page.screenshot({ path: 'simple-test.png', fullPage: true });
  
  await page.waitForTimeout(2000);
  await browser.close();
  
  console.log('\n✓ Test complete');
})();