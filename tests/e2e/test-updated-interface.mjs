import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing updated admin interface...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Test paint condition buttons
console.log('1. Testing paint condition buttons:');
const paintButtons = await page.locator('.paint-good, .paint-fair, .paint-poor').all();
if (paintButtons.length > 0) {
    // Click on "Fair" button
    const fairBtn = await page.locator('.paint-fair').first();
    await fairBtn.click();
    await page.waitForTimeout(500);
    
    // Check if only one button is selected
    const selectedButtons = await page.locator('.option-button.selected').all();
    console.log('   Selected buttons count:', selectedButtons.length);
    
    // Check the styling
    const styles = await fairBtn.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            hasSelected: el.classList.contains('selected')
        };
    });
    console.log('   Fair button styles:', styles);
}

// Test growth slider
console.log('\n2. Testing growth slider:');

// Select a service first
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(1500);

const slider = await page.locator('.growth-slider').first();
if (await slider.isVisible()) {
    console.log('   Slider is visible');
    
    // Test different positions
    const positions = [0, 30, 45, 80, 100];
    for (const pos of positions) {
        await slider.evaluate((el, value) => {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }, pos);
        await page.waitForTimeout(300);
        
        const valueDisplay = await page.locator('.growth-slider-value').first().textContent();
        console.log(`   Position ${pos}: ${valueDisplay}`);
    }
    
    // Check price with severe growth
    await slider.evaluate(el => {
        el.value = '100';
        el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    
    const priceText = await page.locator('text=/Actual Growth/').first();
    if (priceText) {
        const parent = await priceText.locator('..').textContent();
        console.log('\n   Growth surcharge info:', parent);
    }
}

console.log('\n✅ Test completed!');

await page.screenshot({ path: 'admin-updated-interface.png', fullPage: false, clip: { x: 0, y: 0, width: 1200, height: 800 } });
console.log('Screenshot saved as admin-updated-interface.png');

await page.waitForTimeout(3000);
await browser.close();
