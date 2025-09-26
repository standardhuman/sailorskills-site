import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing final changes...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Select a service first to show the form
console.log('1. Selecting Recurring Cleaning service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(2000);

// Test paint condition buttons
console.log('\n2. Testing paint condition buttons:');
const paintButtons = await page.locator('[id*="wizardPaintCondition"] .option-button').all();
console.log('   Found', paintButtons.length, 'paint condition buttons');

if (paintButtons.length > 0) {
    // Click on different buttons
    for (const btnClass of ['paint-fair', 'paint-poor', 'paint-good']) {
        const btn = await page.locator(`[id*="wizardPaintCondition"] .${btnClass}`).first();
        if (await btn.isVisible()) {
            await btn.click();
            await page.waitForTimeout(300);
            
            const styles = await btn.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    color: computed.color,
                    backgroundColor: computed.backgroundColor,
                    selected: el.classList.contains('selected')
                };
            });
            console.log(`   ${btnClass}:`, styles.selected ? 'Selected' : 'Not selected', `- Color: ${styles.color}`);
        }
    }
}

// Test growth slider
console.log('\n3. Testing growth slider granularity:');
const slider = await page.locator('.growth-slider').first();
if (await slider.isVisible()) {
    // Test specific positions for smooth transitions
    const testPositions = [
        { value: 0, expected: 'Minimal (0%)' },
        { value: 25, expected: 'Moderate' },
        { value: 40, expected: 'Heavy' },
        { value: 70, expected: 'Severe' },
        { value: 100, expected: 'Severe (200%)' }
    ];
    
    for (const test of testPositions) {
        await slider.evaluate((el, val) => {
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }, test.value);
        await page.waitForTimeout(200);
        
        const display = await page.locator('.growth-slider-value').first().textContent();
        console.log(`   Slider at ${test.value}: ${display}`);
    }
}

console.log('\n✅ All tests completed!');

await page.screenshot({ path: 'admin-final-test.png', clip: { x: 0, y: 200, width: 1200, height: 600 } });
console.log('Screenshot saved as admin-final-test.png');

await page.waitForTimeout(2000);
await browser.close();
