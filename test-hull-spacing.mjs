import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🚢 Testing Hull Type Button Spacing');
console.log('====================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Recurring Cleaning
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    const spacing = await page.evaluate(() => {
        const radioOptions = document.querySelectorAll('.radio-option');
        const measurements = [];

        for (let i = 0; i < radioOptions.length - 1; i++) {
            const current = radioOptions[i].getBoundingClientRect();
            const next = radioOptions[i + 1].getBoundingClientRect();
            const gap = next.top - current.bottom;

            measurements.push({
                option: i + 1,
                height: current.height,
                gapToNext: gap
            });
        }

        // Last option
        if (radioOptions.length > 0) {
            const last = radioOptions[radioOptions.length - 1].getBoundingClientRect();
            measurements.push({
                option: radioOptions.length,
                height: last.height,
                gapToNext: 0
            });
        }

        return {
            count: radioOptions.length,
            measurements,
            totalHeight: radioOptions.length > 0 ?
                radioOptions[radioOptions.length - 1].getBoundingClientRect().bottom -
                radioOptions[0].getBoundingClientRect().top : 0
        };
    });

    console.log('Hull Type Radio Buttons:');
    console.log(`Total options: ${spacing.count}`);
    console.log(`Total height: ${spacing.totalHeight.toFixed(0)}px\n`);

    console.log('Individual measurements:');
    spacing.measurements.forEach((m, i) => {
        const labels = ['Monohull', 'Catamaran', 'Trimaran'];
        console.log(`${labels[i] || 'Option ' + m.option}:`);
        console.log(`  Height: ${m.height.toFixed(0)}px`);
        if (m.gapToNext > 0) {
            console.log(`  Gap to next: ${m.gapToNext.toFixed(0)}px`);
        }
    });

    console.log('\n✅ Spacing Summary:');
    const avgGap = spacing.measurements
        .filter(m => m.gapToNext > 0)
        .reduce((sum, m) => sum + m.gapToNext, 0) / (spacing.count - 1);

    console.log(`  Average gap: ${avgGap.toFixed(0)}px`);
    console.log(`  Visual separation: ${avgGap >= 8 ? '✅ Good' : avgGap >= 4 ? '⚠️ Acceptable' : '❌ Too close'}`);
    console.log(`  Touch-friendly: ${spacing.measurements.every(m => m.height >= 44) ? '✅ Yes' : '❌ No'}`);

    await page.screenshot({ path: 'admin-hull-spacing.png' });
    console.log('\n📸 Screenshot saved as admin-hull-spacing.png');
}

await browser.close();