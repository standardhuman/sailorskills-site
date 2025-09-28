import { test, expect } from '@playwright/test';

test.describe('Anode Counter Direct Test', () => {
    test('Test anode counter updates when clicking plus/minus', async ({ page }) => {
        console.log('Starting direct anode counter test...');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('Clicking Recurring Cleaning...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(2000); // Give wizard time to load and render

        // The anodes should be visible immediately for recurring cleaning
        console.log('Checking if anodes are already visible...');

        // Look for anode items
        const anodeItems = page.locator('.anode-item');
        await anodeItems.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
            console.log('Anode items not immediately visible');
        });

        const itemCount = await anodeItems.count();
        console.log(`Found ${itemCount} anode items`);

        if (itemCount > 0) {
            // Test with the first anode
            const firstAnode = anodeItems.first();
            const anodeName = await firstAnode.locator('.anode-name').textContent();
            console.log(`\nTesting with first anode: ${anodeName}`);

            // === CHECK INITIAL STATE ===
            console.log('\n=== INITIAL STATE ===');

            // 1. Check quantity display next to buttons
            const quantitySpan = firstAnode.locator('.quantity, span[id^="qty-"]').first();
            const hasQuantitySpan = await quantitySpan.count() > 0;
            let initialQtyDisplay = '0';
            if (hasQuantitySpan) {
                initialQtyDisplay = await quantitySpan.textContent();
                console.log(`Quantity display next to buttons: "${initialQtyDisplay}"`);
            } else {
                console.log('❌ No quantity span found next to buttons');
            }

            // 2. Check Selected Anodes counter
            const counterElement = page.locator('#selectedCount');
            const hasCounter = await counterElement.count() > 0;
            let initialCounter = '0';
            if (hasCounter) {
                initialCounter = await counterElement.textContent();
                console.log(`Selected Anodes counter: "${initialCounter}"`);

                // Also check if it's visible
                const isCounterVisible = await counterElement.isVisible();
                console.log(`Counter is visible: ${isCounterVisible}`);
            } else {
                console.log('❌ #selectedCount element not found');

                // Try to find it another way
                const altCounter = page.locator(':has-text("Selected Anodes:") >> span');
                if (await altCounter.count() > 0) {
                    const altText = await altCounter.textContent();
                    console.log(`Found counter via alt selector: "${altText}"`);
                }
            }

            // 3. Check selected list
            const selectedList = page.locator('#selectedAnodesList');
            if (await selectedList.count() > 0) {
                const listContent = await selectedList.textContent();
                console.log(`Selected list content: "${listContent?.substring(0, 50)}"`);
            }

            // === CLICK PLUS BUTTON ===
            console.log('\n=== CLICKING PLUS BUTTON ===');
            const plusButton = firstAnode.locator('button:has-text("+")');
            await plusButton.click();
            await page.waitForTimeout(1500); // Give time for updates

            // === CHECK STATE AFTER CLICKING ===
            console.log('\n=== STATE AFTER CLICKING PLUS ===');

            // 1. Check quantity display again
            if (hasQuantitySpan) {
                const newQtyDisplay = await quantitySpan.textContent();
                console.log(`Quantity display: "${newQtyDisplay}"`);
                if (newQtyDisplay === '1') {
                    console.log('✅ Quantity display updated correctly!');
                } else {
                    console.log(`❌ Quantity display shows "${newQtyDisplay}" instead of "1"`);
                }
            }

            // 2. Check Selected Anodes counter again
            if (hasCounter) {
                const newCounter = await counterElement.textContent();
                console.log(`Selected Anodes counter: "${newCounter}"`);
                if (newCounter === '1') {
                    console.log('✅ Selected Anodes counter updated correctly!');
                } else {
                    console.log(`❌ Selected Anodes counter shows "${newCounter}" instead of "1"`);
                }
            }

            // 3. Check selected list again
            if (await selectedList.count() > 0) {
                const newListContent = await selectedList.textContent();
                console.log(`Selected list: "${newListContent?.substring(0, 100)}"`);
                if (newListContent.includes('1×')) {
                    console.log('✅ Item appears in selected list');
                }
            }

            // 4. Check charge summary
            const chargeSummary = page.locator('#chargeSummaryContent');
            if (await chargeSummary.count() > 0) {
                const summaryText = await chargeSummary.textContent();
                if (summaryText.includes(anodeName) || summaryText.includes('Anode')) {
                    console.log('✅ Anode appears in charge summary');
                } else {
                    console.log('❌ Anode NOT in charge summary');
                }
            }

            // === CLICK PLUS AGAIN ===
            console.log('\n=== CLICKING PLUS AGAIN ===');
            await plusButton.click();
            await page.waitForTimeout(1000);

            if (hasQuantitySpan) {
                const qty2 = await quantitySpan.textContent();
                console.log(`Quantity display after 2nd click: "${qty2}"`);
            }

            if (hasCounter) {
                const counter2 = await counterElement.textContent();
                console.log(`Counter after 2nd click: "${counter2}"`);
            }

            // === CLICK MINUS ===
            console.log('\n=== CLICKING MINUS ===');
            const minusButton = firstAnode.locator('button:has-text("−")');
            await minusButton.click();
            await page.waitForTimeout(1000);

            if (hasQuantitySpan) {
                const qtyAfterMinus = await quantitySpan.textContent();
                console.log(`Quantity display after minus: "${qtyAfterMinus}"`);
            }

            if (hasCounter) {
                const counterAfterMinus = await counterElement.textContent();
                console.log(`Counter after minus: "${counterAfterMinus}"`);
            }

        } else {
            console.log('❌ No anode items found to test');
        }

        console.log('\n=== TEST COMPLETE ===');
    });
});