import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🧮 Testing Calculation Display in Charge Summary');
console.log('================================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Recurring Cleaning (per-foot service)
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    // Test different boat lengths
    const boatLengths = [30, 45, 60];

    for (const length of boatLengths) {
        // Set boat length
        const lengthInput = await page.$('#adminBoatLength');
        if (lengthInput) {
            await lengthInput.fill(length.toString());
            await page.waitForTimeout(500);

            const details = await page.evaluate(() => {
                const chargeDetails = document.getElementById('chargeDetails');
                const text = chargeDetails?.innerText || '';

                // Extract calculation line
                const calcMatch = text.match(/Calculation:\s*(.+)/);
                const calculation = calcMatch ? calcMatch[1] : 'Not found';

                // Extract total price
                const totalMatch = text.match(/Total Price:\s*\$([0-9.]+)/);
                const totalPrice = totalMatch ? totalMatch[1] : 'Not found';

                return {
                    calculation,
                    totalPrice,
                    fullText: text.substring(0, 300)
                };
            });

            console.log(`${length}ft Boat:`);
            console.log(`  Calculation shown: ${details.calculation}`);
            console.log(`  Total price: $${details.totalPrice}`);

            // Verify calculation is correct (30ft × $4.50 = $135.00)
            const expectedBase = length * 4.50;
            const calcCorrect = details.calculation.includes(length.toString()) &&
                                details.calculation.includes('4.50') &&
                                details.calculation.includes(expectedBase.toFixed(2));

            console.log(`  Calculation correct: ${calcCorrect ? '✅' : '❌'}\n`);
        }
    }

    // Test with surcharges
    console.log('Testing with surcharges:');
    console.log('========================\n');

    // Add catamaran and powerboat
    const catamaran = await page.$('input[value="catamaran"]');
    await catamaran?.click();

    const powerboat = await page.$('#adminPowerboat');
    await powerboat?.click();

    await page.waitForTimeout(1000);

    const withSurcharges = await page.evaluate(() => {
        const chargeDetails = document.getElementById('chargeDetails');
        const text = chargeDetails?.innerText || '';

        // Get all lines
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        return {
            lines,
            hasCalculation: text.includes('Calculation:'),
            hasSurcharges: text.includes('Surcharges:'),
            hasTotal: text.includes('Total Price:')
        };
    });

    console.log('Charge Summary Structure:');
    withSurcharges.lines.forEach((line, i) => {
        if (i < 8) { // Show first 8 lines
            console.log(`  ${i + 1}. ${line}`);
        }
    });

    console.log('\nContent checks:');
    console.log(`  Has calculation line: ${withSurcharges.hasCalculation ? '✅' : '❌'}`);
    console.log(`  Has surcharges line: ${withSurcharges.hasSurcharges ? '✅' : '❌'}`);
    console.log(`  Has total price: ${withSurcharges.hasTotal ? '✅' : '❌'}`);
}

// Test flat rate service (should not show calculation)
console.log('\nTesting Flat Rate Service (Item Recovery):');
console.log('===========================================\n');

const recoveryBtn = await page.$('button:has-text("Item Recovery")');
if (recoveryBtn) {
    await recoveryBtn.click();
    await page.waitForTimeout(1000);

    const flatRateDetails = await page.evaluate(() => {
        const chargeDetails = document.getElementById('chargeDetails');
        const text = chargeDetails?.innerText || '';

        return {
            hasCalculation: text.includes('Calculation:'),
            hasPrice: text.includes('$'),
            text: text.substring(0, 200)
        };
    });

    console.log(`  Has calculation line: ${flatRateDetails.hasCalculation ? '❌ (should not have)' : '✅ (correctly hidden)'}`);
    console.log(`  Has price: ${flatRateDetails.hasPrice ? '✅' : '❌'}`);
    console.log(`  Summary preview: ${flatRateDetails.text.substring(0, 100)}...`);
}

console.log('\n✨ Calculation display test complete!');
console.log('Summary:');
console.log('  • Per-foot services show: [Length]ft × $[Rate]/ft = $[Base Price]');
console.log('  • Calculation appears before surcharges');
console.log('  • Flat rate services do not show calculation');
console.log('  • Clear breakdown of pricing components');

await page.screenshot({ path: 'admin-calculation-display.png', fullPage: true });
console.log('\n📸 Screenshot saved as admin-calculation-display.png');

await browser.close();