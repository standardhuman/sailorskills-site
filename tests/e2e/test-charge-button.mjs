import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing charge button enable logic...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Step 1: Check initial state
console.log('1. Initial state:');
let serviceKey = await page.evaluate(() => window.currentServiceKey);
console.log(`   window.currentServiceKey: ${serviceKey}`);
let isDisabled = await page.locator('#chargeButton').isDisabled();
console.log(`   Charge button disabled: ${isDisabled}`);

// Step 2: Click service button once
console.log('\n2. After clicking Recurring Cleaning once:');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(1000);

serviceKey = await page.evaluate(() => window.currentServiceKey);
console.log(`   window.currentServiceKey: ${serviceKey}`);
isDisabled = await page.locator('#chargeButton').isDisabled();
console.log(`   Charge button disabled: ${isDisabled}`);

// Step 3: Click service button again to open wizard
console.log('\n3. After clicking Recurring Cleaning again (wizard should open):');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(2000);

serviceKey = await page.evaluate(() => window.currentServiceKey);
console.log(`   window.currentServiceKey: ${serviceKey}`);
isDisabled = await page.locator('#chargeButton').isDisabled();
console.log(`   Charge button disabled: ${isDisabled}`);

// Step 4: Configure service in wizard
console.log('\n4. After configuring service in wizard:');
// Click Fair paint condition
await page.locator('.paint-fair').first().click();
await page.waitForTimeout(300);

// Set growth slider
const slider = await page.locator('.growth-slider').first();
await slider.evaluate(el => {
    el.value = '80';
    el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(500);

// Trigger updateChargeSummary manually to be sure
await page.evaluate(() => {
    if (window.updateChargeSummary) {
        window.updateChargeSummary();
    }
});
await page.waitForTimeout(500);

serviceKey = await page.evaluate(() => window.currentServiceKey);
console.log(`   window.currentServiceKey: ${serviceKey}`);
isDisabled = await page.locator('#chargeButton').isDisabled();
console.log(`   Charge button disabled: ${isDisabled}`);

// Step 5: Check charge summary content
console.log('\n5. Charge Summary content:');
const summaryText = await page.locator('#chargeDetails').textContent();
console.log(`   Summary (first 200 chars): ${summaryText.substring(0, 200).replace(/\s+/g, ' ')}...`);

console.log('\n✅ Test completed!');
await page.waitForTimeout(2000);
await browser.close();