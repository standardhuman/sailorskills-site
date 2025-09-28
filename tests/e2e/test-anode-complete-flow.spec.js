import { test, expect } from '@playwright/test';

test.describe('Complete Anode Selection Flow', () => {
    test('Comprehensive test of anode selection, counter, and price customization', async ({ page }) => {
        console.log('=== COMPLETE ANODE FLOW TEST ===\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('1. Selecting Recurring Cleaning service...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(2000);

        // Verify anodes are visible (default category is now "All")
        console.log('2. Checking anode visibility...');

        // Find the visible anode grid
        const anodeGrids = page.locator('#anodeGrid');
        let visibleGrid = null;
        const gridCount = await anodeGrids.count();
        console.log(`   Found ${gridCount} anode grid(s)`);

        for (let i = 0; i < gridCount; i++) {
            const grid = anodeGrids.nth(i);
            const isVisible = await grid.isVisible();
            if (isVisible) {
                visibleGrid = grid;
                console.log(`   Grid ${i + 1} is visible`);
                break;
            }
        }

        if (!visibleGrid) {
            console.log('   ❌ No visible anode grid found');
            return;
        }

        // Check anode items
        const anodeItems = page.locator('.anode-item');
        const itemCount = await anodeItems.count();
        console.log(`   Found ${itemCount} anode items`);

        // Verify "All" category is active by default
        const allCategoryBtn = page.locator('button.category-btn:has-text("All")');
        const hasActiveClass = await allCategoryBtn.evaluate(el => el.classList.contains('active'));
        console.log(`   "All" category button is active: ${hasActiveClass}`);

        if (itemCount === 0) {
            console.log('   ❌ No anode items found!');
            return;
        }

        // Test counter and quantity updates
        console.log('\n3. Testing anode selection and counter updates...');

        // Get initial counter value
        const counter = page.locator('#selectedCount').first();
        const initialCount = await counter.textContent();
        console.log(`   Initial counter value: "${initialCount}"`);

        // Test with first 3 visible anodes
        const testCount = Math.min(3, itemCount);
        let totalSelected = 0;

        for (let i = 0; i < testCount; i++) {
            const anode = anodeItems.nth(i);

            // Make sure it's visible
            const isVisible = await anode.isVisible();
            if (!isVisible) {
                await anode.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);
            }

            const anodeName = await anode.locator('.anode-name').textContent();
            console.log(`\n   Testing anode ${i + 1}: ${anodeName}`);

            // Find quantity display
            const qtySpan = anode.locator('.quantity').first();
            const initialQty = await qtySpan.textContent();
            console.log(`     Initial quantity: "${initialQty}"`);

            // Click plus button
            const plusBtn = anode.locator('button:has-text("+")').first();
            await plusBtn.click();
            await page.waitForTimeout(500);
            totalSelected++;

            // Check quantity updated
            const newQty = await qtySpan.textContent();
            console.log(`     After click quantity: "${newQty}"`);

            // Check counter updated
            const newCount = await counter.textContent();
            console.log(`     Counter shows: "${newCount}" (expected: ${totalSelected})`);

            if (newQty === '1') {
                console.log(`     ✅ Quantity display updated correctly`);
            } else {
                console.log(`     ❌ Quantity not updated (shows "${newQty}")`);
            }

            if (newCount === String(totalSelected)) {
                console.log(`     ✅ Counter updated correctly to ${totalSelected}`);
            } else {
                console.log(`     ❌ Counter not updated (shows "${newCount}" instead of ${totalSelected})`);
            }
        }

        // Check selected anodes list
        console.log('\n4. Checking selected anodes list...');
        const selectedList = page.locator('#selectedAnodesList').first();
        const listContent = await selectedList.textContent();
        if (listContent && listContent.length > 10) {
            console.log('   ✅ Selected anodes list is populated');
            console.log(`   List preview: ${listContent.substring(0, 100)}...`);
        } else {
            console.log('   ❌ Selected anodes list is empty');
        }

        // Check charge summary
        console.log('\n5. Checking charge summary...');
        const chargeSummary = page.locator('#chargeSummaryContent').first();
        const summaryContent = await chargeSummary.textContent();
        if (summaryContent.includes('Anode')) {
            console.log('   ✅ Anodes appear in charge summary');
        } else {
            console.log('   ❌ Anodes NOT in charge summary');
        }

        // Test price customization button
        console.log('\n6. Testing price customization...');
        const editBtn = page.locator('button:has-text("Edit Price")');
        const editBtnExists = await editBtn.count() > 0;

        if (editBtnExists) {
            console.log('   ✅ Edit Price button found');

            // Click edit button
            await editBtn.click();
            await page.waitForTimeout(500);

            // Check if modal opened
            const modal = page.locator('#priceCustomizationModal');
            const modalVisible = await modal.isVisible();

            if (modalVisible) {
                console.log('   ✅ Price customization modal opened');

                // Test percentage discount
                await page.fill('#percentDiscount', '10');
                await page.click('button:has-text("Apply Percent Discount")');
                await page.waitForTimeout(500);

                // Check if discount was applied
                const adjustmentText = page.locator('text=/Adjustment:/');
                if (await adjustmentText.count() > 0) {
                    console.log('   ✅ Price adjustment applied');
                } else {
                    console.log('   ❌ Price adjustment not shown');
                }
            } else {
                console.log('   ❌ Price customization modal not visible');
            }
        } else {
            console.log('   ❌ Edit Price button not found');
        }

        // Test category switching
        console.log('\n7. Testing category filtering...');

        // Click "None" category
        const noneCategoryBtn = page.locator('button.category-btn:has-text("None")');
        await noneCategoryBtn.click();
        await page.waitForTimeout(500);

        // Check if anodes are hidden
        const visibleAfterNone = await anodeItems.first().isVisible().catch(() => false);
        console.log(`   After clicking "None": anodes visible = ${visibleAfterNone}`);

        // Click "All" category again
        await allCategoryBtn.click();
        await page.waitForTimeout(500);

        // Check if anodes are visible again
        const visibleAfterAll = await anodeItems.first().isVisible().catch(() => false);
        console.log(`   After clicking "All": anodes visible = ${visibleAfterAll}`);

        // Final counter check
        console.log('\n8. Final verification...');
        const finalCount = await counter.textContent();
        console.log(`   Final counter value: "${finalCount}"`);
        console.log(`   Expected value: "${totalSelected}"`);

        if (finalCount === String(totalSelected)) {
            console.log('   ✅ COUNTER IS WORKING CORRECTLY!');
        } else {
            console.log('   ❌ COUNTER STILL NOT WORKING');
        }

        console.log('\n=== TEST COMPLETE ===');
    });
});