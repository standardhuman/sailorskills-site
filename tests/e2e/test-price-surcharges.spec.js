import { test, expect } from '@playwright/test';

test('Verify surcharge percentages in price estimate', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Opening Recurring Cleaning Wizard ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Enter boat length to trigger pricing calculation
    const boatLengthInput = await page.locator('#wizardBoatLength');
    if (await boatLengthInput.count() > 0) {
        await boatLengthInput.fill('40');
        console.log('Set boat length to 40 feet');
    }

    // Select options that trigger surcharges
    console.log('\n=== Setting up surcharges ===');

    // Select catamaran for 25% surcharge
    const catamaranRadio = await page.locator('input[name="wizard_hull_type"][value="catamaran"]');
    if (await catamaranRadio.count() > 0) {
        await catamaranRadio.click();
        console.log('Selected Catamaran (25% surcharge)');
    }

    // Select poor paint condition for 10% surcharge
    const poorPaintBtn = await page.locator('button[data-value="poor"]');
    if (await poorPaintBtn.count() > 0) {
        await poorPaintBtn.click();
        console.log('Selected Poor paint condition (10% surcharge)');
    }

    // Set growth slider to heavy (35% surcharge)
    const growthSlider = await page.locator('#wizardGrowthLevelSlider');
    if (await growthSlider.count() > 0) {
        await growthSlider.fill('65'); // 65 should map to "heavy"
        console.log('Set growth level to Heavy (35% surcharge)');
    }

    // Wait for pricing to update
    await page.waitForTimeout(1500);

    // Check the price breakdown
    console.log('\n=== Checking Price Breakdown ===');
    const breakdownElement = await page.locator('#wizardCostBreakdown');
    const breakdown = await breakdownElement.textContent();

    console.log('Price breakdown content:');
    console.log(breakdown);

    // Verify surcharges include percentages
    const hasCatamaranPercent = breakdown.includes('25%');
    const hasPoorPaintPercent = breakdown.includes('10%');
    const hasHeavyGrowthPercent = breakdown.includes('35%');
    const hasTotalSurcharges = breakdown.includes('Total surcharges');

    console.log('\nSurcharge percentages found:');
    console.log(`  Catamaran 25%: ${hasCatamaranPercent}`);
    console.log(`  Poor paint 10%: ${hasPoorPaintPercent}`);
    console.log(`  Heavy growth 35%: ${hasHeavyGrowthPercent}`);
    console.log(`  Total surcharges line: ${hasTotalSurcharges}`);

    // Verify all percentages are displayed
    expect(hasCatamaranPercent).toBe(true);
    expect(hasPoorPaintPercent).toBe(true);
    expect(hasHeavyGrowthPercent).toBe(true);
    expect(hasTotalSurcharges).toBe(true);

    // Check that the total price is displayed
    const totalPriceElement = await page.locator('#wizardTotalPrice');
    const totalPrice = await totalPriceElement.textContent();
    console.log(`\nTotal price displayed: ${totalPrice}`);
    expect(totalPrice).toMatch(/\$[\d,]+\.?\d*/);

    console.log('\n✅ All surcharge percentages are displayed in the price estimate!');
});