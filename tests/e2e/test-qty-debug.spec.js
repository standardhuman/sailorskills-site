import { test, expect } from '@playwright/test';

test.describe('Debug Quantity Display', () => {
    test('Debug why quantity display is not updating', async ({ page }) => {
        console.log('=== DEBUGGING QUANTITY DISPLAY ===\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin/admin.html');
        await page.waitForTimeout(2000);

        // Click on Recurring Cleaning service
        console.log('1. Selecting Recurring Cleaning service...');
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(2000);

        // Find first anode item
        const firstAnode = page.locator('.anode-item').first();
        const anodeName = await firstAnode.locator('.anode-name').textContent();
        console.log(`\nTesting with anode: ${anodeName}`);

        // Get the plus button and its data-anode attribute
        const plusButton = firstAnode.locator('button:has-text("+")');
        const dataAnode = await plusButton.getAttribute('data-anode');

        // Decode the data-anode to get the anode ID
        const anodeData = await page.evaluate((encoded) => {
            return JSON.parse(atob(encoded));
        }, dataAnode);

        console.log(`\nAnode data:`, anodeData);
        console.log(`Anode ID: ${anodeData.id}`);

        // Check for quantity elements with different selectors
        console.log('\n2. Looking for quantity display elements...\n');

        // Check by ID
        const qtyById = page.locator(`#qty-${anodeData.id}`);
        const hasByIdCount = await qtyById.count();
        console.log(`  Elements with id="qty-${anodeData.id}": ${hasByIdCount}`);

        if (hasByIdCount > 0) {
            const idText = await qtyById.textContent();
            const isVisible = await qtyById.isVisible();
            console.log(`    Text: "${idText}", Visible: ${isVisible}`);
        }

        // Check by class within the anode item
        const qtyByClass = firstAnode.locator('.quantity');
        const hasByClassCount = await qtyByClass.count();
        console.log(`  Elements with class="quantity" in this anode: ${hasByClassCount}`);

        if (hasByClassCount > 0) {
            const classText = await qtyByClass.textContent();
            const isVisible = await qtyByClass.isVisible();
            const actualId = await qtyByClass.getAttribute('id');
            console.log(`    Text: "${classText}", Visible: ${isVisible}, ID: "${actualId}"`);
        }

        // Click plus and check console logs
        console.log('\n3. Clicking plus button and monitoring changes...\n');

        // Add console listener to catch any errors
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`  Browser ${msg.type()}: ${msg.text()}`);
            }
        });

        // Click the plus button
        await plusButton.click();
        await page.waitForTimeout(1000);

        // Check quantity displays after click
        console.log('\n4. Checking quantity displays after click...\n');

        if (hasByIdCount > 0) {
            const newIdText = await qtyById.textContent();
            console.log(`  By ID text after click: "${newIdText}"`);
        }

        if (hasByClassCount > 0) {
            const newClassText = await qtyByClass.textContent();
            console.log(`  By class text after click: "${newClassText}"`);
        }

        // Check selectedAnodes in memory
        const selectedAnodes = await page.evaluate(() => {
            return window.adminApp ? window.adminApp.selectedAnodes : null;
        });
        console.log('\n5. Selected anodes in memory:', selectedAnodes);

        // Check if updateAnodeQuantity was called
        console.log('\n6. Checking if update function exists...');
        const hasUpdateFunction = await page.evaluate(() => {
            return window.adminApp && typeof window.adminApp.updateAnodeQuantity === 'function';
        });
        console.log(`  updateAnodeQuantity function exists: ${hasUpdateFunction}`);

        // Try manually updating the quantity display
        console.log('\n7. Trying manual update...');
        const manualUpdateResult = await page.evaluate((id) => {
            const el = document.getElementById(`qty-${id}`);
            if (el) {
                el.textContent = '999';
                return `Updated element with id="qty-${id}" to "999"`;
            }
            return `No element found with id="qty-${id}"`;
        }, anodeData.id);
        console.log(`  ${manualUpdateResult}`);

        // Check if it's visible now
        if (hasByIdCount > 0) {
            const afterManualText = await qtyById.textContent();
            console.log(`  Text after manual update: "${afterManualText}"`);
        }

        console.log('\n=== DEBUG COMPLETE ===');
    });
});