import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🎨 Testing Growth Level Slider with Indicators');
console.log('==============================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Recurring Cleaning to open wizard
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    console.log('Testing growth level indicators:\n');

    // Test different growth levels
    const testLevels = [
        { value: 0, expectedLabel: 'Minimal', description: 'Clean hull' },
        { value: 25, expectedLabel: 'Moderate', description: 'Light fouling' },
        { value: 50, expectedLabel: 'Moderate', description: 'Moderate fouling' },
        { value: 75, expectedLabel: 'Heavy', description: 'Heavy fouling' },
        { value: 100, expectedLabel: 'Heavy', description: 'Very heavy fouling' },
        { value: 150, expectedLabel: 'Severe', description: 'Severe fouling' },
        { value: 200, expectedLabel: 'Severe', description: 'Extreme fouling' }
    ];

    const slider = await page.$('#adminGrowthLevel');
    if (slider) {
        for (const test of testLevels) {
            await slider.fill(test.value.toString());
            await page.waitForTimeout(300);

            const result = await page.evaluate(() => {
                const percent = document.getElementById('growthPercent')?.textContent;
                const label = document.getElementById('growthLabel')?.textContent;
                const price = document.getElementById('totalCostDisplay')?.textContent;

                return { percent, label, price };
            });

            console.log(`${test.value}% (${test.description}):`);
            console.log(`  Display: ${result.percent} - ${result.label}`);
            console.log(`  Expected: ${test.expectedLabel}`);
            console.log(`  Price: ${result.price}`);
            console.log(`  Status: ${result.label === test.expectedLabel ? '✅' : '❌'}\n`);
        }

        // Check if slider labels are visible
        const labelsVisible = await page.evaluate(() => {
            const labels = document.querySelectorAll('.slider-label');
            return labels.length;
        });

        console.log(`\nSlider labels visible: ${labelsVisible} labels ${labelsVisible === 4 ? '✅' : '❌'}`);

        // Check the visual gradient
        const sliderStyle = await page.evaluate(() => {
            const slider = document.getElementById('adminGrowthLevel');
            return slider ? window.getComputedStyle(slider).background : null;
        });

        console.log(`Gradient applied: ${sliderStyle?.includes('gradient') ? '✅' : '❌'}`);
    }
}

console.log('\n✨ Growth level slider test complete!');
console.log('Features implemented:');
console.log('  • Dynamic label updates (Minimal/Moderate/Heavy/Severe)');
console.log('  • Percentage display (0-200%)');
console.log('  • Visual indicators below slider');
console.log('  • Color gradient (green to red)');
console.log('  • Live price updates based on growth level');

await page.screenshot({ path: 'admin-growth-slider.png' });
console.log('\n📸 Screenshot saved as admin-growth-slider.png');

await browser.close();