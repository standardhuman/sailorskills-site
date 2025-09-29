import { test, expect } from '@playwright/test';

test('Test showCheckout logs', async ({ page }) => {
    // Capture ALL console messages
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
    await anodeQuantityInput.fill('4');

    // Click View Estimate
    const viewEstimateBtn = page.locator('button:has-text("View Estimate")');
    await viewEstimateBtn.click();
    await page.waitForTimeout(500);

    // Click Proceed to Checkout button
    console.log('--- About to click Proceed to Checkout ---');
    const checkoutBtn = page.locator('#checkout-button');
    await checkoutBtn.click();
    console.log('--- Clicked Proceed to Checkout ---');

    await page.waitForTimeout(2000);
});