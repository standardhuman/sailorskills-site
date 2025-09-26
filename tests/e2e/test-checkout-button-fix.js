import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newContext().then(ctx => ctx.newPage());

console.log('Testing Checkout Button placement fix:\n');
await page.goto('http://localhost:3000/diving');
await page.waitForTimeout(1500);

// Test recurring cleaning
console.log('1. Testing RECURRING CLEANING:');
await page.click('div[data-service-key="recurring_cleaning"]');
await page.waitForTimeout(1000);

// Check if checkout button is visible at step 0
let checkoutVisible = await page.$('#checkout-button') !== null;
console.log('   After selecting service - Checkout button:', checkoutVisible ? 'VISIBLE ❌' : 'HIDDEN ✓');

// Go through all steps to results
console.log('   Going through all steps...');
for (let i = 0; i < 8; i++) {
    await page.click('#nextButton');
    await page.waitForTimeout(500);
}

// Now check at results page
checkoutVisible = await page.$('#checkout-button') !== null;
const currentHeading = await page.$eval('.form-step[style*="block"] h2', el => el.textContent);
console.log('   At results page:', currentHeading);
console.log('   Checkout button:', checkoutVisible ? 'VISIBLE ✓' : 'HIDDEN ❌');

// Go back to start
await page.reload();
await page.waitForTimeout(1500);

// Test one-time cleaning
console.log('\n2. Testing ONE-TIME CLEANING:');
await page.click('div[data-service-key="onetime_cleaning"]');
await page.waitForTimeout(1000);

checkoutVisible = await page.$('#checkout-button') !== null;
console.log('   After selecting service - Checkout button:', checkoutVisible ? 'VISIBLE ❌' : 'HIDDEN ✓');

// Test flat rate service
await page.reload();
await page.waitForTimeout(1500);

console.log('\n3. Testing ITEM RECOVERY (flat rate):');
await page.click('div[data-service-key="item_recovery"]');
await page.waitForTimeout(1000);

checkoutVisible = await page.$('#checkout-button') !== null;
console.log('   After selecting service - Checkout button:', checkoutVisible ? 'VISIBLE ❌' : 'HIDDEN ✓');

// Click View Estimate
await page.click('#nextButton');
await page.waitForTimeout(1000);

checkoutVisible = await page.$('#checkout-button') !== null;
console.log('   At results page - Checkout button:', checkoutVisible ? 'VISIBLE ✓' : 'HIDDEN ❌');

await browser.close();
console.log('\n✅ Test completed');
