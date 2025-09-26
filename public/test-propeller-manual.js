import { chromium } from '@playwright/test';

async function testPropellerServices() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Testing Main Calculator...');
  await page.goto('http://localhost:3000');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(2000); // Give time for buttons to populate
  
  // Check for propeller removal button
  const propellerRemovalBtn = await page.$('.service-option:has-text("Propeller Removal")');
  if (propellerRemovalBtn) {
    const text = await propellerRemovalBtn.textContent();
    console.log('✓ Found Propeller Removal button:', text);
    if (text.includes('$349')) {
      console.log('✓ Price is correct: $349');
    }
  } else {
    console.log('✗ Propeller Removal button not found');
  }
  
  // Check for propeller installation button
  const propellerInstallBtn = await page.$('.service-option:has-text("Propeller Installation")');
  if (propellerInstallBtn) {
    const text = await propellerInstallBtn.textContent();
    console.log('✓ Found Propeller Installation button:', text);
    if (text.includes('$349')) {
      console.log('✓ Price is correct: $349');
    }
  } else {
    console.log('✗ Propeller Installation button not found');
  }
  
  // Test selection and calculation
  if (propellerRemovalBtn) {
    await propellerRemovalBtn.click();
    await page.waitForTimeout(500);
    
    // Check if selected
    const classes = await propellerRemovalBtn.getAttribute('class');
    if (classes && classes.includes('selected')) {
      console.log('✓ Propeller Removal button can be selected');
    }
    
    // Enter boat length and calculate
    await page.fill('#boatLength', '40');
    const nextBtn = await page.$('#nextButton');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      
      const totalCost = await page.$('#totalCostDisplay');
      if (totalCost) {
        const costText = await totalCost.textContent();
        console.log('✓ Total cost displayed:', costText);
        if (costText.includes('349')) {
          console.log('✓ Flat rate calculation correct (not affected by boat length)');
        }
      }
    }
  }
  
  console.log('\nTesting Charge Customer Interface...');
  await page.goto('http://localhost:3000/charge-customer.html');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  
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
      console.log('✓ Cost in charge interface:', costText);
    }
  }
  
  await browser.close();
  console.log('\nTest completed!');
}

testPropellerServices().catch(console.error);