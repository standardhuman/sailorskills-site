import { test, expect } from '@playwright/test';

test.describe('Anode Quantity Update Test', () => {
    test('Anode quantity should update immediately when clicking + or - buttons', async ({ page }) => {
        // Navigate to admin page
        await page.goto('http://localhost:3000/admin');

        // Wait for page to load and services to be available
        await page.waitForTimeout(1000);

        // Select "Recurring Cleaning" service using button
        await page.click('button:has-text("Recurring Cleaning")');

        // Wait for wizard to appear
        await page.waitForSelector('#wizardContainer', { state: 'visible', timeout: 5000 });

        // Fill required field first (bi-weekly frequency)
        const biWeeklyOption = await page.locator('label:has-text("Bi-Weekly")');
        await biWeeklyOption.click();

        // Click "Add Anodes to Service" button
        const addAnodesBtn = await page.locator('.anode-button');
        await expect(addAnodesBtn).toBeVisible({ timeout: 5000 });
        await addAnodesBtn.click();

        // Wait for anode catalog to load
        await page.waitForSelector('.anode-grid', { timeout: 5000 });
        await page.waitForTimeout(1000); // Give catalog time to fully load

        // Find the first anode item and its controls
        const firstAnodeItem = await page.locator('.anode-item').first();
        const quantitySpan = await firstAnodeItem.locator('.quantity');
        const plusButton = await firstAnodeItem.locator('button:has-text("+")');
        const minusButton = await firstAnodeItem.locator('button:has-text("−")');

        // Initial quantity should be 0
        await expect(quantitySpan).toHaveText('0');

        // Click plus button and verify quantity updates to 1
        await plusButton.click();
        await expect(quantitySpan).toHaveText('1');

        // Click plus button again and verify quantity updates to 2
        await plusButton.click();
        await expect(quantitySpan).toHaveText('2');

        // Click minus button and verify quantity updates to 1
        await minusButton.click();
        await expect(quantitySpan).toHaveText('1');

        // Click minus button again and verify quantity updates to 0
        await minusButton.click();
        await expect(quantitySpan).toHaveText('0');

        console.log('✅ Anode quantity updates correctly in the UI');
    });
});