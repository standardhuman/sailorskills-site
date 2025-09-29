import { test, expect } from '@playwright/test';

test('Debug showCheckout function execution', async ({ page }) => {
    // Inject our own debug logging
    await page.addInitScript(() => {
        window.debugLogs = [];

        // Override console.log to capture logs
        const originalLog = console.log;
        console.log = function(...args) {
            window.debugLogs.push(args.join(' '));
            originalLog.apply(console, args);
        };
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

    // Before clicking checkout, let's inject a wrapper around showCheckout
    const injectionResult = await page.evaluate(() => {
        const originalShowCheckout = window.showCheckout;
        if (originalShowCheckout) {
            window.showCheckout = function() {
                console.log('[TEST WRAPPER] showCheckout is being called!');
                console.log('[TEST WRAPPER] selectedServiceKey =', window.selectedServiceKey);
                return originalShowCheckout.apply(this, arguments);
            };
            return 'Wrapper injected successfully';
        } else {
            return 'showCheckout not found';
        }
    });
    console.log('Injection result:', injectionResult);

    // Click Proceed to Checkout
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    // Get all debug logs
    const logs = await page.evaluate(() => window.debugLogs);
    console.log('\n=== All captured logs ===');
    logs.forEach(log => console.log(log));

    // Check if our debug message was logged
    const debugLogFound = logs.some(log => log.includes('[DEBUG] showCheckout called'));
    const wrapperLogFound = logs.some(log => log.includes('[TEST WRAPPER] showCheckout is being called'));

    console.log('\n=== Results ===');
    console.log('Debug log found:', debugLogFound);
    console.log('Wrapper log found:', wrapperLogFound);

    // Check actual visibility
    const anodeSection = page.locator('#anode-details-section');
    const isVisible = await anodeSection.isVisible();
    const style = await anodeSection.getAttribute('style');

    console.log('\nAnode section visible:', isVisible);
    console.log('Anode section style:', style);

    // Get selectedServiceKey value
    const serviceKey = await page.evaluate(() => window.selectedServiceKey);
    console.log('selectedServiceKey value:', serviceKey);

    // Check if the function exists and its source
    const functionInfo = await page.evaluate(() => {
        if (typeof showCheckout === 'function') {
            const source = showCheckout.toString();
            return {
                exists: true,
                includesDebug: source.includes('[DEBUG]'),
                includesAnodeLogic: source.includes('anodes_only'),
                firstLine: source.split('\n')[0],
                length: source.length
            };
        }
        return { exists: false };
    });
    console.log('\nshowCheckout function info:', functionInfo);
});