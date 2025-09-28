import { test, expect } from '@playwright/test';

test('Debug anode catalog loading', async ({ page }) => {
    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');

    // Click on Anodes Only service
    await page.click('button:has-text("🔋 Anodes Only")');

    // Wait for wizard to load
    await page.waitForTimeout(2000);

    // Check if adminApp exists and has loadAnodeCatalog
    const adminAppInfo = await page.evaluate(() => {
        return {
            adminAppExists: typeof window.adminApp !== 'undefined',
            hasLoadAnodeCatalog: window.adminApp && typeof window.adminApp.loadAnodeCatalog === 'function',
            anodeCatalogLength: window.adminApp && window.adminApp.anodeCatalog ? window.adminApp.anodeCatalog.length : 0,
            currentServiceKey: window.adminApp ? window.adminApp.currentServiceKey : null
        };
    });
    console.log('AdminApp info:', adminAppInfo);

    // Try to manually load catalog
    const catalogLoadResult = await page.evaluate(async () => {
        if (window.adminApp && typeof window.adminApp.loadAnodeCatalog === 'function') {
            await window.adminApp.loadAnodeCatalog();
            return {
                success: true,
                catalogLength: window.adminApp.anodeCatalog ? window.adminApp.anodeCatalog.length : 0
            };
        }
        return { success: false, error: 'adminApp or loadAnodeCatalog not available' };
    });
    console.log('Manual catalog load result:', catalogLoadResult);

    // Wait a bit for DOM updates
    await page.waitForTimeout(1000);

    // Check anode items again
    const anodeItems = await page.locator('.anode-item');
    const itemCount = await anodeItems.count();
    console.log('Anode items after manual load:', itemCount);

    // Print console logs
    console.log('\n=== Console logs ===');
    consoleLogs.forEach(log => {
        console.log(`[${log.type}] ${log.text}`);
    });

    // Take screenshot
    await page.screenshot({ path: 'test-anode-debug.png', fullPage: true });
});