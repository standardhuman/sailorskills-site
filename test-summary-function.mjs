import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing updateChargeSummary function...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Check if updateChargeSummary exists
console.log('1. Checking if updateChargeSummary exists:');
let hasFunction = await page.evaluate(() => typeof window.updateChargeSummary);
console.log(`   window.updateChargeSummary type: ${hasFunction}`);

// Click service button
console.log('\n2. Clicking Recurring Cleaning:');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(1000);

// Check service key and if function was called
let serviceKey = await page.evaluate(() => window.currentServiceKey);
console.log(`   window.currentServiceKey: ${serviceKey}`);

// Call updateChargeSummary manually
console.log('\n3. Calling updateChargeSummary manually:');
await page.evaluate(() => {
    if (window.updateChargeSummary) {
        window.updateChargeSummary();
        return 'Function called';
    }
    return 'Function not found';
});

await page.waitForTimeout(500);

// Check button state after manual call
let isDisabled = await page.locator('#chargeButton').isDisabled();
console.log(`   Charge button disabled after manual call: ${isDisabled}`);

// Check button text
let buttonText = await page.locator('#chargeButton').textContent();
console.log(`   Button text: ${buttonText.trim()}`);

console.log('\n✅ Test completed!');
await page.waitForTimeout(2000);
await browser.close();