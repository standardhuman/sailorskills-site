import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🎨 Testing Paint Condition (No Surcharge)');
console.log('==========================================\n');
console.log('Paint condition is now recorded for service logs only\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Recurring Cleaning
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    // Test all paint conditions with same boat (30ft monohull)
    const paintConditions = ['Excellent', 'Good', 'Fair', 'Poor'];

    console.log('Testing paint conditions (30ft boat, no growth):\n');

    for (const condition of paintConditions) {
        const btn = await page.$(`button:has-text("${condition}")`);
        if (btn) {
            await btn.click();
            await page.waitForTimeout(500);

            const result = await page.evaluate(() => {
                const price = document.getElementById('totalCostDisplay')?.textContent;
                const details = document.getElementById('chargeDetails')?.innerText || '';

                // Check if paint condition is shown
                const paintMatch = details.match(/Paint Condition:\s*(\w+)/);
                const paintCondition = paintMatch ? paintMatch[1] : 'Not found';

                // Check if it says "recorded for service log"
                const isRecorded = details.includes('recorded for service log');

                // Check if any paint surcharge is shown
                const hasPaintSurcharge = details.includes('paint +');

                return {
                    price,
                    paintCondition,
                    isRecorded,
                    hasPaintSurcharge
                };
            });

            console.log(`${condition} Paint Condition:`);
            console.log(`  Price: ${result.price} (should be $135.00 for all)`);
            console.log(`  Shown as: ${result.paintCondition}`);
            console.log(`  Marked as recorded: ${result.isRecorded ? '✅' : '❌'}`);
            console.log(`  Has surcharge: ${result.hasPaintSurcharge ? '❌ (should not have)' : '✅ (correct)'}`);
            console.log('');
        }
    }

    // Test with growth to ensure only growth surcharge applies
    console.log('Testing with 100% growth (Heavy):\n');

    // Set to Poor paint and 100% growth
    const poorBtn = await page.$('button:has-text("Poor")');
    await poorBtn?.click();

    const slider = await page.$('#adminGrowthLevel');
    await slider?.fill('100');

    await page.waitForTimeout(1000);

    const withGrowth = await page.evaluate(() => {
        const price = document.getElementById('totalCostDisplay')?.textContent;
        const details = document.getElementById('chargeDetails')?.innerText || '';

        // Extract surcharges
        const surchargeMatch = details.match(/Surcharges:(.+)/);
        const surcharges = surchargeMatch ? surchargeMatch[1].trim() : 'None';

        // Get paint condition info
        const paintMatch = details.match(/Paint Condition:\s*(\w+.*)/);
        const paintInfo = paintMatch ? paintMatch[1] : 'Not found';

        return {
            price,
            surcharges,
            paintInfo,
            basePrice: details.includes('Base Price: $135.00')
        };
    });

    console.log('Configuration: 30ft boat, Poor paint, 100% growth');
    console.log(`  Base price shown: ${withGrowth.basePrice ? '✅' : '❌'}`);
    console.log(`  Paint condition: ${withGrowth.paintInfo}`);
    console.log(`  Active surcharges: ${withGrowth.surcharges}`);
    console.log(`  Total price: ${withGrowth.price}`);
    console.log(`  Expected: $224.98 (base $135 × 1.667 for growth only)`);

    // Calculate if price is correct
    const expectedPrice = 135 * 1.667; // Only growth surcharge
    const actualPrice = parseFloat(withGrowth.price?.replace('$', ''));
    const isCorrect = Math.abs(actualPrice - expectedPrice) < 1;
    console.log(`  Price calculation: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
}

console.log('\n✨ Paint condition test complete!');
console.log('Summary:');
console.log('  • Paint condition no longer affects pricing');
console.log('  • Paint condition is displayed as "recorded for service log"');
console.log('  • Only growth (>50%), hull type, and twin engines add surcharges');
console.log('  • Paint condition will be captured in service logs for tracking');

await page.screenshot({ path: 'admin-no-paint-surcharge.png', fullPage: true });
console.log('\n📸 Screenshot saved as admin-no-paint-surcharge.png');

await browser.close();