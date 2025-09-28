import { test, expect } from '@playwright/test';

test('Verify consolidated charge summary displays pricing details', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Opening Recurring Cleaning Wizard ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Enter boat details
    const boatLengthInput = await page.locator('#wizardBoatLength');
    if (await boatLengthInput.count() > 0) {
        await boatLengthInput.fill('45');
        console.log('Set boat length to 45 feet');
    }

    // Select some options to generate surcharges
    const catamaranRadio = await page.locator('input[name="wizard_hull_type"][value="catamaran"]');
    if (await catamaranRadio.count() > 0) {
        await catamaranRadio.click();
        console.log('Selected Catamaran');
    }

    // Set growth level to heavy for surcharge
    const growthSlider = await page.locator('#wizardGrowthLevelSlider');
    if (await growthSlider.count() > 0) {
        await growthSlider.fill('70');
        console.log('Set growth to Heavy (75%)');
    }

    // Wait for pricing to update
    await page.waitForTimeout(1500);

    console.log('\n=== Checking Charge Summary ===');

    // Check that there's NO Price Estimate section in the wizard
    const priceEstimateSection = await page.locator('#wizardPricingSection').count();
    console.log(`Price Estimate section in wizard: ${priceEstimateSection === 0 ? '✓ Removed' : '✗ Still exists'}`);
    expect(priceEstimateSection).toBe(0);

    // Scroll down to see the charge summary
    await page.evaluate(() => {
        const chargeSummary = document.querySelector('.charge-summary');
        if (chargeSummary) {
            chargeSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    await page.waitForTimeout(1000);

    // Wait for the charge summary content to be visible and populated
    await page.waitForSelector('#chargeSummaryContent', { state: 'visible', timeout: 5000 });

    // Check that the main Charge Summary is populated with details
    const chargeSummaryContent = await page.locator('#chargeSummaryContent').textContent();
    console.log('\nCharge Summary contains:');

    // Should contain service name
    const hasService = chargeSummaryContent.includes('Recurring Cleaning');
    console.log(`  Service name: ${hasService ? '✓' : '✗'}`);
    expect(hasService).toBe(true);

    // Should contain base rate calculation
    const hasBaseRate = chargeSummaryContent.includes('Base rate:') && chargeSummaryContent.includes('45ft');
    console.log(`  Base rate with boat length: ${hasBaseRate ? '✓' : '✗'}`);
    expect(hasBaseRate).toBe(true);

    // Should contain surcharge details
    const hasCatamaranSurcharge = chargeSummaryContent.includes('Catamaran') && chargeSummaryContent.includes('25%');
    console.log(`  Catamaran surcharge (25%): ${hasCatamaranSurcharge ? '✓' : '✗'}`);
    expect(hasCatamaranSurcharge).toBe(true);

    const hasGrowthSurcharge = chargeSummaryContent.includes('Growth') && chargeSummaryContent.includes('75%');
    console.log(`  Growth surcharge (75%): ${hasGrowthSurcharge ? '✓' : '✗'}`);
    expect(hasGrowthSurcharge).toBe(true);

    // Should contain total surcharges line
    const hasTotalSurcharges = chargeSummaryContent.includes('Total surcharges');
    console.log(`  Total surcharges summary: ${hasTotalSurcharges ? '✓' : '✗'}`);
    expect(hasTotalSurcharges).toBe(true);

    // Should contain final total
    const hasTotal = chargeSummaryContent.includes('Total:') && chargeSummaryContent.includes('$');
    console.log(`  Final total: ${hasTotal ? '✓' : '✗'}`);
    expect(hasTotal).toBe(true);

    // Check that charge button exists
    const chargeButton = await page.locator('#chargeButton');
    const chargeButtonExists = await chargeButton.count() > 0;
    console.log(`  Charge button present: ${chargeButtonExists ? '✓' : '✗'}`);
    expect(chargeButtonExists).toBe(true);

    // Check visibility of charge summary
    const chargeSummaryVisible = await page.locator('.charge-summary').isVisible();
    console.log(`  Charge summary visible: ${chargeSummaryVisible ? '✓' : '✗'}`);
    expect(chargeSummaryVisible).toBe(true);

    console.log('\n✅ Consolidated charge summary working correctly!');
});