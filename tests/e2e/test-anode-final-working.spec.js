import { test, expect } from '@playwright/test';

test('FINAL TEST: Verify anode details section shows for Anodes Only', async ({ page }) => {
    // Capture console logs
    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
        if (text.includes('[DEBUG]')) {
            console.log('DEBUG LOG CAPTURED:', text);
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

    // Check window.showCheckout availability before clicking
    const checkoutFunctionExists = await page.evaluate(() => {
        return typeof window.showCheckout === 'function';
    });
    console.log('window.showCheckout exists:', checkoutFunctionExists);

    // Click Proceed to Checkout
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    // Check if debug log was captured
    const debugLogFound = logs.some(log => log.includes('[DEBUG] showCheckout called'));
    console.log('\nDebug log found:', debugLogFound);

    // Check anode details section visibility
    const anodeSection = page.locator('#anode-details-section');
    const isVisible = await anodeSection.isVisible();

    console.log('\n=== FINAL RESULT ===');
    console.log('Anode Details Section Visible:', isVisible);

    // Check the selectedServiceKey value
    const serviceKey = await page.evaluate(() => window.selectedServiceKey);
    console.log('selectedServiceKey:', serviceKey);

    // Take screenshot
    await page.screenshot({ path: 'tests/anode-final-result.png', fullPage: true });

    if (isVisible) {
        console.log('\n🎉 SUCCESS! The anode details section is now visible for Anodes Only service!');
        console.log('The fix is working correctly.');
    } else {
        console.log('\n❌ The anode details section is still not visible');

        // Try to understand why
        const debugInfo = await page.evaluate(() => {
            const section = document.getElementById('anode-details-section');
            return {
                sectionExists: !!section,
                inlineStyle: section?.style.display,
                computedStyle: section ? window.getComputedStyle(section).display : 'n/a'
            };
        });
        console.log('Debug info:', debugInfo);
    }

    expect(isVisible).toBe(true);
});