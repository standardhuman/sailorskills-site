import { test, expect } from '@playwright/test';

test('Test anode details section visibility with full debugging', async ({ page }) => {
    // Capture ALL console messages
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        console.log(`[Browser Console] ${text}`);
    });

    // Navigate with cache bypass
    await page.goto('http://localhost:3000/diving', {
        waitUntil: 'domcontentloaded'
    });

    // Wait for services to load
    await page.waitForTimeout(2000);

    console.log('\n=== STARTING ANODE DETAILS TEST ===\n');

    // Click Anodes Only service
    console.log('1. Clicking Anodes Only service...');
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);

    // Click again to continue
    console.log('2. Clicking again to continue...');
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);

    // Fill anode quantity
    console.log('3. Filling anode quantity with 4...');
    await page.fill('#anodesToInstall', '4');
    await page.waitForTimeout(500);

    // Click View Estimate
    console.log('4. Clicking View Estimate...');
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(1000);

    // Now click Proceed to Checkout
    console.log('5. Clicking Proceed to Checkout...');
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    console.log('\n=== CHECKING RESULTS ===\n');

    // Check if checkout section is visible
    const checkoutVisible = await page.locator('#checkout-section').isVisible();
    console.log(`Checkout section visible: ${checkoutVisible}`);

    // Check all form sections
    const sections = [
        { id: '#boat-info-section', name: 'Boat Info' },
        { id: '#item-recovery-section', name: 'Item Recovery' },
        { id: '#anode-details-section', name: 'Anode Details' },
        { id: '#service-interval-section', name: 'Service Interval' }
    ];

    for (const section of sections) {
        const isVisible = await page.locator(section.id).isVisible();
        const style = await page.locator(section.id).getAttribute('style');
        console.log(`${section.name} section:`);
        console.log(`  - Visible: ${isVisible}`);
        console.log(`  - Style: ${style}`);
    }

    // Execute JavaScript in the page context to check variables
    console.log('\n=== CHECKING JAVASCRIPT STATE ===\n');
    const jsState = await page.evaluate(() => {
        const result = {
            selectedServiceKey: typeof selectedServiceKey !== 'undefined' ? selectedServiceKey : 'undefined',
            orderData: typeof orderData !== 'undefined' ? orderData : 'undefined',
            showCheckoutExists: typeof showCheckout === 'function'
        };

        // Try to manually check and show anode section
        const anodeSection = document.getElementById('anode-details-section');
        if (anodeSection) {
            result.anodeSectionFound = true;
            result.currentDisplay = anodeSection.style.display;

            // Force show it
            anodeSection.style.display = 'block';
            result.forcedToShow = true;
        } else {
            result.anodeSectionFound = false;
        }

        return result;
    });

    console.log('JavaScript state:', JSON.stringify(jsState, null, 2));

    // Check if forcing display worked
    await page.waitForTimeout(500);
    const anodeVisibleAfterForce = await page.locator('#anode-details-section').isVisible();
    console.log(`\nAnode section visible after forcing display: ${anodeVisibleAfterForce}`);

    // Look for showCheckout logs
    console.log('\n=== SHOWCHECKOUT LOGS ===\n');
    const showCheckoutLogs = consoleLogs.filter(log => log.includes('showCheckout') || log.includes('Anode section'));
    if (showCheckoutLogs.length > 0) {
        console.log('Found showCheckout related logs:');
        showCheckoutLogs.forEach(log => console.log(`  - ${log}`));
    } else {
        console.log('NO showCheckout logs found - function may not be executing or logs not present');
    }

    // Final assertion
    if (anodeVisibleAfterForce) {
        console.log('\n✅ Anode section CAN be displayed (exists in DOM)');
        console.log('❌ But JavaScript is NOT showing it automatically');
    } else {
        console.log('\n❌ Anode section cannot be displayed');
    }
});