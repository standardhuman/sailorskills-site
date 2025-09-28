import { test, expect } from '@playwright/test';

test('Verify charge summary shows detailed pricing', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Testing Unified Charge Summary ===');

    // Open recurring cleaning wizard
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Set boat length
    await page.fill('#wizardBoatLength', '50');
    console.log('Set boat length to 50 feet');

    // Select catamaran
    await page.click('input[name="wizard_hull_type"][value="catamaran"]');
    console.log('Selected Catamaran (25% surcharge)');

    // Set heavy growth
    await page.fill('#wizardGrowthLevelSlider', '70');
    console.log('Set growth to Heavy (75% surcharge)');

    await page.waitForTimeout(2000);

    // Check that Price Estimate section doesn't exist in wizard
    const hasPriceEstimate = await page.evaluate(() => {
        const priceSection = document.getElementById('wizardPricingSection');
        return priceSection !== null;
    });
    console.log(`\nPrice Estimate section in wizard: ${hasPriceEstimate ? '✗ Still exists' : '✓ Removed'}`);
    expect(hasPriceEstimate).toBe(false);

    // Check charge summary content directly via JavaScript
    const summaryData = await page.evaluate(() => {
        const summaryContent = document.getElementById('chargeSummaryContent');
        if (!summaryContent) return null;

        const content = summaryContent.textContent || '';
        return {
            html: summaryContent.innerHTML,
            text: content,
            hasService: content.includes('Recurring Cleaning'),
            hasBaseRate: content.includes('Base rate'),
            hasCatamaranSurcharge: content.includes('Catamaran') && content.includes('25%'),
            hasGrowthSurcharge: content.includes('Growth') && content.includes('75%'),
            hasTotalSurcharges: content.includes('Total surcharges'),
            hasTotal: content.includes('Total:') && content.includes('$')
        };
    });

    console.log('\nCharge Summary Analysis:');
    if (!summaryData) {
        console.log('  ✗ Charge summary element not found');
        expect(summaryData).toBeTruthy();
    } else {
        console.log(`  Service name shown: ${summaryData.hasService ? '✓' : '✗'}`);
        console.log(`  Base rate calculation: ${summaryData.hasBaseRate ? '✓' : '✗'}`);
        console.log(`  Catamaran surcharge (25%): ${summaryData.hasCatamaranSurcharge ? '✓' : '✗'}`);
        console.log(`  Growth surcharge (75%): ${summaryData.hasGrowthSurcharge ? '✓' : '✗'}`);
        console.log(`  Total surcharges line: ${summaryData.hasTotalSurcharges ? '✓' : '✗'}`);
        console.log(`  Final total: ${summaryData.hasTotal ? '✓' : '✗'}`);

        // Log a snippet of the actual content for debugging
        if (!summaryData.hasService || !summaryData.hasTotal) {
            console.log('\n  Actual content snippet:', summaryData.text.substring(0, 200));
        }

        expect(summaryData.hasService).toBe(true);
        expect(summaryData.hasBaseRate).toBe(true);
        expect(summaryData.hasCatamaranSurcharge).toBe(true);
        expect(summaryData.hasGrowthSurcharge).toBe(true);
        expect(summaryData.hasTotalSurcharges).toBe(true);
        expect(summaryData.hasTotal).toBe(true);
    }

    console.log('\n✅ Unified charge summary working correctly!');
});