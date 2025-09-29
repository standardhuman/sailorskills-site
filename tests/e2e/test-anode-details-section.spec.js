import { test, expect } from '@playwright/test';

test.describe('Anode Details Section', () => {
    test('should show anode details field for Anodes Only service', async ({ page }) => {
        // Navigate to the diving page
        await page.goto('http://localhost:3000/diving');

        // Wait for the page to load and services to populate
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Give time for JavaScript to populate services

        // Select "Anodes Only" service by clicking the service card
        await page.click('div.service-option[data-service-key="anodes_only"]');

        // Wait a moment for any JavaScript to process
        await page.waitForTimeout(500);

        // Click the Next button to proceed to boat details
        await page.click('#nextBtn');

        // Fill in boat details
        await page.fill('#boat-name', 'Test Boat');
        await page.fill('#boat-location', 'Test Marina');
        await page.fill('#boat-size', '35');

        // Click Next to proceed to next step
        await page.click('#nextBtn');

        // Anode quantity section should appear - fill it in
        await page.fill('#anode-quantity', '4');

        // Click Next to proceed to checkout
        await page.click('#nextBtn');

        // Wait for checkout form to be visible
        await page.waitForSelector('#checkout-form', { state: 'visible' });

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

    test('should NOT show anode details field for other services', async ({ page }) => {
        // Navigate to the diving page
        await page.goto('http://localhost:3000/diving');

        // Wait for the page to load
        await page.waitForLoadState('domcontentloaded');

        // Select "Bottom Cleaning" service
        await page.click('label[for="bottom_cleaning"]');

        // Wait a moment for any JavaScript to process
        await page.waitForTimeout(500);

        // Click the Next button to proceed to boat details
        await page.click('#nextBtn');

        // Fill in boat details
        await page.fill('#boat-name', 'Test Boat');
        await page.fill('#boat-location', 'Test Marina');
        await page.fill('#boat-size', '35');

        // Click Next to proceed to next step
        await page.click('#nextBtn');

        // Click Next to proceed to checkout (no anode quantity for bottom cleaning)
        await page.click('#nextBtn');

        // Wait for checkout form to be visible
        await page.waitForSelector('#checkout-form', { state: 'visible' });

        // Check that anode details section is NOT visible
        const anodeDetailsSection = page.locator('#anode-details-section');
        await expect(anodeDetailsSection).toBeHidden();

        console.log('✓ Anode details section is correctly hidden for non-anode services');
    });
});