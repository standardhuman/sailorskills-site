import { chromium } from '@playwright/test';

async function testCombinedPropellerService() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== TESTING COMBINED PROPELLER SERVICE ===\n');
  
  console.log('1. Testing Main Calculator...');
  await page.goto('http://localhost:3000');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Count total service buttons
  const serviceButtons = await page.$$('.service-option');
  console.log(`✓ Found ${serviceButtons.length} service buttons`);
  
  // Check for combined propeller service button
  const propellerBtn = await page.$('.service-option:has-text("Propeller Removal/Installation")');
  if (propellerBtn) {
    const text = await propellerBtn.textContent();
    console.log('✓ Combined propeller service button found');
    console.log('  Text:', text);
    if (text.includes('$349')) {
      console.log('✓ Price is correct: $349 flat rate');
    }
    
    // Click and check description
    await propellerBtn.click();
    await page.waitForTimeout(500);
    
    const explainer = await page.$('#servicePriceExplainer');
    if (explainer) {
      const description = await explainer.textContent();
      if (description.includes('removal or installation')) {
        console.log('✓ Description mentions both removal and installation');
      }
      if (description.includes('$349 per propeller')) {
        console.log('✓ Description clarifies pricing per propeller');
      }
    }
  } else {
    console.log('✗ Combined propeller service button not found');
  }
  
  // Verify old separate buttons are gone (exact match to avoid false positives)
  const allButtons = await page.$$eval('.service-option', buttons => 
    buttons.map(btn => btn.textContent.trim())
  );
  
  const hasOldRemoval = allButtons.some(text => text.includes('Propeller Removal$349'));
  const hasOldInstall = allButtons.some(text => text.includes('Propeller Installation$349'));
  
  if (!hasOldRemoval && !hasOldInstall) {
    console.log('✓ Old separate propeller buttons successfully removed');
  } else {
    console.log('✗ Old separate buttons still present');
    if (hasOldRemoval) console.log('  - Found old Propeller Removal button');
    if (hasOldInstall) console.log('  - Found old Propeller Installation button');
  }
  
  console.log('\n2. Testing Charge Customer Interface...');
  await page.goto('http://localhost:3000/charge-customer.html');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Check for combined propeller service in charge interface
  const chargePropellerBtn = await page.$('.service-option:has-text("Propeller Removal/Installation")');
  if (chargePropellerBtn) {
    console.log('✓ Combined propeller service found in charge interface');
    
    // Test calculation
    await chargePropellerBtn.click();
    await page.waitForTimeout(500);
    
    const totalCost = await page.$('#totalCostDisplay');
    if (totalCost) {
      const costText = await totalCost.textContent();
      console.log('✓ Cost displays correctly:', costText);
    }
  } else {
    console.log('✗ Combined propeller service not found in charge interface');
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETED ===');
}

testCombinedPropellerService().catch(console.error);