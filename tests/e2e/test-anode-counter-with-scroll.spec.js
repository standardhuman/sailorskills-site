import { test, expect } from '@playwright/test';

test.describe('Anode Counter with Scrolling', () => {
    test('Test anode counter with proper scrolling', async ({ page }) => {
        console.log('Starting anode counter test with scrolling...');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('Clicking Recurring Cleaning...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(2000);

        // Look for anode grid container
        const anodeGrid = page.locator('#anodeGrid');
        const gridExists = await anodeGrid.count() > 0;
        console.log(`Anode grid exists: ${gridExists}`);

        if (gridExists) {
            // Check grid dimensions
            const gridBox = await anodeGrid.boundingBox();
            console.log(`Grid dimensions: ${gridBox?.width}x${gridBox?.height} at (${gridBox?.x}, ${gridBox?.y})`);

            // Check if grid has overflow
            const gridStyles = await anodeGrid.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    overflow: styles.overflow,
                    overflowY: styles.overflowY,
                    maxHeight: styles.maxHeight,
                    height: styles.height
                };
            });
            console.log('Grid styles:', gridStyles);
        }

        // Find anode items
        const anodeItems = page.locator('.anode-item');
        const itemCount = await anodeItems.count();
        console.log(`Found ${itemCount} anode items`);

        if (itemCount > 0) {
            // Try to find a visible anode item
            let visibleAnodeIndex = -1;
            for (let i = 0; i < Math.min(10, itemCount); i++) {
                const item = anodeItems.nth(i);
                const isVisible = await item.isVisible();
                if (isVisible) {
                    visibleAnodeIndex = i;
                    console.log(`Anode item ${i} is visible`);
                    break;
                }
            }

            if (visibleAnodeIndex === -1) {
                console.log('No visible anode items found, trying to scroll grid...');

                // Scroll the grid to top
                if (gridExists) {
                    await anodeGrid.evaluate(el => el.scrollTop = 0);
                    await page.waitForTimeout(500);
                }

                // Check again
                for (let i = 0; i < Math.min(5, itemCount); i++) {
                    const item = anodeItems.nth(i);
                    const isVisible = await item.isVisible();
                    if (isVisible) {
                        visibleAnodeIndex = i;
                        console.log(`After scrolling, anode item ${i} is visible`);
                        break;
                    }
                }
            }

            if (visibleAnodeIndex >= 0) {
                const testAnode = anodeItems.nth(visibleAnodeIndex);
                const anodeName = await testAnode.locator('.anode-name').textContent();
                console.log(`\nTesting with anode at index ${visibleAnodeIndex}: ${anodeName}`);

                // Scroll this specific item into view
                await testAnode.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);

                // Check initial state
                console.log('\n=== INITIAL STATE ===');

                // Check quantity display
                const quantitySpan = testAnode.locator('.quantity, span[id^="qty-"]').first();
                if (await quantitySpan.count() > 0) {
                    const initialQty = await quantitySpan.textContent();
                    console.log(`Quantity display: "${initialQty}"`);
                }

                // Check counter
                const counter = page.locator('#selectedCount').first();
                if (await counter.count() > 0) {
                    const initialCount = await counter.textContent();
                    console.log(`Selected Anodes counter: "${initialCount}"`);
                }

                // Find and click plus button
                const plusButton = testAnode.locator('button:has-text("+")').first();
                const plusExists = await plusButton.count() > 0;
                console.log(`Plus button exists: ${plusExists}`);

                if (plusExists) {
                    // Check if button is visible and clickable
                    const plusVisible = await plusButton.isVisible();
                    console.log(`Plus button visible: ${plusVisible}`);

                    if (!plusVisible) {
                        console.log('Plus button not visible, scrolling item into view...');
                        await testAnode.scrollIntoViewIfNeeded();
                        await page.waitForTimeout(500);
                    }

                    // Try to click with force if needed
                    console.log('\n=== CLICKING PLUS BUTTON ===');
                    try {
                        await plusButton.click({ timeout: 5000 });
                        console.log('Plus button clicked successfully');
                    } catch (e) {
                        console.log('Normal click failed, trying with force...');
                        await plusButton.click({ force: true });
                        console.log('Plus button clicked with force');
                    }

                    await page.waitForTimeout(1500);

                    // Check state after clicking
                    console.log('\n=== AFTER CLICKING PLUS ===');

                    if (await quantitySpan.count() > 0) {
                        const newQty = await quantitySpan.textContent();
                        console.log(`Quantity display: "${newQty}"`);
                        if (newQty === '1') {
                            console.log('✅ Quantity display updated!');
                        } else {
                            console.log(`❌ Quantity still shows "${newQty}"`);
                        }
                    }

                    if (await counter.count() > 0) {
                        const newCount = await counter.textContent();
                        console.log(`Selected Anodes counter: "${newCount}"`);
                        if (newCount === '1') {
                            console.log('✅ Counter updated!');
                        } else {
                            console.log(`❌ Counter still shows "${newCount}"`);
                        }
                    }

                    // Check selected list
                    const selectedList = page.locator('#selectedAnodesList');
                    if (await selectedList.count() > 0) {
                        const listText = await selectedList.textContent();
                        console.log(`Selected list: "${listText?.substring(0, 100)}"`);
                    }

                    // Check charge summary
                    const chargeSummary = page.locator('#chargeSummaryContent');
                    if (await chargeSummary.count() > 0) {
                        const summaryText = await chargeSummary.textContent();
                        if (summaryText.includes('Anode') || summaryText.includes(anodeName)) {
                            console.log('✅ Anode appears in charge summary');
                        }
                    }
                }
            } else {
                console.log('❌ Could not find any visible anode items');
            }
        }

        console.log('\n=== TEST COMPLETE ===');
    });
});