import { test, expect } from '@playwright/test';

test('Check for script loading errors', async ({ page }) => {
    const errors = [];
    const logs = [];

    // Capture errors
    page.on('pageerror', err => {
        errors.push(err.message);
        console.log('PAGE ERROR:', err.message);
    });

    // Capture console messages
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`Console error: ${msg.text()}`);
            console.log('CONSOLE ERROR:', msg.text());
        }
        logs.push(msg.text());
    });

    // Navigate to diving page
    await page.goto('http://localhost:3000/diving');

    // Wait a bit for script to load
    await page.waitForTimeout(3000);

    // Check if key functions exist
    const functionChecks = await page.evaluate(() => {
        return {
            showCheckout: typeof window.showCheckout,
            populateServiceButtons: typeof window.populateServiceButtons,
            calculateCost: typeof window.calculateCost,
            selectService: typeof window.selectService,
            selectedServiceKey: typeof window.selectedServiceKey,
            serviceData: typeof window.serviceData
        };
    });

    console.log('\n=== Function Availability ===');
    for (const [name, type] of Object.entries(functionChecks)) {
        console.log(`${name}: ${type}`);
    }

    // Check if script was loaded
    const scriptStatus = await page.evaluate(() => {
        const script = document.querySelector('script[src*="script.js"]');
        return {
            exists: !!script,
            src: script?.src || 'not found',
            type: script?.type || 'not found'
        };
    });

    console.log('\n=== Script Tag Status ===');
    console.log('Script exists:', scriptStatus.exists);
    console.log('Script src:', scriptStatus.src);
    console.log('Script type:', scriptStatus.type);

    // Try to manually check if showCheckout is defined at the end of the script
    const manualCheck = await page.evaluate(async () => {
        // Force a re-import of the module
        try {
            const module = await import('./script.js?v=10');
            return {
                moduleLoaded: true,
                hasShowCheckout: 'showCheckout' in window,
                showCheckoutType: typeof window.showCheckout
            };
        } catch (e) {
            return {
                moduleLoaded: false,
                error: e.message,
                hasShowCheckout: 'showCheckout' in window,
                showCheckoutType: typeof window.showCheckout
            };
        }
    });

    console.log('\n=== Manual Module Check ===');
    console.log('Module check result:', manualCheck);

    if (errors.length > 0) {
        console.log('\n=== Errors Found ===');
        errors.forEach(err => console.log('- ', err));
    } else {
        console.log('\n✅ No errors found during script loading');
    }

    // Show first few logs to understand execution
    console.log('\n=== First 10 Console Logs ===');
    logs.slice(0, 10).forEach(log => console.log('- ', log));
});