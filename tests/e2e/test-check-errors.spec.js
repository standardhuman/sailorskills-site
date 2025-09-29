import { test, expect } from '@playwright/test';

test('Check for JavaScript errors', async ({ page }) => {
    const errors = [];

    // Capture page errors
    page.on('pageerror', err => {
        errors.push(err.message);
        console.log('PAGE ERROR:', err.message);
    });

    // Capture console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            console.log('CONSOLE ERROR:', msg.text());
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

    // Check if showCheckout is defined
    const functionCheck = await page.evaluate(() => {
        return {
            showCheckoutExists: typeof showCheckout !== 'undefined',
            showCheckoutType: typeof showCheckout
        };
    });

    console.log('\nFunction check:', functionCheck);

    if (errors.length > 0) {
        console.log('\n❌ JavaScript errors found:');
        errors.forEach(err => console.log('  -', err));
    } else {
        console.log('\n✅ No JavaScript errors');
    }

    // Try to manually call showCheckout
    try {
        await page.evaluate(() => {
            if (typeof showCheckout === 'function') {
                showCheckout();
                return 'Called showCheckout successfully';
            } else {
                return 'showCheckout is not a function';
            }
        });
    } catch (e) {
        console.log('Error calling showCheckout:', e.message);
    }

    // Check anode section after manual call
    await page.waitForTimeout(1000);
    const anodeVisible = await page.locator('#anode-details-section').isVisible();
    console.log('\nAnode section visible after manual call:', anodeVisible);
});