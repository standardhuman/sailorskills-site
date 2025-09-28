import { test } from '@playwright/test';

test('Check console for errors and adminApp', async ({ page }) => {
    // Capture ALL console messages
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
    });

    // Navigate to admin page
    console.log('Navigating to admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);

    // Check if adminApp exists
    const adminAppCheck = await page.evaluate(() => {
        return {
            adminAppExists: typeof window.adminApp !== 'undefined',
            adminAppType: typeof window.adminApp,
            hasFilterByCategory: window.adminApp && typeof window.adminApp.filterByCategory === 'function',
            hasLoadAnodeCatalog: window.adminApp && typeof window.adminApp.loadAnodeCatalog === 'function',
            renderConsolidatedFormExists: typeof window.renderConsolidatedForm !== 'undefined'
        };
    });

    console.log('\n=== AdminApp Status ===');
    console.log(JSON.stringify(adminAppCheck, null, 2));

    // Try clicking a service button
    console.log('\n=== Clicking Recurring Cleaning ===');
    try {
        await page.click('button:has-text("🔄 Recurring Cleaning")');
        await page.waitForTimeout(2000);
        console.log('Button clicked successfully');
    } catch (e) {
        console.log('Error clicking button:', e.message);
    }

    // Check what happened after click
    const afterClickCheck = await page.evaluate(() => {
        return {
            wizardContainerVisible: document.getElementById('wizardContainer')?.style.display,
            wizardContentHasContent: (document.getElementById('wizardContent')?.innerHTML?.length || 0) > 100,
            currentServiceKey: window.currentServiceKey
        };
    });

    console.log('\n=== After Click Status ===');
    console.log(JSON.stringify(afterClickCheck, null, 2));

    // Print console messages
    console.log('\n=== Console Messages ===');
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');
    const logs = consoleLogs.filter(log => log.type === 'log');

    if (errors.length > 0) {
        console.log('\nERRORS:');
        errors.forEach(log => {
            console.log(`  ${log.text}`);
            if (log.location) {
                console.log(`    at ${log.location.url}:${log.location.lineNumber}`);
            }
        });
    }

    if (warnings.length > 0) {
        console.log('\nWARNINGS:');
        warnings.forEach(log => console.log(`  ${log.text}`));
    }

    if (logs.length > 0) {
        console.log('\nLOGS:');
        logs.forEach(log => console.log(`  ${log.text}`));
    }
});