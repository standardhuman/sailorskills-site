import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing paint condition button fix...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Select a service to show the form
console.log('1. Selecting Recurring Cleaning service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(2000);

// Test wizard paint buttons
console.log('\n2. Testing wizard paint condition buttons:');
const wizardButtons = [
    { class: 'paint-good', label: 'Good' },
    { class: 'paint-fair', label: 'Fair' },
    { class: 'paint-poor', label: 'Poor' }
];

for (const btn of wizardButtons) {
    const button = await page.locator(`.option-button.${btn.class}`).first();
    if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(300);
        
        const styles = await button.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                isSelected: el.classList.contains('selected')
            };
        });
        
        console.log(`   ${btn.label}: ${styles.isSelected ? 'Selected' : 'Not selected'}`);
        console.log(`     Color: ${styles.color}`);
        console.log(`     Background: ${styles.backgroundColor}`);
        
        // Check contrast
        const colorMatch = styles.color.match(/\d+/g);
        const bgMatch = styles.backgroundColor.match(/\d+/g);
        
        if (colorMatch && bgMatch) {
            const isWhiteText = colorMatch[0] > 250 && colorMatch[1] > 250 && colorMatch[2] > 250;
            const isColoredBg = bgMatch[0] < 250 || bgMatch[1] < 250 || bgMatch[2] < 250;
            
            if (isWhiteText && isColoredBg) {
                console.log('     ✓ Good contrast - white text on colored background');
            } else if (!isWhiteText && !isColoredBg) {
                console.log('     ✓ Good contrast - dark text on light background');
            } else {
                console.log('     ⚠️ Potential contrast issue');
            }
        }
        console.log();
    }
}

// Take a screenshot
await page.screenshot({ path: 'paint-buttons-fixed.png', clip: { x: 0, y: 200, width: 1200, height: 600 } });
console.log('Screenshot saved as paint-buttons-fixed.png');

console.log('\n✅ Test complete!');
await page.waitForTimeout(2000);
await browser.close();
