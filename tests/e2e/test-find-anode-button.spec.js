import { test, expect } from '@playwright/test';

test.describe('Find Anode Button', () => {
    test('Find and click the Add Anodes button', async ({ page }) => {
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
            await page.waitForTimeout(500);
        }

        // Look for all buttons in the wizard
        console.log('\nLooking for all buttons in wizard...');
        const allButtons = page.locator('#wizardContent button');
        const buttonCount = await allButtons.count();
        console.log(`Found ${buttonCount} buttons total`);

        for (let i = 0; i < buttonCount; i++) {
            const button = allButtons.nth(i);
            const text = await button.textContent();
            const classes = await button.getAttribute('class');
            const onclick = await button.getAttribute('onclick');
            console.log(`Button ${i + 1}: "${text?.trim()}" | class="${classes}" | onclick="${onclick}"`);

            if (text?.toLowerCase().includes('anode') || onclick?.includes('Anode')) {
                console.log(`  ^ This looks like the anode button!`);

                // Click it
                await button.click();
                await page.waitForTimeout(2000);

                // Check if anode selector appeared
                const anodeSelector = page.locator('.anode-selector, #anodeGrid');
                if (await anodeSelector.count() > 0) {
                    console.log('✅ Anode selector opened!');

                    // Now test the counter
                    await testAnodeCounter(page);
                } else {
                    console.log('❌ Anode selector did not appear');
                }
                break;
            }
        }
    });
});

async function testAnodeCounter(page) {
    console.log('\n=== Testing Anode Counter ===');

    // Check for anode items
    const anodeItems = page.locator('.anode-item');
    const itemCount = await anodeItems.count();
    console.log(`Found ${itemCount} anode items`);

    if (itemCount > 0) {
        const firstAnode = anodeItems.first();

        // Get the anode name for reference
        const anodeName = await firstAnode.locator('.anode-name').textContent();
        console.log(`Testing with anode: ${anodeName}`);

        // Find the plus button
        const plusButton = firstAnode.locator('button:has-text("+")');
        if (await plusButton.count() > 0) {
            // Before clicking, check initial state
            console.log('\nBefore clicking plus:');

            // Check quantity display
            const quantitySpan = firstAnode.locator('.quantity, span[id^="qty-"]').first();
            if (await quantitySpan.count() > 0) {
                const initialQty = await quantitySpan.textContent();
                console.log(`  Quantity display: "${initialQty}"`);
            }

            // Check Selected Anodes counter
            const counter = page.locator('#selectedCount').first();
            if (await counter.count() > 0) {
                const initialCount = await counter.textContent();
                console.log(`  Selected Anodes counter: "${initialCount}"`);
            } else {
                console.log('  Selected Anodes counter not found!');
            }

            // Click plus button
            console.log('\nClicking plus button...');
            await plusButton.click();
            await page.waitForTimeout(1000);

            console.log('\nAfter clicking plus:');

            // Check quantity display again
            if (await quantitySpan.count() > 0) {
                const newQty = await quantitySpan.textContent();
                console.log(`  Quantity display: "${newQty}"`);
            }

            // Check Selected Anodes counter again
            if (await counter.count() > 0) {
                const newCount = await counter.textContent();
                console.log(`  Selected Anodes counter: "${newCount}"`);

                if (newCount === '1') {
                    console.log('✅ Counter updated correctly!');
                } else if (newCount === '0') {
                    console.log('❌ Counter still shows 0');
                }
            }

            // Check if it appears in the selected list
            const selectedList = page.locator('#selectedAnodesList');
            if (await selectedList.count() > 0) {
                const listText = await selectedList.textContent();
                console.log(`  Selected list: "${listText?.substring(0, 100)}"`);
            }
        }
    }
}