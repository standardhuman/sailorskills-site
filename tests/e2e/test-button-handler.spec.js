import { test } from '@playwright/test';

test('Check button onclick handler', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Get the onclick attribute of the Recurring Cleaning button
    const buttonInfo = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const recurringBtn = buttons.find(b => b.textContent.includes('Recurring Cleaning'));

        if (recurringBtn) {
            return {
                onclick: recurringBtn.getAttribute('onclick'),
                hasOnclick: !!recurringBtn.onclick,
                textContent: recurringBtn.textContent.trim(),
                className: recurringBtn.className
            };
        }
        return null;
    });

    console.log('Button info:', buttonInfo);

    // Check if selectServiceDirect function exists
    const functionCheck = await page.evaluate(() => {
        return {
            selectServiceDirect: typeof window.selectServiceDirect,
            selectService: typeof window.selectService,
            adminAppSelectService: window.adminApp ? typeof window.adminApp.selectService : 'adminApp not found'
        };
    });

    console.log('\nFunction availability:', functionCheck);

    // Try calling selectServiceDirect manually
    const manualCall = await page.evaluate(() => {
        if (window.selectServiceDirect) {
            window.selectServiceDirect('recurring_cleaning');
            return 'Called selectServiceDirect';
        }
        return 'selectServiceDirect not available';
    });

    console.log('\nManual call result:', manualCall);

    await page.waitForTimeout(1000);

    // Check wizard state
    const wizardState = await page.evaluate(() => {
        return {
            wizardVisible: document.getElementById('wizardContainer')?.style.display,
            hasContent: document.getElementById('wizardContent')?.innerHTML.length > 0
        };
    });

    console.log('\nWizard state after manual call:', wizardState);
});