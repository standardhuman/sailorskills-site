import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing paint condition button styling in main form...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Scroll down to see the main form paint buttons
await page.evaluate(() => window.scrollBy(0, 500));
await page.waitForTimeout(500);

// Find paint condition buttons in the main form
console.log('Analyzing main form paint condition buttons:');
const paintButtonSelectors = [
    { class: 'paint-excellent', label: 'Excellent' },
    { class: 'paint-good', label: 'Good' },
    { class: 'paint-fair', label: 'Fair' },
    { class: 'paint-poor', label: 'Poor' },
    { class: 'paint-missing', label: 'Missing' }
];

// First check if main form buttons exist
const mainFormButtons = await page.locator('#paintConditionButtons .option-button').all();
console.log('Found', mainFormButtons.length, 'buttons in main form\n');

for (const btn of paintButtonSelectors) {
    const button = await page.locator(`#paintConditionButtons .${btn.class}`).first();
    if (await button.count() > 0) {
        // Click the button
        await button.click();
        await page.waitForTimeout(300);
        
        // Get computed styles
        const styles = await button.evaluate(el => {
            const computed = window.getComputedStyle(el);
            const classList = Array.from(el.classList);
            
            return {
                computedColor: computed.color,
                computedBackground: computed.backgroundColor,
                classes: classList.join(', '),
                isSelected: classList.includes('selected')
            };
        });
        
        console.log(`${btn.label} Button:`);
        console.log(`  Selected: ${styles.isSelected}`);
        console.log(`  Color: ${styles.computedColor}`);
        console.log(`  Background: ${styles.computedBackground}`);
        console.log(`  Classes: ${styles.classes}`);
        
        // Parse colors to check visibility
        const parseRGB = (str) => {
            const match = str.match(/rgb.*?\((\d+),\s*(\d+),\s*(\d+)/);
            return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
        };
        
        const bgRGB = parseRGB(styles.computedBackground);
        const textRGB = parseRGB(styles.computedColor);
        
        if (bgRGB && textRGB) {
            const isSimilar = Math.abs(bgRGB[0] - textRGB[0]) < 50 && 
                             Math.abs(bgRGB[1] - textRGB[1]) < 50 && 
                             Math.abs(bgRGB[2] - textRGB[2]) < 50;
            
            if (isSimilar || (textRGB[0] > 250 && textRGB[1] > 250 && textRGB[2] > 250)) {
                console.log(`  ⚠️ TEXT MAY BE INVISIBLE - colors too similar or white on colored background`);
            } else {
                console.log(`  ✓ Text is visible`);
            }
        }
        console.log();
    }
}

// Take screenshot
await page.screenshot({ path: 'paint-main-buttons.png', fullPage: false, clip: { x: 0, y: 400, width: 1200, height: 600 } });
console.log('Screenshot saved as paint-main-buttons.png');

await browser.close();
