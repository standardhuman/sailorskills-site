import { test, expect } from '@playwright/test';

test('Direct check of showCheckout execution', async ({ page }) => {
    // Navigate and inject code to trace execution
    await page.goto('http://localhost:3000/diving');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Inject code to capture showCheckout execution
    await page.evaluate(() => {
        // Store original console.log
        const originalLog = console.log;
        window.capturedLogs = [];
        console.log = function(...args) {
            window.capturedLogs.push(args.join(' '));
            originalLog.apply(console, args);
        };
    });

    // Click through the flow
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);
    await page.fill('#anodesToInstall', '4');
    await page.waitForTimeout(500);
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(1000);

    // Check the button and selectedServiceKey before clicking
    const preClickState = await page.evaluate(() => {
        const button = document.getElementById('checkout-button');
        return {
            buttonExists: !!button,
            buttonOnclick: button?.onclick?.toString() || 'none',
            selectedServiceKey: window.selectedServiceKey,
            hasEventListeners: button?._getEventListeners?.('click').length || 'unknown'
        };
    });
    console.log('Pre-click state:', preClickState);

    // Click checkout button
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    // Get captured logs
    const logs = await page.evaluate(() => window.capturedLogs);
    const debugLog = logs.find(log => log.includes('[DEBUG]'));
    console.log('Debug log found:', !!debugLog);
    if (debugLog) {
        console.log('Debug log content:', debugLog);
    }

    // Check if the section logic was executed by checking computed style
    const sectionState = await page.evaluate(() => {
        const section = document.getElementById('anode-details-section');
        const computedStyle = window.getComputedStyle(section);
        return {
            exists: !!section,
            inlineStyle: section?.style.display || 'none',
            computedDisplay: computedStyle.display,
            selectedServiceKey: window.selectedServiceKey,
            showCheckoutExists: typeof window.showCheckout
        };
    });

    console.log('\n=== Section State ===');
    console.log('Section exists:', sectionState.exists);
    console.log('Inline style display:', sectionState.inlineStyle);
    console.log('Computed display:', sectionState.computedDisplay);
    console.log('selectedServiceKey:', sectionState.selectedServiceKey);
    console.log('showCheckout type:', sectionState.showCheckoutExists);

    // Try to manually execute the visibility logic
    const manualExecution = await page.evaluate(() => {
        const section = document.getElementById('anode-details-section');
        const serviceKey = window.selectedServiceKey;

        if (section && serviceKey === 'anodes_only') {
            // Manually set it to visible
            section.style.display = 'block';
            return {
                success: true,
                nowVisible: section.style.display === 'block',
                serviceKey: serviceKey
            };
        }
        return {
            success: false,
            sectionExists: !!section,
            serviceKey: serviceKey
        };
    });

    console.log('\n=== Manual Execution ===');
    console.log('Result:', manualExecution);

    // Check final visibility
    const finalVisible = await page.locator('#anode-details-section').isVisible();
    console.log('Final visibility after manual fix:', finalVisible);

    // Take screenshot
    await page.screenshot({ path: 'tests/direct-check.png', fullPage: true });

    if (finalVisible) {
        console.log('\n✅ Manual fix worked - the section can be made visible');
    }
});