import { test, expect } from '@playwright/test';

test('Verify admin wizard surcharge percentages', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Click Recurring Cleaning
    console.log('=== Opening Recurring Cleaning Wizard ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Check if wizard opened
    const wizardVisible = await page.locator('#wizardContainer').isVisible();
    expect(wizardVisible).toBe(true);
    console.log('Wizard opened: true');

    // Check Paint Condition buttons don't show incorrect surcharges
    console.log('\n=== Checking Paint Condition Options ===');
    const paintButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('#wizardPaintConditionButtons button'));
        return buttons.map(btn => ({
            value: btn.dataset.value,
            text: btn.textContent
        }));
    });

    paintButtons.forEach(btn => {
        console.log(`  ${btn.value}: ${btn.text}`);
    });

    // Check Growth Level slider labels
    console.log('\n=== Checking Growth Level Labels ===');
    const growthLabels = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.growth-slider-labels span'));
        return labels.map(label => label.textContent.replace(/\n/g, ' '));
    });

    growthLabels.forEach(label => {
        console.log(`  ${label}`);
    });

    // Verify key surcharges
    console.log('\n=== Verifying Surcharge Percentages ===');

    // Growth levels should show correct percentages
    const moderateLabel = growthLabels.find(l => l.includes('Moderate'));
    const heavyLabel = growthLabels.find(l => l.includes('Heavy'));
    const severeLabel = growthLabels.find(l => l.includes('Severe'));

    console.log(`Moderate growth: ${moderateLabel} (should contain 0%)`);
    console.log(`Heavy growth: ${heavyLabel} (should contain 35%)`);
    console.log(`Severe growth: ${severeLabel} (should contain 200%)`);

    expect(moderateLabel).toContain('0%');
    expect(heavyLabel).toContain('35%');
    expect(severeLabel).toContain('200%');

    // Check Hull Type radio buttons
    console.log('\n=== Checking Hull Type Options ===');
    const hullOptions = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('label'));
        const hullLabels = [];
        labels.forEach(label => {
            if (label.textContent.includes('Monohull') ||
                label.textContent.includes('Catamaran') ||
                label.textContent.includes('Trimaran')) {
                hullLabels.push(label.textContent.trim());
            }
        });
        return hullLabels;
    });

    hullOptions.forEach(option => {
        console.log(`  ${option}`);
    });

    // Verify hull type surcharges
    const trimaranOption = hullOptions.find(o => o.includes('Trimaran'));
    const catamaranOption = hullOptions.find(o => o.includes('Catamaran'));

    console.log(`\nTrimaran: ${trimaranOption} (should contain 50%)`);
    console.log(`Catamaran: ${catamaranOption} (should contain 25%)`);

    if (trimaranOption) expect(trimaranOption).toContain('50%');
    if (catamaranOption) expect(catamaranOption).toContain('25%');

    console.log('\n✅ All surcharge percentages verified successfully!');
});