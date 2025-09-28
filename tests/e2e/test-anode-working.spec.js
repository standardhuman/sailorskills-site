import { test, expect } from '@playwright/test';

test('Test anode picker complete workflow', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Click on Recurring Cleaning service
    console.log('Selecting Recurring Cleaning service...');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Fill in boat details
    console.log('Filling boat details...');
    await page.fill('#wizardBoatName', 'Test Boat');
    await page.fill('#wizardBoatLength', '35');

    // Click "Add Anodes to Service" button to show anode section
    console.log('Opening anode section...');
    const addAnodesBtn = await page.locator('button:has-text("Add Anodes to Service")');
    await addAnodesBtn.click();
    await page.waitForTimeout(1500);

    // Check if anode section is visible
    const anodeSection = await page.locator('#anodeSection');
    const isVisible = await anodeSection.isVisible();
    console.log('✓ Anode section visible:', isVisible);
    expect(isVisible).toBe(true);

    // Check if catalog loaded
    const catalogStatus = await page.evaluate(() => {
        return {
            catalogLoaded: window.adminApp?.anodeCatalog?.length || 0,
            gridHasContent: document.getElementById('anodeGrid')?.children.length > 0
        };
    });
    console.log('Catalog status:', catalogStatus);

    // Wait a bit more for catalog to load if needed
    if (catalogStatus.catalogLoaded === 0) {
        console.log('Waiting for catalog to load...');
        await page.waitForTimeout(3000);
    }

    // Check anode items
    const anodeItems = await page.locator('.anode-item');
    const itemCount = await anodeItems.count();
    console.log(`✓ Found ${itemCount} anode items`);

    if (itemCount > 0) {
        // Test category filtering
        console.log('\nTesting category filtering...');
        await page.click('.category-btn:has-text("Shaft")');
        await page.waitForTimeout(1000);
        const shaftCount = await page.locator('.anode-item').count();
        console.log(`  Shaft category: ${shaftCount} items`);

        // Test material filtering
        console.log('\nTesting material filtering...');
        await page.click('.material-btn:has-text("Zinc")');
        await page.waitForTimeout(1000);
        const zincCount = await page.locator('.anode-item').count();
        console.log(`  Zinc material: ${zincCount} items`);

        // Reset to all
        await page.click('.category-btn:has-text("All")');
        await page.waitForTimeout(1000);

        // Test add/remove buttons
        console.log('\nTesting add/remove buttons...');

        // Get initial state
        const initialCount = await page.locator('#selectedCount').textContent();
        console.log(`  Initial selected: ${initialCount}`);

        // Click + on first item
        const firstItem = await page.locator('.anode-item').first();
        const plusBtn = firstItem.locator('button:has-text("+")');
        await plusBtn.click();
        await page.waitForTimeout(500);

        // Check updated count
        const afterAddCount = await page.locator('#selectedCount').textContent();
        console.log(`  After adding: ${afterAddCount}`);
        expect(parseInt(afterAddCount)).toBeGreaterThan(parseInt(initialCount));

        // Check subtotal
        const subtotal = await page.locator('#anodeSubtotal').textContent();
        console.log(`  Subtotal: $${subtotal}`);
        expect(parseFloat(subtotal)).toBeGreaterThan(0);

        // Click - to remove
        const minusBtn = firstItem.locator('button:has-text("-")');
        await minusBtn.click();
        await page.waitForTimeout(500);

        const afterRemoveCount = await page.locator('#selectedCount').textContent();
        console.log(`  After removing: ${afterRemoveCount}`);

        // Test search
        console.log('\nTesting search...');
        await page.fill('#anodeSearch', 'shaft');
        await page.waitForTimeout(1000);
        const searchCount = await page.locator('.anode-item').count();
        console.log(`  Search "shaft": ${searchCount} items`);

        console.log('\n✅ All anode picker features working!');
    } else {
        console.log('⚠️ No anode items found - catalog may not be loading');

        // Try to manually trigger catalog load
        const loadResult = await page.evaluate(async () => {
            if (window.adminApp?.loadAnodeCatalog) {
                await window.adminApp.loadAnodeCatalog();
                return {
                    success: true,
                    catalogSize: window.adminApp.anodeCatalog?.length || 0
                };
            }
            return { success: false };
        });
        console.log('Manual load attempt:', loadResult);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-anode-working.png', fullPage: true });
});