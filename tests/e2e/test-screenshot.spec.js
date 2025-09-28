import { test } from '@playwright/test';

test('Take screenshot after clicking service', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'admin-initial.png', fullPage: true });
    console.log('Initial screenshot saved');

    // Try to click the button
    try {
        await page.click('button:has-text("🔄 Recurring Cleaning")', { timeout: 5000 });
        console.log('Button clicked');
    } catch (e) {
        console.log('Could not click button:', e.message);
        // Try alternative selector
        await page.click('text=Recurring Cleaning', { timeout: 5000 });
    }

    await page.waitForTimeout(3000);

    // Take screenshot after click
    await page.screenshot({ path: 'admin-after-click.png', fullPage: true });
    console.log('After-click screenshot saved');

    // Check what's in wizardContent
    const wizardContent = await page.evaluate(() => {
        const wizard = document.getElementById('wizardContent');
        return {
            exists: !!wizard,
            hasContent: wizard ? wizard.innerHTML.length > 0 : false,
            contentLength: wizard ? wizard.innerHTML.length : 0,
            firstChars: wizard ? wizard.innerHTML.substring(0, 200) : null
        };
    });

    console.log('Wizard content:', wizardContent);
});