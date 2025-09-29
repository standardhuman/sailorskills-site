import { test, expect } from '@playwright/test';

test('Debug anode details visibility step by step', async ({ page }) => {
    // Navigate and select Anodes Only service
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(1000);

    // Click Anodes Only service
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);
    await page.click('div.service-option[data-service-key="anodes_only"]'); // Click again to continue
    await page.waitForTimeout(500);

    // Fill anode quantity
    await page.fill('#anodesToInstall', '4');

    // Click View Estimate
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(500);

    // Click Proceed to Checkout
    await page.click('#checkout-button');
    await page.waitForTimeout(1000);

    // Now check what's visible in the checkout section
    const checkoutVisible = await page.locator('#checkout-section').isVisible();
    console.log('Checkout section visible:', checkoutVisible);

    // Check all checkout form sections
    const boatInfoVisible = await page.locator('#boat-info-section').isVisible();
    const itemRecoveryVisible = await page.locator('#item-recovery-section').isVisible();
    const anodeDetailsVisible = await page.locator('#anode-details-section').isVisible();
    const serviceIntervalVisible = await page.locator('#service-interval-section').isVisible();

    console.log('Section visibility:');
    console.log('- Boat info:', boatInfoVisible);
    console.log('- Item recovery:', itemRecoveryVisible);
    console.log('- Anode details:', anodeDetailsVisible);
    console.log('- Service interval:', serviceIntervalVisible);

    // Get the computed style of anode details section
    const anodeStyle = await page.locator('#anode-details-section').getAttribute('style');
    console.log('Anode section style attribute:', anodeStyle);

    // Check what selectedServiceKey is in JavaScript
    const jsValues = await page.evaluate(() => {
        return {
            selectedServiceKey: typeof selectedServiceKey !== 'undefined' ? selectedServiceKey : 'undefined',
            orderData: typeof orderData !== 'undefined' ? orderData : 'undefined',
            showCheckoutExists: typeof showCheckout === 'function'
        };
    });
    console.log('JavaScript values:', JSON.stringify(jsValues, null, 2));

    // Try to manually show the anode details section
    await page.evaluate(() => {
        const section = document.getElementById('anode-details-section');
        if (section) {
            console.log('Manually showing anode details section');
            section.style.display = 'block';
        }
    });

    await page.waitForTimeout(500);
    const manuallyVisible = await page.locator('#anode-details-section').isVisible();
    console.log('After manual show, anode details visible:', manuallyVisible);

    // If it's visible now, the section exists but JavaScript isn't showing it
    if (manuallyVisible) {
        console.log('✓ Section exists in DOM but JavaScript is not showing it properly');
    }
});