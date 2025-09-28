import { test, expect } from '@playwright/test';

test('Verify new granular growth levels', async ({ page }) => {
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

    // Test each growth level
    const growthLevels = [
        { value: '5', expected: 'Minimal (0%)', surcharge: 0 },
        { value: '15', expected: 'Very Light (5%)', surcharge: 5 },
        { value: '25', expected: 'Light (10%)', surcharge: 10 },
        { value: '35', expected: 'Light Moderate (20%)', surcharge: 20 },
        { value: '45', expected: 'Moderate (35%)', surcharge: 35 },
        { value: '55', expected: 'Moderate Heavy (50%)', surcharge: 50 },
        { value: '65', expected: 'Heavy (75%)', surcharge: 75 },
        { value: '75', expected: 'Very Heavy (100%)', surcharge: 100 },
        { value: '85', expected: 'Severe (150%)', surcharge: 150 },
        { value: '95', expected: 'Extreme (200%)', surcharge: 200 }
    ];

    console.log('\n=== Testing Growth Level Graduations ===');
    const slider = await page.locator('#wizardGrowthLevelSlider');
    const valueDisplay = await page.locator('#wizardGrowthSliderValue');

    for (const level of growthLevels) {
        // Set slider value
        await slider.fill(level.value);
        await page.waitForTimeout(500);

        // Check displayed text
        const displayText = await valueDisplay.textContent();
        console.log(`Slider at ${level.value}: ${displayText} (expected: ${level.expected})`);

        // Verify the percentage is shown
        expect(displayText).toContain(`${level.surcharge}%`);
    }

    // Test pricing calculation with different growth levels
    console.log('\n=== Testing Price Calculations ===');

    // Test with 50% surcharge
    await slider.fill('55');
    await page.waitForTimeout(1000);
    let breakdown = await page.locator('#wizardCostBreakdown').textContent();
    console.log('At 50% growth surcharge:', breakdown.includes('50%') ? '✓ Shows 50%' : '✗ Missing 50%');
    expect(breakdown).toContain('50%');

    // Test with 100% surcharge
    await slider.fill('75');
    await page.waitForTimeout(1000);
    breakdown = await page.locator('#wizardCostBreakdown').textContent();
    console.log('At 100% growth surcharge:', breakdown.includes('100%') ? '✓ Shows 100%' : '✗ Missing 100%');
    expect(breakdown).toContain('100%');

    // Test with 200% surcharge
    await slider.fill('95');
    await page.waitForTimeout(1000);
    breakdown = await page.locator('#wizardCostBreakdown').textContent();
    console.log('At 200% growth surcharge:', breakdown.includes('200%') ? '✓ Shows 200%' : '✗ Missing 200%');
    expect(breakdown).toContain('200%');

    console.log('\n✅ All growth level graduations working correctly!');
});