import { test } from '@playwright/test';

test('Check for console errors when clicking service', async ({ page }) => {
    // Capture ALL console messages
    const logs = [];
    page.on('console', msg => {
        logs.push({
            type: msg.type(),
            text: msg.text()
        });
    });

    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('Clicking Recurring Cleaning...');

    // Click button and wait
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Print all console logs
    console.log('\n=== All Console Messages ===');
    logs.forEach(log => {
        console.log(`[${log.type}] ${log.text}`);
    });

    // Check if renderConsolidatedForm was called
    const checkFunction = await page.evaluate(() => {
        // Try to manually call renderConsolidatedForm
        if (window.renderConsolidatedForm) {
            console.log('Manually calling renderConsolidatedForm...');
            window.renderConsolidatedForm(true, 'recurring_cleaning');
            return 'Function called manually';
        }
        return 'Function not available';
    });

    console.log('\nManual call result:', checkFunction);

    await page.waitForTimeout(1000);

    // Check wizard state after manual call
    const wizardState = await page.evaluate(() => {
        return {
            containerDisplay: document.getElementById('wizardContainer')?.style.display,
            contentLength: document.getElementById('wizardContent')?.innerHTML.length,
            buttonsHidden: document.getElementById('simpleServiceButtons')?.style.display
        };
    });

    console.log('\nWizard state after manual call:', wizardState);

    await page.screenshot({ path: 'console-errors.png', fullPage: true });
});