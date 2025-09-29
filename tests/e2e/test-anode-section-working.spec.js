import { test, expect } from '@playwright/test';

test('Verify anode details section shows for Anodes Only service', async ({ page }) => {
    // Navigate to diving page
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(2000);

    // Capture console logs
    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[DEBUG]') || text.includes('showCheckout')) {
            logs.push(text);
        }
    });

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

    // Click Proceed to Checkout
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    // Check if checkout form is visible
    const checkoutFormVisible = await page.locator('#checkout-section').isVisible();
    console.log('Checkout form visible:', checkoutFormVisible);

    // Check anode details section visibility
    const anodeSection = page.locator('#anode-details-section');
    const isVisible = await anodeSection.isVisible();
    const style = await anodeSection.getAttribute('style');

    console.log('\n=== Anode Details Section ===');
    console.log('Visible:', isVisible);
    console.log('Style:', style);

    // Check all form sections
    const sections = {
        'Boat Info': '#boat-info-section',
        'Anode Details': '#anode-details-section',
        'Marina Info': '#marina-info-section',
        'Contact Info': '#contact-info-section',
        'Billing': '#billing-info-section'
    };

    console.log('\n=== All Form Sections ===');
    for (const [name, selector] of Object.entries(sections)) {
        const section = page.locator(selector);
        const exists = await section.count() > 0;
        if (exists) {
            const visible = await section.isVisible();
            console.log(`${name}: ${visible ? '✅ Visible' : '❌ Hidden'}`);
        }
    }

    // Check if anode details textarea exists and is visible
    const anodeTextarea = page.locator('#anode-details');
    const textareaVisible = await anodeTextarea.isVisible();
    console.log('\nAnode details textarea visible:', textareaVisible);

    // Check debug logs
    if (logs.length > 0) {
        console.log('\n=== Debug Logs ===');
        logs.forEach(log => console.log(log));
    }

    // Take screenshot
    await page.screenshot({ path: 'tests/anode-section-working.png', fullPage: true });
    console.log('\nScreenshot saved to tests/anode-section-working.png');

    // Verify success
    if (isVisible) {
        console.log('\n✅ SUCCESS: Anode details section is visible for Anodes Only service!');
    } else {
        console.log('\n❌ FAILED: Anode details section is not visible');
    }

    expect(isVisible).toBe(true);
});