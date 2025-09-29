import { test, expect } from '@playwright/test';

test('Test module load order and showCheckout availability', async ({ page }) => {
    // Navigate to diving page
    await page.goto('http://localhost:3000/diving');

    // Wait a bit longer for modules to fully load
    await page.waitForTimeout(3000);

    // Check what's available after full page load
    const afterLoadCheck = await page.evaluate(() => {
        return {
            showCheckoutType: typeof window.showCheckout,
            showCheckoutExists: window.showCheckout !== undefined,
            selectedServiceKeyType: typeof window.selectedServiceKey
        };
    });
    console.log('After page load:', afterLoadCheck);

    // If showCheckout doesn't exist, try to wait for it
    if (!afterLoadCheck.showCheckoutExists) {
        console.log('showCheckout not found, checking script execution...');

        const scriptInfo = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return scripts.map(s => ({
                src: s.src || 'inline',
                type: s.type || 'text/javascript',
                async: s.async,
                defer: s.defer
            }));
        });
        console.log('Scripts on page:', scriptInfo);
    }

    // Proceed with the test flow
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);
    await page.fill('#anodesToInstall', '4');
    await page.waitForTimeout(500);
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(1000);

    // Check showCheckout right before clicking
    const beforeClickCheck = await page.evaluate(() => {
        return {
            showCheckoutType: typeof window.showCheckout,
            showCheckoutSource: window.showCheckout ? window.showCheckout.toString().substring(0, 100) : 'undefined'
        };
    });
    console.log('\nBefore clicking checkout button:');
    console.log('showCheckout type:', beforeClickCheck.showCheckoutType);
    console.log('showCheckout source:', beforeClickCheck.showCheckoutSource);

    // Try clicking with error handling
    try {
        await page.click('#checkout-button');
        console.log('Checkout button clicked successfully');
    } catch (e) {
        console.log('Error clicking checkout button:', e.message);
    }

    await page.waitForTimeout(2000);

    // Check final state
    const finalCheck = await page.evaluate(() => {
        const anodeSection = document.getElementById('anode-details-section');
        const checkoutSection = document.getElementById('checkout-section');
        return {
            anodeSectionExists: !!anodeSection,
            anodeSectionDisplay: anodeSection?.style.display,
            anodeSectionVisible: anodeSection ? window.getComputedStyle(anodeSection).display !== 'none' : false,
            checkoutSectionVisible: checkoutSection ? window.getComputedStyle(checkoutSection).display !== 'none' : false,
            selectedServiceKey: window.selectedServiceKey
        };
    });

    console.log('\nFinal state:');
    console.log(finalCheck);

    // Try to manually trigger showCheckout if it exists
    if (afterLoadCheck.showCheckoutExists || beforeClickCheck.showCheckoutType === 'function') {
        console.log('\nTrying to manually call showCheckout...');
        const manualResult = await page.evaluate(() => {
            try {
                window.showCheckout();
                return 'Successfully called showCheckout';
            } catch (e) {
                return `Error: ${e.message}`;
            }
        });
        console.log('Manual call result:', manualResult);

        // Check anode section after manual call
        await page.waitForTimeout(1000);
        const afterManual = await page.locator('#anode-details-section').isVisible();
        console.log('Anode section visible after manual call:', afterManual);
    }
});