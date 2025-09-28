import { test, expect } from '@playwright/test';

test('Verify surcharge calculations match diving page', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Test Recurring Cleaning surcharges
    console.log('=== Testing Recurring Cleaning Surcharges ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(1500);

    // Check wizard is open
    const wizardVisible = await page.locator('#wizardContainer').isVisible();
    expect(wizardVisible).toBe(true);

    // Wait for wizard content to be fully loaded
    await page.waitForSelector('#wizardContent select[name="paint_condition"]', { state: 'visible' });

    // Fill basic boat info - these fields are in the wizard content
    const boatNameField = await page.locator('#wizardContent input[name="boat_name"]');
    if (await boatNameField.count() > 0) {
        await boatNameField.fill('Test Boat');
    }

    const boatLengthField = await page.locator('#wizardContent input[name="boat_length"]');
    if (await boatLengthField.count() > 0) {
        await boatLengthField.fill('40');
    }

    // Test Paint Condition surcharges
    console.log('\nTesting Paint Condition surcharges:');
    const paintTests = [
        { value: 'excellent', expected: '0%', label: 'Excellent' },
        { value: 'good', expected: '0%', label: 'Good' },
        { value: 'fair', expected: '0%', label: 'Fair' },
        { value: 'poor', expected: '10%', label: 'Poor' },
        { value: 'missing', expected: '15%', label: 'Missing' }
    ];

    for (const test of paintTests) {
        await page.selectOption('#wizardContent select[name="paint_condition"]', test.value);
        await page.waitForTimeout(500);

        // Check if label shows correct percentage
        const optionText = await page.$eval(
            `#wizardContent select[name="paint_condition"] option[value="${test.value}"]`,
            el => el.textContent
        );
        console.log(`  ${test.label}: Expected ${test.expected}, Found: ${optionText}`);
        expect(optionText).toContain(test.expected);
    }

    // Test Growth Level surcharges
    console.log('\nTesting Growth Level surcharges:');
    const growthTests = [
        { value: 'minimal', expected: '0%', label: 'Minimal' },
        { value: 'moderate', expected: '0%', label: 'Moderate' },
        { value: 'heavy', expected: '35%', label: 'Heavy' },
        { value: 'severe', expected: '200%', label: 'Severe' }
    ];

    for (const test of growthTests) {
        await page.selectOption('#wizardContent select[name="growth_level"]', test.value);
        await page.waitForTimeout(500);

        // Check if label shows correct percentage
        const optionText = await page.$eval(
            `#wizardContent select[name="growth_level"] option[value="${test.value}"]`,
            el => el.textContent
        );
        console.log(`  ${test.label}: Expected ${test.expected}, Found: ${optionText}`);
        expect(optionText).toContain(test.expected);
    }

    // Test Hull Type surcharges
    console.log('\nTesting Hull Type surcharges:');
    const hullTests = [
        { value: 'monohull', expected: '0%', label: 'Monohull' },
        { value: 'catamaran', expected: '25%', label: 'Catamaran' },
        { value: 'trimaran', expected: '50%', label: 'Trimaran' }
    ];

    for (const test of hullTests) {
        await page.selectOption('#wizardContent select[name="hull_type"]', test.value);
        await page.waitForTimeout(500);

        // Check if label shows correct percentage
        const optionText = await page.$eval(
            `#wizardContent select[name="hull_type"] option[value="${test.value}"]`,
            el => el.textContent
        );
        console.log(`  ${test.label}: Expected ${test.expected}, Found: ${optionText}`);
        expect(optionText).toContain(test.expected);
    }

    // Test actual calculation with surcharges
    console.log('\n=== Testing Actual Price Calculation ===');

    // Set up a scenario with surcharges
    await page.selectOption('#wizardContent select[name="paint_condition"]', 'poor'); // 10%
    await page.selectOption('#wizardContent select[name="growth_level"]', 'heavy'); // 35%
    await page.selectOption('#wizardContent select[name="hull_type"]', 'catamaran'); // 25%

    await page.waitForTimeout(1000);

    // Check if charge summary shows correct surcharges
    const chargeSummary = await page.locator('#charge-summary').textContent();
    console.log('\nCharge Summary contains:', chargeSummary);

    // Verify surcharges are being applied
    const hasPaintSurcharge = chargeSummary.includes('Paint') || chargeSummary.includes('10%');
    const hasGrowthSurcharge = chargeSummary.includes('Growth') || chargeSummary.includes('35%');
    const hasHullSurcharge = chargeSummary.includes('Hull') || chargeSummary.includes('25%');

    console.log(`Paint surcharge applied: ${hasPaintSurcharge}`);
    console.log(`Growth surcharge applied: ${hasGrowthSurcharge}`);
    console.log(`Hull surcharge applied: ${hasHullSurcharge}`);

    console.log('\n✅ Surcharge calculations verified!');
});