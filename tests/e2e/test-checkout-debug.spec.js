import { test, expect } from '@playwright/test';

test('Debug checkout button', async ({ page }) => {
    // Capture all console messages
    page.on('console', msg => {
        console.log(`[${msg.type()}]`, msg.text());
    });

    // Navigate to the diving page
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(1000);

    // Select "Anodes Only" service
    const anodesService = page.locator('div.service-option[data-service-key="anodes_only"]');
    await anodesService.click();
    await page.waitForTimeout(500);

    // Click again to continue
    await anodesService.click();
    await page.waitForTimeout(500);

    // Fill in anode quantity
    const anodeQuantityInput = page.locator('#anodesToInstall');
    if (await anodeQuantityInput.isVisible()) {
        await anodeQuantityInput.fill('4');
    }

    // Click View Estimate
    const viewEstimateBtn = page.locator('button:has-text("View Estimate")');
    await viewEstimateBtn.click();
    await page.waitForTimeout(500);

    // Find all buttons with "Proceed" or "Checkout" in their text
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);

    for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        const id = await buttons[i].getAttribute('id');
        const onclick = await buttons[i].getAttribute('onclick');
        console.log(`Button ${i}: text="${text}", id="${id}", onclick="${onclick}"`);
    }

    // Try to evaluate the button's event listeners
    const buttonInfo = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed to Checkout'));
        if (btn) {
            return {
                found: true,
                id: btn.id,
                text: btn.textContent,
                hasClickListener: typeof btn.onclick === 'function',
                onclickContent: btn.onclick ? btn.onclick.toString() : null,
                className: btn.className
            };
        }
        return { found: false };
    });

    console.log('Button info:', JSON.stringify(buttonInfo));

    // Now try clicking it
    const checkoutBtn = page.locator('button:has-text("Proceed to Checkout")');
    if (await checkoutBtn.isVisible()) {
        console.log('Clicking Proceed to Checkout button...');
        await checkoutBtn.click();
        await page.waitForTimeout(2000);

        // Check if checkout section is visible
        const checkoutSection = await page.locator('#checkout-section').isVisible();
        console.log('Checkout section visible:', checkoutSection);

        // Check anode details section
        const anodeSection = await page.locator('#anode-details-section').isVisible();
        console.log('Anode details section visible:', anodeSection);
    }
});