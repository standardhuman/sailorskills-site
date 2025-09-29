import { test, expect } from '@playwright/test';

test('Verify anode details section shows after module export fix', async ({ page }) => {
    // Navigate to diving page
    await page.goto('http://localhost:3000/diving');

    // Wait for the script to fully load
    await page.waitForFunction(() => {
        return typeof window.showCheckout === 'function';
    }, { timeout: 10000 });

    console.log('✅ showCheckout function is now available globally');

    // Click Anodes Only service
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);

    // Click again to continue
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);

    // Fill anode quantity
    await page.fill('#anodesToInstall', '4');
    await page.waitForTimeout(500);

    // Click View Estimate
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(1000);

    // Capture console logs before clicking checkout
    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[DEBUG]')) {
            logs.push(text);
            console.log('Console log:', text);
        }
    });

    // Click Proceed to Checkout
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    // Check anode details section visibility
    const anodeSection = page.locator('#anode-details-section');
    const isVisible = await anodeSection.isVisible();
    const style = await anodeSection.getAttribute('style');

    console.log('\n=== Anode Details Section Status ===');
    console.log('Visible:', isVisible);
    console.log('Style:', style);

    // Check what sections are visible
    const sections = {
        'Boat Info': '#boat-info-section',
        'Anode Details': '#anode-details-section',
        'Service Interval': '#service-interval-section',
        'Item Recovery': '#item-recovery-section'
    };

    console.log('\n=== All Sections Visibility ===');
    for (const [name, selector] of Object.entries(sections)) {
        const section = page.locator(selector);
        const exists = await section.count() > 0;
        if (exists) {
            const visible = await section.isVisible();
            console.log(`- ${name}: ${visible}`);
        } else {
            console.log(`- ${name}: (not in DOM)`);
        }
    }

    // Get selectedServiceKey value
    const serviceKey = await page.evaluate(() => window.selectedServiceKey);
    console.log('\nselectedServiceKey:', serviceKey);

    // Take a screenshot for verification
    await page.screenshot({ path: 'tests/anode-section-final.png', fullPage: true });

    // Verify the anode section is visible
    expect(isVisible).toBe(true);
    console.log('\n✅ SUCCESS: Anode details section is now visible for Anodes Only service!');
});