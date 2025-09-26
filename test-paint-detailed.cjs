const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Testing paint button styling in detail...\n');

    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(1500);

    // Select Recurring Cleaning
    console.log('Selecting Recurring Cleaning service...');
    await page.locator('button:has-text("Recurring Cleaning")').first().click();
    await page.waitForTimeout(2000);

    // Find and test each paint button
    const paintButtons = ['Excellent', 'Good', 'Fair', 'Poor', 'Missing'];
    
    console.log('\nTesting paint condition buttons:');
    console.log('--------------------------------');
    
    for (const label of paintButtons) {
        const button = await page.locator(`button:has-text("${label}")`).first();
        
        if (await button.isVisible()) {
            // Click the button
            await button.click();
            await page.waitForTimeout(500);
            
            // Get computed styles
            const result = await button.evaluate(el => {
                const computed = window.getComputedStyle(el);
                const rgb = computed.color.match(/\d+/g);
                const bgRgb = computed.backgroundColor.match(/\d+/g);
                
                return {
                    label: el.textContent,
                    isSelected: el.classList.contains('selected'),
                    color: computed.color,
                    backgroundColor: computed.backgroundColor,
                    isWhiteText: rgb && rgb[0] > 250 && rgb[1] > 250 && rgb[2] > 250,
                    hasColoredBg: bgRgb && (bgRgb[0] < 250 || bgRgb[1] < 250 || bgRgb[2] < 250)
                };
            });
            
            console.log(`\n${result.label} Button:`);
            console.log(`  Selected: ${result.isSelected}`);
            console.log(`  Text color: ${result.color}`);
            console.log(`  Background: ${result.backgroundColor}`);
            
            if (result.isSelected) {
                if (result.isWhiteText && result.hasColoredBg) {
                    console.log('  ✓ GOOD: White text on colored background');
                } else if (result.isWhiteText && !result.hasColoredBg) {
                    console.log('  ✗ BAD: White text on white/light background!');
                } else {
                    console.log('  ? Text is not white when selected');
                }
            }
        }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'paint-buttons-test.png', clip: { x: 0, y: 200, width: 1200, height: 600 } });
    console.log('\n✅ Screenshot saved as paint-buttons-test.png');
    
    await page.waitForTimeout(3000);
    await browser.close();
})();
