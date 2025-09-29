import { test, expect } from '@playwright/test';

test.describe('Anode Details Section - Simplified', () => {
    test('should show anode details field for Anodes Only service', async ({ page }) => {
        // Capture all console messages including errors
        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                console.log('ERROR:', text);
            } else if (msg.type() === 'log') {
                if (text.includes('anode') || text.includes('selectedServiceKey') ||
                    text.includes('Checking') || text.includes('showCheckout')) {
                    console.log('Console:', text);
                }
            }
        });

        // Also capture page errors
        page.on('pageerror', err => {
            console.log('PAGE ERROR:', err.message);
        });
        // Navigate to the diving page
        await page.goto('http://localhost:3000/diving');

        // Wait for the page to load and services to populate
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Give time for JavaScript to populate services

        // Select "Anodes Only" service by clicking the service card
        const anodesService = page.locator('div.service-option[data-service-key="anodes_only"]');
        await expect(anodesService).toBeVisible();
        await anodesService.click();

        // Wait for the selection to be processed
        await page.waitForTimeout(500);

        // Click the card again to continue (as indicated by the "Click again to continue" text)
        await anodesService.click();

        // Wait for the anode quantity step to load
        await page.waitForTimeout(500);

        // Fill in anode quantity (step-7)
        const anodeQuantityInput = page.locator('#anodesToInstall');
        if (await anodeQuantityInput.isVisible()) {
            await anodeQuantityInput.fill('4');
        }

        // Click "View Estimate" button using text selector
        const viewEstimateBtn = page.locator('button:has-text("View Estimate")');
        await viewEstimateBtn.click();

        // Wait for result section to load
        await page.waitForTimeout(500);

        // Now click the "Proceed to Checkout" button
        const checkoutBtn = page.locator('button:has-text("Proceed to Checkout")');
        await expect(checkoutBtn).toBeVisible();
        console.log('About to click Proceed to Checkout button');
        await checkoutBtn.click();
        console.log('Clicked Proceed to Checkout button');

        // Wait for checkout form to load and logs to appear
        await page.waitForTimeout(2000);

        // Check that anode details section is visible
        const anodeDetailsSection = page.locator('#anode-details-section');
        await expect(anodeDetailsSection).toBeVisible();

        // Check that the anode details textarea exists and is visible
        const anodeDetailsTextarea = page.locator('#anode-details');
        await expect(anodeDetailsTextarea).toBeVisible();

        // Verify the label text
        const label = page.locator('label[for="anode-details"]');
        await expect(label).toHaveText('Anode Details (Optional)');

        // Verify we can type in the field
        await anodeDetailsTextarea.fill('I have 4 shaft anodes that need replacement');
        await expect(anodeDetailsTextarea).toHaveValue('I have 4 shaft anodes that need replacement');

        console.log('✓ Anode details section is displayed correctly for Anodes Only service');
    });
});