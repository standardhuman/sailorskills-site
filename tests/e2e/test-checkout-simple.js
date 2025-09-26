import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newContext().then(ctx => ctx.newPage());

console.log('Testing Checkout Button fix:\n');
await page.goto('http://localhost:3000/diving');
await page.waitForTimeout(1500);

// Test recurring cleaning at selection
console.log('RECURRING CLEANING:');
await page.click('div[data-service-key="recurring_cleaning"]');
await page.waitForTimeout(1000);

let checkoutBtn = await page.$('#checkout-button');
console.log('  Step 0 (service selection): Checkout button', checkoutBtn ? 'EXISTS ❌' : 'NOT FOUND ✓');

// Click through to boat length
await page.click('#nextButton');
await page.waitForTimeout(1000);

checkoutBtn = await page.$('#checkout-button');
console.log('  Step 1 (boat length): Checkout button', checkoutBtn ? 'EXISTS ❌' : 'NOT FOUND ✓');

await page.screenshot({ path: 'checkout-button-fixed.png' });
console.log('\nScreenshot saved. The checkout button should NOT appear until the final results page.');

await browser.close();
