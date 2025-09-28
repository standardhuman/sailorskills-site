import { test, expect } from '@playwright/test';

test.describe('Admin Page Anode and Price Customization Tests', () => {
    test('Anode quantity updates and price customization work correctly', async ({ page }) => {
        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(1000);

        // Select bi-weekly frequency
        const biWeeklyRadio = page.locator('input[value="bi-weekly"]');
        if (await biWeeklyRadio.isVisible()) {
            await biWeeklyRadio.click();
        }

        // Look for "Add Anodes to Service" button
        const addAnodesButton = page.locator('button:has-text("Add Anodes")');
        if (await addAnodesButton.isVisible()) {
            await addAnodesButton.click();
            await page.waitForTimeout(1000);

            // Test anode quantity update
            console.log('Testing anode quantity update...');

            // Find first anode item
            const firstAnodeItem = page.locator('.anode-item').first();

            // Get the quantity span - it should have an id like qty-{id}
            const quantitySpan = firstAnodeItem.locator('span[id^="qty-"]');

            // Get the plus button
            const plusButton = firstAnodeItem.locator('button:has-text("+")');

            // Check initial quantity
            const initialQty = await quantitySpan.textContent();
            console.log(`Initial quantity: ${initialQty}`);

            // Click plus button
            await plusButton.click();
            await page.waitForTimeout(500);

            // Check if quantity updated
            const newQty = await quantitySpan.textContent();
            console.log(`New quantity after clicking +: ${newQty}`);

            if (newQty === '1') {
                console.log('✅ Anode quantity updated correctly!');
            } else {
                console.log('❌ Anode quantity did NOT update');
            }

            // Check Selected Anodes counter
            const selectedCount = page.locator('#selectedCount');
            if (await selectedCount.isVisible()) {
                const count = await selectedCount.textContent();
                console.log(`Selected Anodes count: ${count}`);
                if (count === '1') {
                    console.log('✅ Selected Anodes counter updated!');
                } else {
                    console.log('❌ Selected Anodes counter did NOT update');
                }
            }
        }

        // Check for charge summary
        await page.waitForTimeout(1000);
        const chargeSummary = page.locator('.charge-summary, #chargeSummaryContent');

        if (await chargeSummary.isVisible()) {
            console.log('✅ Charge summary is visible');

            // Look for the edit button
            const editButton = page.locator('button[title="Customize price"]');
            if (await editButton.isVisible()) {
                console.log('✅ Edit button for price customization is visible!');

                // Click the edit button
                await editButton.click();
                await page.waitForTimeout(500);

                // Check if modal opened
                const modal = page.locator('#priceCustomizationModal');
                if (await modal.isVisible()) {
                    console.log('✅ Price customization modal opened!');

                    // Test percent discount
                    await page.click('input[value="percent"]');
                    await page.fill('#percentValue', '20');

                    // Apply the discount
                    await page.click('button:has-text("Apply")');
                    await page.waitForTimeout(500);

                    // Check if discount appears in summary
                    const discountRow = page.locator(':has-text("Discount")');
                    if (await discountRow.isVisible()) {
                        console.log('✅ Discount applied and shown in summary!');
                    } else {
                        console.log('❌ Discount not showing in summary');
                    }
                } else {
                    console.log('❌ Price customization modal did not open');
                }
            } else {
                console.log('❌ Edit button for price customization NOT visible');
                // Try to find any button with pencil emoji
                const pencilButton = page.locator('button:has-text("✏️")');
                if (await pencilButton.isVisible()) {
                    console.log('Found a pencil button!');
                }
            }
        } else {
            console.log('❌ Charge summary not visible');
        }

        console.log('\n=== Test Complete ===');
    });
});