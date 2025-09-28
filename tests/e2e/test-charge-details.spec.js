import { test, expect } from '@playwright/test';

test('Verify charge summary shows all boat and pricing details', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Testing Complete Charge Summary Details ===');

    // Open recurring cleaning wizard
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Set up a twin engine powerboat with heavy growth
    console.log('\nSetting up boat configuration:');

    // Set boat length
    await page.fill('#wizardBoatLength', '45');
    console.log('  Boat length: 45 feet');

    // Select powerboat
    await page.click('input[name="wizard_boat_type"][value="powerboat"]');
    console.log('  Type: Powerboat (25% surcharge)');

    // Select catamaran
    await page.click('input[name="wizard_hull_type"][value="catamaran"]');
    console.log('  Hull: Catamaran (25% surcharge)');

    // Check twin engines
    const twinEngines = await page.locator('#wizard_twin_engines');
    if (await twinEngines.count() > 0) {
        await twinEngines.check();
        console.log('  Twin Engines: Yes (10% surcharge)');
    }

    // Set growth to heavy
    await page.fill('#wizardGrowthLevelSlider', '70');
    console.log('  Growth: Heavy (75% surcharge)');

    // Wait for pricing to update
    await page.waitForTimeout(2000);

    // Now check what's actually displayed (using evaluate to check DOM directly)
    const summaryInfo = await page.evaluate(() => {
        const elem = document.getElementById('chargeSummaryContent');
        if (!elem) return { found: false, reason: 'Element not found' };

        const text = elem.textContent || '';
        const html = elem.innerHTML || '';

        // Log to console for debugging
        console.log('Charge Summary HTML:', html.substring(0, 500));

        return {
            found: true,
            textLength: text.length,
            htmlLength: html.length,
            // Check what's actually there
            hasBoatDetailsHeader: html.includes('Boat Details'),
            hasPricingHeader: html.includes('Pricing Breakdown'),
            hasBoatLength: text.includes('45 feet') || text.includes('45ft'),
            hasPowerboat: text.includes('Powerboat'),
            hasCatamaran: text.includes('Catamaran'),
            hasTwinEngines: text.includes('Twin'),
            hasHeavyGrowth: text.includes('Heavy'),
            hasBaseRate: text.includes('Base rate'),
            hasSurcharges: text.includes('surcharge'),
            hasTotal: text.includes('Total:'),
            // Get first 200 chars to see what's there
            preview: text.substring(0, 200)
        };
    });

    console.log('\n=== Charge Summary Content Check ===');
    console.log(`Element found: ${summaryInfo.found}`);

    if (summaryInfo.found) {
        console.log(`Content length: ${summaryInfo.textLength} chars`);
        console.log(`HTML length: ${summaryInfo.htmlLength} chars`);

        console.log('\nDetailed Sections:');
        console.log(`  Boat Details header: ${summaryInfo.hasBoatDetailsHeader ? '✓' : '✗'}`);
        console.log(`  Pricing Breakdown header: ${summaryInfo.hasPricingHeader ? '✓' : '✗'}`);

        console.log('\nBoat Configuration:');
        console.log(`  45 feet length: ${summaryInfo.hasBoatLength ? '✓' : '✗'}`);
        console.log(`  Powerboat: ${summaryInfo.hasPowerboat ? '✓' : '✗'}`);
        console.log(`  Catamaran: ${summaryInfo.hasCatamaran ? '✓' : '✗'}`);
        console.log(`  Twin Engines: ${summaryInfo.hasTwinEngines ? '✓' : '✗'}`);
        console.log(`  Heavy Growth: ${summaryInfo.hasHeavyGrowth ? '✓' : '✗'}`);

        console.log('\nPricing:');
        console.log(`  Base rate: ${summaryInfo.hasBaseRate ? '✓' : '✗'}`);
        console.log(`  Surcharges: ${summaryInfo.hasSurcharges ? '✓' : '✗'}`);
        console.log(`  Total: ${summaryInfo.hasTotal ? '✓' : '✗'}`);

        console.log('\nContent preview:');
        console.log(summaryInfo.preview);

        // Check if it's the detailed view or the simple view
        if (summaryInfo.hasBoatDetailsHeader && summaryInfo.hasPricingHeader) {
            console.log('\n✅ Detailed charge summary is displaying correctly!');
        } else {
            console.log('\n⚠️ Still showing simple summary. Detailed sections missing.');
        }
    }
});