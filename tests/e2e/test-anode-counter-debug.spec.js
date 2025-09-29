import { test, expect } from '@playwright/test';

test.describe('Debug Anode Counter Issue', () => {
    test('Thoroughly test anode selection and counter updates', async ({ page }) => {
        console.log('Starting test...');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('Clicking Recurring Cleaning...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(1000);

        // Wait for wizard to appear
        const wizardContainer = await page.locator('#wizardContainer');
        await expect(wizardContainer).toBeVisible({ timeout: 5000 });

        // Select bi-weekly frequency
        console.log('Selecting bi-weekly frequency...');
        const biWeeklyRadio = page.locator('input[value="bi-weekly"]');
        if (await biWeeklyRadio.count() > 0) {
            await biWeeklyRadio.click();
        }
        await page.waitForTimeout(500);

        // Click "Add Anodes to Service" button
        console.log('Looking for Add Anodes button...');
        const addAnodesBtn = page.locator('button.anode-button, button:has-text("Add Anodes")');
        const btnCount = await addAnodesBtn.count();
        console.log(`Found ${btnCount} anode button(s)`);

        if (btnCount > 0) {
            await addAnodesBtn.first().click();
            await page.waitForTimeout(1500); // Give catalog time to load

            // Check if anode grid is visible
            const anodeGrid = page.locator('#anodeGrid');
            const gridVisible = await anodeGrid.isVisible();
            console.log(`Anode grid visible: ${gridVisible}`);

            // Check for anode items
            const anodeItems = page.locator('.anode-item');
            const itemCount = await anodeItems.count();
            console.log(`Found ${itemCount} anode items`);

            if (itemCount > 0) {
                // Get the first anode item
                const firstAnode = anodeItems.first();

                // Check for quantity span - try multiple selectors
                const quantitySelectors = [
                    '.quantity',
                    'span.quantity',
                    'span[id^="qty-"]',
                    '.anode-controls span'
                ];

                let quantitySpan = null;
                for (const selector of quantitySelectors) {
                    const element = firstAnode.locator(selector).first();
                    if (await element.count() > 0) {
                        quantitySpan = element;
                        console.log(`Found quantity span using selector: ${selector}`);
                        break;
                    }
                }

                if (quantitySpan) {
                    const initialQty = await quantitySpan.textContent();
                    console.log(`Initial quantity display: "${initialQty}"`);

                    // Click the plus button
                    const plusButton = firstAnode.locator('button:has-text("+")');
                    if (await plusButton.count() > 0) {
                        console.log('Clicking plus button...');
                        await plusButton.click();
                        await page.waitForTimeout(1000);

                        const newQty = await quantitySpan.textContent();
                        console.log(`Quantity after clicking +: "${newQty}"`);

                        if (newQty === '1') {
                            console.log('✅ Quantity display updated correctly!');
                        } else {
                            console.log('❌ Quantity display did NOT update');
                        }
                    }
                } else {
                    console.log('❌ Could not find quantity span element');
                }

                // Now check the "Selected Anodes: X" counter
                console.log('\nChecking Selected Anodes counter...');

                // Try multiple ways to find the counter
                const counterSelectors = [
                    '#selectedCount',
                    'span#selectedCount',
                    '.selected-anodes #selectedCount',
                    ':has-text("Selected Anodes:") span'
                ];

                let counterElement = null;
                for (const selector of counterSelectors) {
                    const element = page.locator(selector).first();
                    if (await element.count() > 0) {
                        counterElement = element;
                        console.log(`Found counter using selector: ${selector}`);
                        const counterText = await counterElement.textContent();
                        console.log(`Counter value: "${counterText}"`);

                        if (counterText === '1' || counterText === '2') {
                            console.log('✅ Selected Anodes counter is working!');
                        } else if (counterText === '0') {
                            console.log('❌ Selected Anodes counter still shows 0');
                        } else {
                            console.log(`❓ Unexpected counter value: ${counterText}`);
                        }
                        break;
                    }
                }

                if (!counterElement) {
                    console.log('❌ Could not find Selected Anodes counter element');

                    // Let's check what elements ARE there
                    const selectedAnodesSection = page.locator('.selected-anodes');
                    if (await selectedAnodesSection.count() > 0) {
                        const html = await selectedAnodesSection.innerHTML();
                        console.log('Selected anodes section HTML:', html.substring(0, 200));
                    }
                }

                // Check the charge summary
                console.log('\nChecking charge summary...');
                const chargeSummary = page.locator('#chargeSummaryContent, .charge-summary');
                if (await chargeSummary.count() > 0) {
                    const summaryText = await chargeSummary.textContent();
                    if (summaryText.includes('Anode')) {
                        console.log('✅ Anodes appear in charge summary');
                    } else {
                        console.log('❌ Anodes NOT in charge summary');
                    }
                }

            } else {
                console.log('❌ No anode items found in grid');
            }
        } else {
            console.log('❌ Add Anodes button not found');
        }

        console.log('\n=== Test Complete ===');
    });
});