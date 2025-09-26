import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing removal of "Actual" from labels...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Select a service
console.log('1. Selecting Recurring Cleaning service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(2000);

// Check labels in the wizard form
console.log('\n2. Checking labels:');

// Paint condition label
const paintLabel = await page.locator('label:has-text("Paint Condition")').first();
const paintLabelText = await paintLabel.textContent();
console.log(`   Paint label: "${paintLabelText}"`);
if (paintLabelText.includes('Actual')) {
    console.log('   ✗ Still contains "Actual"');
} else {
    console.log('   ✓ "Actual" removed');
}

// Growth level label
const growthLabel = await page.locator('label:has-text("Growth Level")').first();
const growthLabelText = await growthLabel.textContent();
console.log(`   Growth label: "${growthLabelText}"`);
if (growthLabelText.includes('Actual')) {
    console.log('   ✗ Still contains "Actual"');
} else {
    console.log('   ✓ "Actual" removed');
}

// Set conditions and check pricing
console.log('\n3. Checking pricing summary:');

// Click Fair paint condition
await page.locator('.paint-fair').first().click();
await page.waitForTimeout(300);

// Set growth slider to high value
const slider = await page.locator('.growth-slider').first();
await slider.evaluate(el => {
    el.value = '80';
    el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(500);

// Look for pricing text
const pricingElements = await page.locator('text=/Paint|Growth/').all();
console.log(`   Found ${pricingElements.length} pricing elements`);

for (let i = 0; i < Math.min(3, pricingElements.length); i++) {
    const text = await pricingElements[i].textContent();
    if (text.includes('Actual')) {
        console.log(`   ✗ Found "Actual" in: ${text.substring(0, 50)}...`);
    } else if (text.includes('Paint') || text.includes('Growth')) {
        console.log(`   ✓ Clean label: ${text.substring(0, 50)}...`);
    }
}

await page.screenshot({ path: 'labels-test.png', clip: { x: 0, y: 200, width: 1200, height: 600 } });
console.log('\nScreenshot saved as labels-test.png');

console.log('\n✅ Test completed!');
await page.waitForTimeout(2000);
await browser.close();
