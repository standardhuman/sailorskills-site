import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🧮 Testing New Growth Surcharge Calculation');
console.log('============================================\n');
console.log('Rule: 0-50% growth = 0% surcharge');
console.log('Rule: 50-200% growth = 0% to 200% surcharge (linear scale)\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Recurring Cleaning
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    const slider = await page.$('#adminGrowthLevel');
    if (slider) {
        // Test various growth levels
        const testPoints = [
            { growth: 0, expected: 0, desc: 'Minimal (clean)' },
            { growth: 25, expected: 0, desc: 'Minimal-Moderate' },
            { growth: 50, expected: 0, desc: 'Moderate boundary' },
            { growth: 75, expected: 33.3, desc: 'Moderate-Heavy' },
            { growth: 100, expected: 66.7, desc: 'Heavy' },
            { growth: 125, expected: 100, desc: 'Heavy-Severe' },
            { growth: 150, expected: 133.3, desc: 'Severe' },
            { growth: 175, expected: 166.7, desc: 'Very Severe' },
            { growth: 200, expected: 200, desc: 'Extreme' }
        ];

        console.log('Testing surcharge calculations:\n');
        console.log('Base: 30ft boat @ $4.50/ft = $135.00\n');

        for (const test of testPoints) {
            await slider.fill(test.growth.toString());
            await page.waitForTimeout(500);

            const result = await page.evaluate(() => {
                const price = document.getElementById('totalCostDisplay')?.textContent;
                const label = document.getElementById('growthLabel')?.textContent;
                const details = document.getElementById('chargeDetails')?.textContent;

                // Extract surcharge info if visible
                const surchargeMatch = details?.match(/growth \+(\d+)%/);
                const actualSurcharge = surchargeMatch ? parseFloat(surchargeMatch[1]) : 0;

                return {
                    price,
                    label,
                    actualSurcharge,
                    hasBasePrice: details?.includes('Base Price'),
                    hasSurchargeInfo: details?.includes('Surcharges')
                };
            });

            const expectedPrice = 135 * (1 + test.expected / 100);
            const actualPrice = parseFloat(result.price?.replace('$', ''));
            const isCorrect = Math.abs(actualPrice - expectedPrice) < 0.5;

            console.log(`${test.growth}% Growth (${test.desc}):`);
            console.log(`  Label: ${result.label}`);
            console.log(`  Expected surcharge: +${test.expected.toFixed(1)}%`);
            console.log(`  Actual surcharge: +${result.actualSurcharge.toFixed(1)}%`);
            console.log(`  Expected price: $${expectedPrice.toFixed(2)}`);
            console.log(`  Actual price: ${result.price}`);
            console.log(`  Status: ${isCorrect ? '✅' : '❌'}\n`);
        }

        // Test with additional surcharges
        console.log('Testing combined surcharges:\n');

        // Set Catamaran + Poor Paint + 100% Growth + Twin Engines
        const catamaran = await page.$('input[value="catamaran"]');
        await catamaran?.click();

        const poorBtn = await page.$('button:has-text("Poor")');
        await poorBtn?.click();

        await slider.fill('100');

        const twinEngines = await page.$('#adminTwinEngines');
        await twinEngines?.click();

        await page.waitForTimeout(1000);

        const combined = await page.evaluate(() => {
            const details = document.getElementById('chargeDetails');
            const price = document.getElementById('totalCostDisplay')?.textContent;

            // Get all text from details
            const detailsText = details?.innerText || '';

            return {
                price,
                detailsText,
                hasBasePrice: detailsText.includes('Base Price'),
                hasSurcharges: detailsText.includes('Surcharges'),
                surchargesList: detailsText.match(/Surcharges:(.+)/)?.[1]?.trim()
            };
        });

        console.log('Combined surcharges test:');
        console.log('  Configuration: 30ft Catamaran, Poor paint, 100% growth, Twin engines');
        console.log('  Base price shown:', combined.hasBasePrice ? '✅' : '❌');
        console.log('  Surcharges shown:', combined.hasSurcharges ? '✅' : '❌');
        console.log('  Surcharges list:', combined.surchargesList || 'Not found');
        console.log('  Final price:', combined.price);

        // Calculate expected: $135 * 1.25 (cat) * 1.40 (poor) * 1.667 (100% growth @ new scale) * 1.10 (twin)
        const expected = 135 * 1.25 * 1.40 * 1.667 * 1.10;
        console.log('  Expected: $' + expected.toFixed(2));
    }
}

console.log('\n✨ Growth surcharge test complete!');
console.log('New features:');
console.log('  • 0-50% growth = 0% surcharge (Minimal to Moderate)');
console.log('  • 50-200% growth scales linearly from 0% to 200% surcharge');
console.log('  • Charge summary shows base price and all active surcharges');
console.log('  • Clear breakdown of pricing components');

await page.screenshot({ path: 'admin-growth-surcharge.png', fullPage: true });
console.log('\n📸 Screenshot saved as admin-growth-surcharge.png');

await browser.close();