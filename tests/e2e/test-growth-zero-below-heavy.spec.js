import { test, expect } from '@playwright/test';

test('Verify growth surcharges are zero below heavy level', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Opening Recurring Cleaning Wizard ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Enter boat length for pricing
    const boatLengthInput = await page.locator('#wizardBoatLength');
    if (await boatLengthInput.count() > 0) {
        await boatLengthInput.fill('40');
        console.log('Set boat length to 40 feet');
    }

    const slider = await page.locator('#wizardGrowthLevelSlider');
    const valueDisplay = await page.locator('#wizardGrowthSliderValue');

    console.log('\n=== Testing Growth Levels Below Heavy (should be 0%) ===');

    // Test levels that should have 0% surcharge
    const zeroLevels = [
        { value: '5', name: 'Minimal' },
        { value: '15', name: 'Very Light' },
        { value: '25', name: 'Light' },
        { value: '35', name: 'Light Moderate' },
        { value: '45', name: 'Moderate' },
        { value: '55', name: 'Moderate Heavy' }
    ];

    for (const level of zeroLevels) {
        await slider.fill(level.value);
        await page.waitForTimeout(500);

        const displayText = await valueDisplay.textContent();
        console.log(`${level.name}: ${displayText}`);

        // Should show 0%
        expect(displayText).toContain('0%');

        // Check that price breakdown doesn't include growth surcharge
        const breakdown = await page.locator('#wizardCostBreakdown').textContent();
        const hasGrowthSurcharge = breakdown.includes('Growth level') && !breakdown.includes('Growth level (');

        if (hasGrowthSurcharge) {
            console.log(`  ✗ Growth surcharge incorrectly applied at ${level.name}`);
        } else {
            console.log(`  ✓ No growth surcharge at ${level.name}`);
        }
    }

    console.log('\n=== Testing Growth Levels At/Above Heavy (should have surcharge) ===');

    // Test levels that should have surcharges
    const chargedLevels = [
        { value: '65', name: 'Heavy', expected: 75 },
        { value: '75', name: 'Very Heavy', expected: 100 },
        { value: '85', name: 'Severe', expected: 150 },
        { value: '95', name: 'Extreme', expected: 200 }
    ];

    for (const level of chargedLevels) {
        await slider.fill(level.value);
        await page.waitForTimeout(800);

        const displayText = await valueDisplay.textContent();
        console.log(`${level.name}: ${displayText}`);

        // Should show the expected percentage
        expect(displayText).toContain(`${level.expected}%`);

        // Check that price breakdown includes growth surcharge
        const breakdown = await page.locator('#wizardCostBreakdown').textContent();
        const hasGrowthSurcharge = breakdown.includes(`${level.expected}%`);

        if (hasGrowthSurcharge) {
            console.log(`  ✓ Growth surcharge ${level.expected}% correctly applied`);
        } else {
            console.log(`  ✗ Growth surcharge missing at ${level.name}`);
        }

        expect(hasGrowthSurcharge).toBe(true);
    }

    console.log('\n✅ Growth surcharges correctly start at heavy level (75%)!');
});