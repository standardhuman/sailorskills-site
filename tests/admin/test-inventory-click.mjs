import { chromium } from 'playwright';

async function testInventoryClick() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    try {
        const page = await browser.newPage();

        console.log('🚀 Testing Inventory Management Link...\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Find and click Inventory Management
        const inventoryLink = await page.locator('a[href="/inventory"]').first();

        if (await inventoryLink.isVisible()) {
            console.log('✅ Found Inventory Management link');

            // Get current URL
            const beforeUrl = page.url();
            console.log(`📍 Current URL: ${beforeUrl}`);

            // Click the link
            console.log('🖱️ Clicking Inventory Management...');
            await inventoryLink.click();

            // Wait for navigation or page load
            await page.waitForTimeout(2000);

            // Check new URL
            const afterUrl = page.url();
            console.log(`📍 New URL: ${afterUrl}`);

            // Check if we navigated
            if (beforeUrl !== afterUrl) {
                console.log('✅ Successfully navigated to inventory page');

                // Check what's on the page
                console.log('\n📋 Page Content Analysis:');

                // Check for common elements
                const title = await page.title();
                console.log(`  Page Title: ${title}`);

                // Check for h1/h2 headers
                const headers = await page.locator('h1, h2').all();
                console.log(`  Found ${headers.length} headers:`);
                for (const header of headers.slice(0, 5)) {
                    const text = await header.textContent();
                    console.log(`    - ${text.trim()}`);
                }

                // Check for any error messages
                const errorTexts = ['404', 'Not Found', 'Error', 'Cannot GET'];
                for (const errorText of errorTexts) {
                    const hasError = await page.locator(`text=${errorText}`).count() > 0;
                    if (hasError) {
                        console.log(`  ⚠️ Found error text: "${errorText}"`);
                    }
                }

                // Check for inventory-specific content
                const inventoryElements = [
                    { selector: 'text=/anod/i', name: 'Anode-related content' },
                    { selector: 'text=/inventory/i', name: 'Inventory text' },
                    { selector: 'table', name: 'Data table' },
                    { selector: 'form', name: 'Form elements' },
                    { selector: '.inventory', name: 'Inventory class elements' }
                ];

                console.log('\n🔍 Checking for inventory-specific content:');
                for (const element of inventoryElements) {
                    const count = await page.locator(element.selector).count();
                    if (count > 0) {
                        console.log(`  ✅ Found ${element.name}: ${count} element(s)`);
                    } else {
                        console.log(`  ❌ No ${element.name} found`);
                    }
                }

                // Take screenshot
                await page.screenshot({
                    path: 'docs/test-screenshots/inventory-page.png',
                    fullPage: true
                });
                console.log('\n📸 Screenshot saved: docs/test-screenshots/inventory-page.png');

            } else {
                console.log('❌ URL did not change - navigation may have failed');
            }

        } else {
            console.log('❌ Inventory Management link not found or not visible');
        }

        // Keep browser open for a moment to observe
        console.log('\n⏰ Keeping browser open for observation...');
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

testInventoryClick();