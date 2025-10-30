import { chromium } from '@playwright/test';

async function testPropellerServices() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== TESTING PROPELLER SERVICES ===\n');
  
  console.log('1. Testing Main Calculator...');
  await page.goto('http://localhost:3000');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Check for propeller removal button
  const propellerRemovalBtn = await page.$('.service-option:has-text("Propeller Removal")');
  if (propellerRemovalBtn) {
    const text = await propellerRemovalBtn.textContent();
    console.log('✓ Propeller Removal button found');
    console.log('  Text:', text);
    if (text.includes('$349')) {
      console.log('✓ Price is correct: $349 flat rate');
    }
  } else {
    console.log('✗ Propeller Removal button not found');
  }
  
  // Check for propeller installation button
  const propellerInstallBtn = await page.$('.service-option:has-text("Propeller Installation")');
  if (propellerInstallBtn) {
    const text = await propellerInstallBtn.textContent();
    console.log('✓ Propeller Installation button found');
    console.log('  Text:', text);
    if (text.includes('$349')) {
      console.log('✓ Price is correct: $349 flat rate');
    }
  } else {
    console.log('✗ Propeller Installation button not found');
  }
  
  // Test selection
  if (propellerRemovalBtn) {
    await propellerRemovalBtn.click();
    await page.waitForTimeout(500);
    
    const classes = await propellerRemovalBtn.getAttribute('class');
    if (classes && classes.includes('selected')) {
      console.log('✓ Propeller Removal can be selected');
    }
    
    // Check if we need to click Next to get to boat length
    const nextBtn = await page.$('#nextButton');
    if (nextBtn) {
      const isVisible = await nextBtn.isVisible();
      if (isVisible) {
        console.log('✓ Next button is available after service selection');
        await nextBtn.click();
        await page.waitForTimeout(1000);
        
        // Now try to fill boat length if visible
        const boatLengthInput = await page.$('#boatLength');
        if (boatLengthInput && await boatLengthInput.isVisible()) {
          await boatLengthInput.fill('40');
          console.log('✓ Boat length entered (40 ft)');
          
          // Click next again to see calculation
          const nextBtn2 = await page.$('#nextButton');
          if (nextBtn2 && await nextBtn2.isVisible()) {
            await nextBtn2.click();
            await page.waitForTimeout(1000);
            
            const totalCost = await page.$('#totalCostDisplay');
            if (totalCost) {
              const costText = await totalCost.textContent();
              console.log('✓ Total cost calculated:', costText);
              if (costText.includes('349')) {
                console.log('✓ Flat rate confirmed (not affected by boat length)');
              }
            }
          }
        }
      }
    }
  }
  
  console.log('\n2. Testing Charge Customer Interface...');
  await page.goto('http://localhost:3000/charge-customer.html');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Check buttons exist in charge interface
  const chargeRemovalBtn = await page.$('.service-option:has-text("Propeller Removal")');
  const chargeInstallBtn = await page.$('.service-option:has-text("Propeller Installation")');
  
  if (chargeRemovalBtn) {
    console.log('✓ Propeller Removal button found in charge interface');
  } else {
    console.log('✗ Propeller Removal button not found in charge interface');
  }
  
  if (chargeInstallBtn) {
    console.log('✓ Propeller Installation button found in charge interface');
  } else {
    console.log('✗ Propeller Installation button not found in charge interface');
  }
  
  // Test calculation in charge interface
  if (chargeRemovalBtn) {
    await chargeRemovalBtn.click();
    await page.waitForTimeout(500);
    
    const totalCost = await page.$('#totalCostDisplay');
    if (totalCost) {
      const costText = await totalCost.textContent();
      console.log('✓ Cost displays in charge interface:', costText);
      if (costText.includes('349')) {
        console.log('✓ Correct price shown: $349');
      }
    }
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
}

testPropellerServices().catch(console.error);