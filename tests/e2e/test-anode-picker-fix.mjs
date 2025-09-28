import { test, expect } from '@playwright/test';

test.describe('Anode Picker Functionality Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/admin');
    });

    test('Recurring Cleaning - Anode picker should work', async ({ page }) => {
        console.log('Testing anode picker in Recurring Cleaning wizard...');

        // Select recurring cleaning service
        await page.click('button:has-text("Recurring Cleaning")');
        await page.waitForTimeout(500);

        // Fill in boat details
        await page.fill('#wizardBoatName', 'Test Boat');
        await page.fill('#wizardBoatLength', '35');

        // Click "Add Anodes to Service" button
        const addAnodesBtn = await page.locator('button:has-text("Add Anodes to Service")');
        await expect(addAnodesBtn).toBeVisible();
        await addAnodesBtn.click();

        // Verify anode section is visible
        const anodeSection = await page.locator('#anodeSection');
        await expect(anodeSection).toBeVisible();

        // Check that anode grid is populated
        await page.waitForTimeout(1000); // Wait for catalog to load
        const anodeGrid = await page.locator('#anodeGrid');
        await expect(anodeGrid).toBeVisible();

        // Verify anode items are present
        const anodeItems = await page.locator('.anode-item');
        const count = await anodeItems.count();
        console.log(`Found ${count} anode items in the grid`);
        expect(count).toBeGreaterThan(0);

        // Test category filtering
        await page.click('button:has-text("Shaft")');
        await page.waitForTimeout(500);
        const shaftAnodes = await page.locator('.anode-item').count();
        console.log(`Shaft category shows ${shaftAnodes} items`);

        // Test search functionality
        await page.fill('#anodeSearch', 'zinc');
        await page.waitForTimeout(500);
        const searchResults = await page.locator('.anode-item').count();
        console.log(`Search for "zinc" shows ${searchResults} items`);

        console.log('✅ Recurring Cleaning anode picker test passed');
    });

    test('One-time Cleaning - Anode picker should work', async ({ page }) => {
        console.log('Testing anode picker in One-time Cleaning wizard...');

        // Select one-time cleaning service
        await page.click('button:has-text("One-time Cleaning")');
        await page.waitForTimeout(500);

        // Fill in boat details
        await page.fill('#wizardBoatName', 'Test Boat 2');
        await page.fill('#wizardBoatLength', '40');

        // Click "Add Anodes to Service" button
        const addAnodesBtn = await page.locator('button:has-text("Add Anodes to Service")');
        await expect(addAnodesBtn).toBeVisible();
        await addAnodesBtn.click();

        // Verify anode section is visible
        const anodeSection = await page.locator('#anodeSection');
        await expect(anodeSection).toBeVisible();

        // Check that anode grid is populated
        await page.waitForTimeout(1000); // Wait for catalog to load
        const anodeGrid = await page.locator('#anodeGrid');
        await expect(anodeGrid).toBeVisible();

        // Select an anode
        const firstAnode = await page.locator('.anode-item').first();
        const addButton = firstAnode.locator('button:has-text("+")');
        await addButton.click();

        // Verify selected count updates
        const selectedCount = await page.locator('#selectedCount');
        await expect(selectedCount).toHaveText('1');

        console.log('✅ One-time Cleaning anode picker test passed');
    });

    test('Anodes Only - Anode picker should auto-open', async ({ page }) => {
        console.log('Testing anode picker in Anodes Only service...');

        // Select anodes only service
        await page.click('button:has-text("Anodes Only")');
        await page.waitForTimeout(500);

        // Verify anode section is automatically visible
        const anodeSection = await page.locator('#anodeSection');
        await expect(anodeSection).toBeVisible();

        // Check that anode grid is populated
        await page.waitForTimeout(1000); // Wait for catalog to load
        const anodeGrid = await page.locator('#anodeGrid');
        await expect(anodeGrid).toBeVisible();

        // Verify anode items are present
        const anodeItems = await page.locator('.anode-item');
        const count = await anodeItems.count();
        console.log(`Found ${count} anode items in Anodes Only service`);
        expect(count).toBeGreaterThan(0);

        // Test material filtering
        await page.click('button:has-text("Zinc")');
        await page.waitForTimeout(500);
        const zincAnodes = await page.locator('.anode-item').count();
        console.log(`Zinc filter shows ${zincAnodes} items`);

        console.log('✅ Anodes Only auto-open test passed');
    });

    test('Non-cleaning services should not have anode picker', async ({ page }) => {
        console.log('Testing that non-cleaning services do not have anode picker...');

        // Test Item Recovery
        await page.click('button:has-text("Item Recovery")');
        await page.waitForTimeout(500);

        const addAnodesBtn1 = await page.locator('button:has-text("Add Anodes")');
        expect(await addAnodesBtn1.count()).toBe(0);
        console.log('✅ Item Recovery correctly has no anode picker');

        // Go back and test Propeller Service
        await page.reload();
        await page.click('button:has-text("Propeller")');
        await page.waitForTimeout(500);

        const addAnodesBtn2 = await page.locator('button:has-text("Add Anodes")');
        expect(await addAnodesBtn2.count()).toBe(0);
        console.log('✅ Propeller Service correctly has no anode picker');
    });
});

console.log('Test file created. Run with: npx playwright test tests/e2e/test-anode-picker-fix.mjs');