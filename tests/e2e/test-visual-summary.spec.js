import { test, expect } from '@playwright/test';

test('Visual verification of detailed charge summary', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Visual Test of Charge Summary ===');

    // Open recurring cleaning wizard
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Set up a complex configuration
    console.log('\nConfiguring boat with surcharges:');

    // Set boat name
    const boatNameInput = await page.locator('#wizardBoatName');
    if (await boatNameInput.count() > 0) {
        await boatNameInput.fill('Test Vessel');
    }

    // Set boat length
    await page.fill('#wizardBoatLength', '50');
    console.log('  Length: 50 feet');

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

    // Select paint condition - Poor
    const poorPaintBtn = await page.locator('button[data-value="poor"]');
    if (await poorPaintBtn.count() > 0) {
        await poorPaintBtn.click();
        console.log('  Paint: Poor (10% surcharge)');
    }

    // Set growth to Heavy
    await page.fill('#wizardGrowthLevelSlider', '70');
    console.log('  Growth: Heavy (75% surcharge)');

    // Wait for pricing to update
    await page.waitForTimeout(2000);

    // Scroll to charge summary
    await page.evaluate(() => {
        const elem = document.getElementById('chargeSummaryContent');
        if (elem) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
    await page.waitForTimeout(1000);

    // Take screenshot of the charge summary
    const chargeSummaryElement = await page.locator('.charge-summary');
    await chargeSummaryElement.screenshot({
        path: 'charge-summary-detailed.png',
        animations: 'disabled'
    });
    console.log('\n✅ Screenshot saved as charge-summary-detailed.png');

    // Verify key elements are present
    const summaryContent = await page.locator('#chargeSummaryContent');
    await expect(summaryContent).toContainText('Boat Details');
    await expect(summaryContent).toContainText('Pricing Breakdown');
    await expect(summaryContent).toContainText('50 feet');
    await expect(summaryContent).toContainText('Powerboat');
    await expect(summaryContent).toContainText('Total:');

    console.log('\n✅ All key elements verified in charge summary!');
});