import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('📊 Complete Surcharge Summary Test');
console.log('==================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1000);

// Click Recurring Cleaning
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    // Configure all surcharges
    // Catamaran
    await page.$eval('input[value="catamaran"]', el => el.click());

    // 100% growth
    await page.$eval('#adminGrowthLevel', el => el.value = '100');
    await page.$eval('#adminGrowthLevel', el => el.dispatchEvent(new Event('input')));

    // Powerboat
    await page.$eval('#adminPowerboat', el => el.click());

    // Twin engines
    await page.$eval('#adminTwinEngines', el => el.click());

    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
        const price = document.getElementById('totalCostDisplay')?.textContent;
        const details = document.getElementById('chargeDetails')?.innerText || '';

        // Parse surcharges
        const surchargeMatch = details.match(/Surcharges:(.+?)(?:Paint|Total|$)/s);
        const surcharges = surchargeMatch ? surchargeMatch[1].trim() : '';

        return {
            price,
            basePrice: details.match(/Base Price:\s*\$([0-9.]+)/)?.[1],
            surcharges,
            paintCondition: details.match(/Paint Condition:\s*(\w+)/)?.[1]
        };
    });

    console.log('Full configuration test:');
    console.log('========================');
    console.log('Base price: $' + result.basePrice);
    console.log('Active surcharges:', result.surcharges);
    console.log('Paint condition:', result.paintCondition, '(no surcharge)');
    console.log('Final price:', result.price);

    // Calculate expected
    const base = 135;
    const catamaran = 1.25;
    const growth = 1.667;  // 100% growth = 66.7% surcharge
    const powerboat = 1.25;
    const twin = 1.10;
    const expected = base * catamaran * growth * powerboat * twin;

    console.log('\nCalculation breakdown:');
    console.log(`  $${base} (base)`);
    console.log(`  × ${catamaran} (catamaran +25%)`);
    console.log(`  × ${growth.toFixed(3)} (100% growth +66.7%)`);
    console.log(`  × ${powerboat} (powerboat +25%)`);
    console.log(`  × ${twin} (twin engines +10%)`);
    console.log(`  = $${expected.toFixed(2)} expected`);

    const actual = parseFloat(result.price?.replace('$', ''));
    const difference = Math.abs(actual - expected);
    console.log(`\nResult: ${difference < 1 ? '✅ Correct' : '❌ Error'} (difference: $${difference.toFixed(2)})`);
}

console.log('\n✨ Summary of active surcharges:');
console.log('  • Hull type: Catamaran +25%, Trimaran +50%');
console.log('  • Growth: 0-50% = 0%, then scales to +200% at 200% growth');
console.log('  • Powerboat: +25%');
console.log('  • Twin engines: +10%');
console.log('  • Paint condition: NO SURCHARGE (recorded for logs only)');

await browser.close();