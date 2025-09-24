import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Opening admin page...');
await page.goto('http://localhost:3000/admin.html');
await page.waitForTimeout(2000);

// Take screenshot of initial state
await page.screenshot({ path: 'admin-initial.png', fullPage: true });
console.log('Initial screenshot saved as admin-initial.png');

// Click on Recurring Cleaning service
console.log('\nClicking Recurring Cleaning...');
const serviceBtn = await page.locator('button:has-text("Recurring Cleaning")').first();
if (await serviceBtn.count() > 0) {
    await serviceBtn.click();
    await page.waitForTimeout(2000);
    
    // Take screenshot after selecting service
    await page.screenshot({ path: 'admin-service-selected.png', fullPage: true });
    console.log('Service selected screenshot saved');
    
    // Look for any sliders on the page
    const allSliders = await page.locator('input[type="range"]').all();
    console.log(`\nFound ${allSliders.length} slider(s) on the page`);
    
    for (let i = 0; i < allSliders.length; i++) {
        const slider = allSliders[i];
        const id = await slider.getAttribute('id');
        const isVisible = await slider.isVisible();
        console.log(`Slider ${i + 1}: ID="${id}", Visible=${isVisible}`);
    }
    
    // Look for growth-related elements
    const growthElements = await page.locator('[id*="growth"], [class*="growth"]').all();
    console.log(`\nFound ${growthElements.length} growth-related elements`);
    
    // Check paint condition buttons
    const paintButtons = await page.locator('.paint-good, .paint-fair, .paint-poor').all();
    console.log(`\nFound ${paintButtons.length} paint condition button(s)`);
    
    if (paintButtons.length > 0) {
        const firstButton = paintButtons[0];
        await firstButton.click();
        await page.waitForTimeout(500);
        
        const styles = await firstButton.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                classes: el.className
            };
        });
        console.log('Paint button styles after click:', styles);
    }
}

console.log('\n✅ Test completed!');
await page.waitForTimeout(3000);
await browser.close();
