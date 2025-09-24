import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1000);

const btn = await page.$('button:has-text("Recurring Cleaning")');
if (btn) {
    await btn.click();
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
        const options = document.querySelectorAll('.radio-option');
        if (options.length < 2) return { found: false };

        const style = window.getComputedStyle(options[0]);
        const rect1 = options[0].getBoundingClientRect();
        const rect2 = options[1].getBoundingClientRect();

        return {
            found: true,
            marginBottom: style.marginBottom,
            visualGap: rect2.top - rect1.bottom,
            option1Bottom: rect1.bottom,
            option2Top: rect2.top
        };
    });

    if (result.found) {
        console.log('Hull Type Spacing:');
        console.log('  CSS margin-bottom:', result.marginBottom);
        console.log('  Visual gap:', result.visualGap.toFixed(0) + 'px');
        console.log('  Spacing adequate:', result.visualGap >= 8 || result.marginBottom === '10px' ? '✅' : '❌');
    }
}

await browser.close();