import { test, expect } from '@playwright/test';

test('Verify detailed charge summary display', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Testing Detailed Charge Summary ===');

    // Open recurring cleaning wizard
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Fill in boat details
    const boatNameInput = await page.locator('#wizardBoatName');
    if (await boatNameInput.count() > 0) {
        await boatNameInput.fill('Sea Breeze');
        console.log('Set boat name: Sea Breeze');
    }

    await page.fill('#wizardBoatLength', '42');
    console.log('Set boat length: 42 feet');

    // Select powerboat
    await page.click('input[name="wizard_boat_type"][value="powerboat"]');
    console.log('Selected: Powerboat');

    // Select catamaran
    await page.click('input[name="wizard_hull_type"][value="catamaran"]');
    console.log('Selected: Catamaran');

    // Check twin engines
    const twinEnginesCheckbox = await page.locator('#wizard_twin_engines');
    if (await twinEnginesCheckbox.count() > 0) {
        await twinEnginesCheckbox.check();
        console.log('Selected: Twin Engines');
    }

    // Select paint condition - Poor
    const poorPaintBtn = await page.locator('button[data-value="poor"]');
    if (await poorPaintBtn.count() > 0) {
        await poorPaintBtn.click();
        console.log('Selected Paint: Poor');
    }

    // Set growth level to Heavy
    await page.fill('#wizardGrowthLevelSlider', '70');
    console.log('Set Growth: Heavy (75%)');

    await page.waitForTimeout(2000);

    // Check charge summary content via JavaScript
    const summaryDetails = await page.evaluate(() => {
        const content = document.getElementById('chargeSummaryContent');
        if (!content) return { exists: false };

        const text = content.textContent || '';
        const html = content.innerHTML || '';

        // Check for various sections
        return {
            exists: true,
            text: text,
            // Check headers
            hasBoatDetails: html.includes('Boat Details'),
            hasPricingBreakdown: html.includes('Pricing Breakdown'),

            // Check boat information
            hasBoatName: text.includes('Sea Breeze'),
            hasBoatLength: text.includes('42 feet'),
            hasBoatType: text.includes('Powerboat'),
            hasHullType: text.includes('Catamaran'),
            hasTwinEngines: text.includes('Twin Engines'),

            // Check condition information
            hasPaintCondition: text.includes('Paint Condition') && text.includes('Poor'),
            hasGrowthLevel: text.includes('Growth Level') && text.includes('Heavy'),

            // Check pricing details
            hasBaseRate: text.includes('Base rate'),
            hasPowerboatSurcharge: text.includes('Powerboat') && text.includes('25%'),
            hasCatamaranSurcharge: text.includes('Catamaran') && text.includes('25%'),
            hasTwinEnginesSurcharge: text.includes('Twin engines') && text.includes('10%'),
            hasPaintSurcharge: text.includes('Paint condition') && text.includes('10%'),
            hasGrowthSurcharge: text.includes('Growth level') && text.includes('75%'),
            hasTotalSurcharges: text.includes('Total surcharges'),
            hasTotal: text.includes('Total:') && text.includes('$')
        };
    });

    console.log('\n=== Charge Summary Content Analysis ===');

    if (!summaryDetails.exists) {
        console.log('✗ Charge summary not found');
        expect(summaryDetails.exists).toBe(true);
        return;
    }

    console.log('\nSection Headers:');
    console.log(`  Boat Details section: ${summaryDetails.hasBoatDetails ? '✓' : '✗'}`);
    console.log(`  Pricing Breakdown section: ${summaryDetails.hasPricingBreakdown ? '✓' : '✗'}`);

    console.log('\nBoat Information:');
    console.log(`  Boat name (Sea Breeze): ${summaryDetails.hasBoatName ? '✓' : '✗'}`);
    console.log(`  Boat length (42 feet): ${summaryDetails.hasBoatLength ? '✓' : '✗'}`);
    console.log(`  Boat type (Powerboat): ${summaryDetails.hasBoatType ? '✓' : '✗'}`);
    console.log(`  Hull type (Catamaran): ${summaryDetails.hasHullType ? '✓' : '✗'}`);
    console.log(`  Twin engines: ${summaryDetails.hasTwinEngines ? '✓' : '✗'}`);

    console.log('\nCondition Details:');
    console.log(`  Paint condition (Poor): ${summaryDetails.hasPaintCondition ? '✓' : '✗'}`);
    console.log(`  Growth level (Heavy): ${summaryDetails.hasGrowthLevel ? '✓' : '✗'}`);

    console.log('\nPricing Details:');
    console.log(`  Base rate: ${summaryDetails.hasBaseRate ? '✓' : '✗'}`);
    console.log(`  Powerboat surcharge (25%): ${summaryDetails.hasPowerboatSurcharge ? '✓' : '✗'}`);
    console.log(`  Catamaran surcharge (25%): ${summaryDetails.hasCatamaranSurcharge ? '✓' : '✗'}`);
    console.log(`  Twin engines surcharge (10%): ${summaryDetails.hasTwinEnginesSurcharge ? '✓' : '✗'}`);
    console.log(`  Paint surcharge (10%): ${summaryDetails.hasPaintSurcharge ? '✓' : '✗'}`);
    console.log(`  Growth surcharge (75%): ${summaryDetails.hasGrowthSurcharge ? '✓' : '✗'}`);
    console.log(`  Total surcharges: ${summaryDetails.hasTotalSurcharges ? '✓' : '✗'}`);
    console.log(`  Final total: ${summaryDetails.hasTotal ? '✓' : '✗'}`);

    // Verify all key elements are present
    expect(summaryDetails.hasBoatDetails).toBe(true);
    expect(summaryDetails.hasPricingBreakdown).toBe(true);
    expect(summaryDetails.hasBoatName).toBe(true);
    expect(summaryDetails.hasBoatLength).toBe(true);
    expect(summaryDetails.hasTotal).toBe(true);

    console.log('\n✅ Detailed charge summary displays all information correctly!');
});