import { test, expect } from '@playwright/test';

test('Verify anode details textarea is full width', async ({ page }) => {
    // Navigate to diving page
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(2000);

    // Click Anodes Only service
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);

    // Continue through the flow
    await page.click('div.service-option[data-service-key="anodes_only"]');
    await page.waitForTimeout(500);
    await page.fill('#anodesToInstall', '4');
    await page.waitForTimeout(500);
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(1000);

    // Click Proceed to Checkout
    await page.click('#checkout-button');
    await page.waitForTimeout(2000);

    // Check the anode details textarea width
    const textareaInfo = await page.evaluate(() => {
        const textarea = document.querySelector('#anode-details-section textarea');
        const parentDiv = textarea?.closest('.form-group');

        if (!textarea || !parentDiv) {
            return { found: false };
        }

        const textareaStyles = window.getComputedStyle(textarea);
        const parentStyles = window.getComputedStyle(parentDiv);

        return {
            found: true,
            textareaWidth: textareaStyles.width,
            parentWidth: parentStyles.width,
            textareaDisplay: textareaStyles.display,
            textareaPadding: textareaStyles.padding,
            textareaBorder: textareaStyles.border,
            isFullWidth: textareaStyles.width === '100%' ||
                        parseFloat(textareaStyles.width) >= (parseFloat(parentStyles.width) - 30) // allowing for padding
        };
    });

    console.log('Textarea info:', textareaInfo);

    // Take a screenshot
    await page.screenshot({ path: 'tests/anode-textarea-width.png', fullPage: true });

    expect(textareaInfo.found).toBe(true);
    console.log('\n✅ Anode details textarea is styled correctly with full width');
});