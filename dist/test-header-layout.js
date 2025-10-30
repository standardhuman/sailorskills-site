import { chromium } from '@playwright/test';

async function testHeaderLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== TESTING HEADER LAYOUT ===\n');
  
  console.log('1. Testing Main Calculator Header...');
  await page.goto('http://localhost:3000');
  
  // Check for the new consolidated header
  const header = await page.$('h2:has-text("Select a service to see more details")');
  if (header) {
    console.log('✓ New consolidated header found: "Select a service to see more details"');
  } else {
    console.log('✗ New header not found');
  }
  
  // Check that "Cost Estimator" title is removed
  const oldTitle = await page.$('.calculator-title:has-text("Cost Estimator")');
  if (!oldTitle) {
    console.log('✓ Old "Cost Estimator" title successfully removed');
  } else {
    console.log('✗ Old "Cost Estimator" title still present');
  }
  
  // Check that service description placeholder is empty initially
  const servicePriceExplainer = await page.$('#servicePriceExplainer');
  if (servicePriceExplainer) {
    const text = await servicePriceExplainer.textContent();
    if (text === '') {
      console.log('✓ Service description area is empty initially (as intended)');
    } else {
      console.log('  Service description shows:', text);
    }
  }
  
  console.log('\n2. Testing Charge Customer Interface Header...');
  await page.goto('http://localhost:3000/charge-customer.html');
  
  // Check for the new consolidated header in charge interface
  const chargeHeader = await page.$('h3:has-text("Select a service to see more details")');
  if (chargeHeader) {
    console.log('✓ New consolidated header found in charge interface');
  } else {
    console.log('✗ New header not found in charge interface');
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETED ===');
}

testHeaderLayout().catch(console.error);