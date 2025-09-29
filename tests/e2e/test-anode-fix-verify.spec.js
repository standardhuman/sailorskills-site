import { test, expect } from '@playwright/test';

test('Verify anode details section shows for Anodes Only service', async ({ page }) => {
    // Capture console logs
    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
        if (text.includes('[DEBUG]') || text.includes('showCheckout')) {
            console.log('CONSOLE:', text);
        }
    });

    // Navigate to diving page
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(2000);

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

    // Check for debug log
    const debugLog = logs.find(log => log.includes('[DEBUG] showCheckout'));
    if (debugLog) {
        console.log('✅ showCheckout IS being called:', debugLog);
    } else {
        console.log('❌ showCheckout is NOT being called - browser may be using cached version');
    }

    // Check anode details section visibility
    const anodeSection = page.locator('#anode-details-section');
    const isVisible = await anodeSection.isVisible();
    const style = await anodeSection.getAttribute('style');

    console.log('\nAnode Details Section Status:');
    console.log('- Visible:', isVisible);
    console.log('- Style:', style);

    // Check what sections are visible
    const sections = {
        'Boat Info': '#boat-info-section',
        'Anode Details': '#anode-details-section',
        'Service Interval': '#service-interval-section'
    };

    console.log('\nAll sections visibility:');
    for (const [name, selector] of Object.entries(sections)) {
        const visible = await page.locator(selector).isVisible();
        console.log(`- ${name}: ${visible}`);
    }

    // Take a screenshot
    await page.screenshot({ path: 'tests/checkout-form-anodes.png', fullPage: true });
    console.log('\nScreenshot saved to tests/checkout-form-anodes.png');

    // Final test
    if (isVisible) {
        console.log('\n✅ SUCCESS: Anode details section is now visible!');
    } else {
        console.log('\n❌ FAILED: Anode details section is still hidden');

        // Try to understand why
        const jsState = await page.evaluate(() => {
            return {
                selectedServiceKey: typeof selectedServiceKey !== 'undefined' ? selectedServiceKey : 'undefined',
                scriptSrc: document.querySelector('script[src*="script.js"]')?.src || 'not found'
            };
        });
        console.log('\nJavaScript state:', jsState);
    }
});