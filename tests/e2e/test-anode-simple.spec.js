import { test, expect } from '@playwright/test';

test('Simple anode picker test', async ({ page }) => {
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');

    // Click on Anodes Only service
    await page.click('button:has-text("🔋 Anodes Only")');

    // Wait for wizard to load
    await page.waitForTimeout(2000);

    // Check if anode section is visible (should be auto-visible for anodes_only)
    const anodeSection = await page.locator('#anodeSection');
    const isVisible = await anodeSection.isVisible();
    console.log('Anode section visible for Anodes Only service:', isVisible);

    // Check if anode grid exists
    const anodeGrid = await page.locator('#anodeGrid');
    const gridExists = await anodeGrid.count() > 0;
    console.log('Anode grid exists:', gridExists);

    // Wait for catalog to load
    await page.waitForTimeout(2000);

    // Check if any anode items are loaded
    const anodeItems = await page.locator('.anode-item');
    const itemCount = await anodeItems.count();
    console.log('Number of anode items found:', itemCount);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-anode-simple.png', fullPage: true });

    // Basic assertions
    expect(isVisible).toBe(true);
    expect(gridExists).toBe(true);

    if (itemCount === 0) {
        console.log('WARNING: No anode items found. Checking for catalog loading issues...');

        // Check console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Console error:', msg.text());
            }
        });

        // Check if catalog file exists
        const response = await page.evaluate(async () => {
            try {
                const res = await fetch('/full-boatzincs-catalog.json');
                return { ok: res.ok, status: res.status };
            } catch (e) {
                return { error: e.message };
            }
        });
        console.log('Catalog fetch response:', response);
    }
});