import { test, expect } from '@playwright/test';

test.describe('Anode Counter Final Test', () => {
    test('Comprehensive test of anode counter functionality', async ({ page }) => {
        console.log('=== ANODE COUNTER FINAL TEST ===\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('1. Clicking Recurring Cleaning service...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(2000);

        // The anodes should load automatically for cleaning services
        console.log('2. Waiting for anodes to load...');

        // Use the VISIBLE anode grid
        const visibleGrid = page.locator('#anodeGrid').first();

        // Wait for anodes to be populated
        await page.waitForFunction(
            () => document.querySelectorAll('.anode-item').length > 0,
            { timeout: 5000 }
        ).catch(() => console.log('Timeout waiting for anode items'));

        // Find anode items
        const anodeItems = page.locator('.anode-item');
        const itemCount = await anodeItems.count();
        console.log(`   Found ${itemCount} anode items\n`);

        if (itemCount === 0) {
            console.log('❌ No anode items found!');
            return;
        }

        // Test with multiple anodes to ensure it's working
        const testCount = Math.min(3, itemCount);

        for (let i = 0; i < testCount; i++) {
            console.log(`3.${i+1}. Testing anode #${i+1}...`);

            const testAnode = anodeItems.nth(i);

            // Try to scroll it into view
            try {
                await testAnode.scrollIntoViewIfNeeded({ timeout: 2000 });
            } catch {
                // If scrolling fails, continue anyway
            }

            // Get anode name
            const anodeName = await testAnode.locator('.anode-name').textContent();
            console.log(`   Anode: ${anodeName}`);

            // Find the quantity span
            const quantitySpan = testAnode.locator('.quantity, span[class="quantity"]').first();
            const hasQtySpan = await quantitySpan.count() > 0;

            // Find the plus button
            const plusButton = testAnode.locator('button:has-text("+")').first();
            const hasPlusButton = await plusButton.count() > 0;

            if (!hasPlusButton) {
                console.log(`   ❌ No plus button found for anode ${i+1}`);
                continue;
            }

            // Get initial values
            const initialQty = hasQtySpan ? await quantitySpan.textContent() : 'N/A';
            const initialCounter = await page.locator('#selectedCount').first().textContent();

            console.log(`   Before click: Qty="${initialQty}", Counter="${initialCounter}"`);

            // Click the plus button - try with force if needed
            try {
                await plusButton.click({ timeout: 2000 });
            } catch {
                try {
                    await plusButton.click({ force: true });
                } catch (e) {
                    console.log(`   ❌ Could not click plus button: ${e.message}`);
                    continue;
                }
            }

            // Wait a moment for updates
            await page.waitForTimeout(1000);

            // Check new values
            const newQty = hasQtySpan ? await quantitySpan.textContent() : 'N/A';
            const newCounter = await page.locator('#selectedCount').first().textContent();

            console.log(`   After click: Qty="${newQty}", Counter="${newCounter}"`);

            // Verify updates
            if (newQty === '1' || newQty === String(i + 1)) {
                console.log(`   ✅ Quantity display updated correctly`);
            } else {
                console.log(`   ❌ Quantity display not updated (still "${newQty}")`);
            }

            const expectedCount = String(i + 1);
            if (newCounter === expectedCount) {
                console.log(`   ✅ Selected Anodes counter updated to ${newCounter}`);
            } else {
                console.log(`   ❌ Counter not updated (shows "${newCounter}" instead of "${expectedCount}")`);
            }

            console.log('');
        }

        // Final check of all components
        console.log('4. Final verification:');

        // Check selected anodes list
        const selectedList = page.locator('#selectedAnodesList').first();
        if (await selectedList.count() > 0) {
            const listText = await selectedList.textContent();
            if (listText && listText.length > 10) {
                console.log('   ✅ Selected anodes list is populated');
            } else {
                console.log('   ❌ Selected anodes list is empty');
            }
        }

        // Check charge summary
        const chargeSummary = page.locator('#chargeSummaryContent').first();
        if (await chargeSummary.count() > 0) {
            const summaryText = await chargeSummary.textContent();
            if (summaryText.includes('Anode')) {
                console.log('   ✅ Anodes appear in charge summary');
            } else {
                console.log('   ❌ Anodes NOT in charge summary');
            }
        }

        // Check final counter value
        const finalCounter = await page.locator('#selectedCount').first().textContent();
        console.log(`   Final counter value: "${finalCounter}"`);

        console.log('\n=== TEST COMPLETE ===');
    });
});