import { test, expect } from '@playwright/test';

test('Test anode picker functionality in detail', async ({ page }) => {
    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(1000);

    // Click on Recurring Cleaning service
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Fill in boat details
    await page.fill('#wizardBoatName', 'Test Boat');
    await page.fill('#wizardBoatLength', '35');

    // Click "Add Anodes to Service" button to show anode section
    const addAnodesBtn = await page.locator('button:has-text("Add Anodes to Service")');
    await addAnodesBtn.click();
    await page.waitForTimeout(1000);

    // Check if anode section is visible
    const anodeSection = await page.locator('#anodeSection');
    const isVisible = await anodeSection.isVisible();
    console.log('Anode section visible:', isVisible);

    // Wait for catalog to load (triggered by renderConsolidatedForm)
    await page.waitForTimeout(2000);

    // Check if any anode items are present
    const anodeItemsInitial = await page.locator('.anode-item');
    const initialCount = await anodeItemsInitial.count();
    console.log('Initial anode items count:', initialCount);

    // Test category filtering - click Shaft
    console.log('\n=== Testing Category Filtering ===');
    const shaftBtn = await page.locator('.category-btn:has-text("Shaft")');
    await shaftBtn.click();
    await page.waitForTimeout(1000);

    const shaftItems = await page.locator('.anode-item').count();
    console.log('Shaft category items:', shaftItems);

    // Test material filtering - click Zinc
    console.log('\n=== Testing Material Filtering ===');
    const zincBtn = await page.locator('.material-btn:has-text("Zinc")');
    await zincBtn.click();
    await page.waitForTimeout(1000);

    const zincItems = await page.locator('.anode-item').count();
    console.log('Zinc material items:', zincItems);

    // Test search functionality
    console.log('\n=== Testing Search ===');
    await page.fill('#anodeSearch', 'shaft');
    await page.waitForTimeout(1000);

    const searchItems = await page.locator('.anode-item').count();
    console.log('Search results for "shaft":', searchItems);

    // Clear search and go back to All
    await page.fill('#anodeSearch', '');
    await page.click('.category-btn:has-text("All")');
    await page.waitForTimeout(1000);

    // Test + button functionality
    console.log('\n=== Testing Add/Remove Buttons ===');
    const allItems = await page.locator('.anode-item').count();
    console.log('Total items available:', allItems);

    if (allItems > 0) {
        // Find first anode item with + button
        const firstAnode = await page.locator('.anode-item').first();
        const plusBtn = firstAnode.locator('button:has-text("+")');

        // Get initial selected count
        const initialSelected = await page.locator('#selectedCount').textContent();
        console.log('Initial selected count:', initialSelected);

        // Click + button
        await plusBtn.click();
        await page.waitForTimeout(500);

        // Check if selected count increased
        const afterPlusSelected = await page.locator('#selectedCount').textContent();
        console.log('After clicking +:', afterPlusSelected);

        // Check if subtotal updated
        const subtotal = await page.locator('#anodeSubtotal').textContent();
        console.log('Anode subtotal:', subtotal);

        // Test - button
        const minusBtn = firstAnode.locator('button:has-text("-")');
        await minusBtn.click();
        await page.waitForTimeout(500);

        const afterMinusSelected = await page.locator('#selectedCount').textContent();
        console.log('After clicking -:', afterMinusSelected);
    }

    // Print any console errors
    console.log('\n=== Console Logs ===');
    const errors = consoleLogs.filter(log => log.type === 'error');
    if (errors.length > 0) {
        errors.forEach(log => {
            console.log(`ERROR: ${log.text}`);
        });
    } else {
        console.log('No errors found');
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-anode-functionality.png', fullPage: true });

    // Assertions
    expect(isVisible).toBe(true);
    if (initialCount === 0) {
        console.log('\n⚠️ WARNING: No anode items loaded. Check catalog loading.');
    }
});