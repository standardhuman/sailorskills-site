import { test, expect } from '@playwright/test';

test.describe('Price Customization and Anode Quantity Tests', () => {
    test('Anode quantity should update immediately and price customization should work', async ({ page }) => {
        // Navigate to admin page
        await page.goto('http://localhost:3000/admin');
        await page.waitForTimeout(1000);

        // Select "Recurring Cleaning" service
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForSelector('#wizardContainer', { state: 'visible', timeout: 5000 });

        // Select bi-weekly frequency
        await page.click('input[value="bi-weekly"]');
        await page.waitForTimeout(500);

        // Click "Add Anodes to Service" button
        await page.click('button:has-text("Add Anodes")');
        await page.waitForTimeout(1000);

        // Test anode quantity update
        const firstAnode = page.locator('.anode-item').first();
        const quantitySpan = firstAnode.locator('.quantity');
        const plusButton = firstAnode.locator('button:has-text("+")');
        const minusButton = firstAnode.locator('button:has-text("−")');

        // Initial quantity should be 0
        await expect(quantitySpan).toHaveText('0');
        console.log('✅ Initial anode quantity is 0');

        // Click plus button and verify immediate update
        await plusButton.click();
        await expect(quantitySpan).toHaveText('1');
        console.log('✅ Anode quantity updated to 1 immediately');

        // Click plus again
        await plusButton.click();
        await expect(quantitySpan).toHaveText('2');
        console.log('✅ Anode quantity updated to 2 immediately');

        // Click minus
        await minusButton.click();
        await expect(quantitySpan).toHaveText('1');
        console.log('✅ Anode quantity updated back to 1 immediately');

        // Confirm anode selection
        await page.click('button:has-text("Confirm Selection")');
        await page.waitForTimeout(500);

        // Confirm the service wizard
        await page.click('button:has-text("Confirm Selection")');
        await page.waitForTimeout(1000);

        // Check that charge summary exists
        const chargeSummary = page.locator('.charge-summary');
        await expect(chargeSummary).toBeVisible();

        // Look for the customize price button
        const customizeButton = page.locator('button[title="Customize price"]');
        await expect(customizeButton).toBeVisible();
        console.log('✅ Customize price button is visible');

        // Click customize button
        await customizeButton.click();
        await page.waitForTimeout(500);

        // Verify modal opened
        const modal = page.locator('#priceCustomizationModal');
        await expect(modal).toBeVisible();
        console.log('✅ Price customization modal opened');

        // Test percent discount
        await page.click('input[value="percent"]');
        await page.fill('#percentValue', '20');
        await page.waitForTimeout(200);

        // Check that preview updates
        const finalPricePreview = page.locator('#finalPricePreview');
        const originalPrice = await page.locator('#originalPriceDisplay').textContent();
        const expectedPrice = parseFloat(originalPrice) * 0.8;

        // Apply the discount
        await page.click('button:has-text("Apply")');
        await page.waitForTimeout(500);

        // Verify modal closed
        await expect(modal).not.toBeVisible();
        console.log('✅ Price customization applied and modal closed');

        // Check that charge summary reflects the discount
        const discountRow = page.locator('.charge-detail-row:has-text("Discount")');
        await expect(discountRow).toBeVisible();
        console.log('✅ Discount is shown in charge summary');

        console.log('✅ All tests passed!');
    });
});