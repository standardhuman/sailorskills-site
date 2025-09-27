import { webkit } from 'playwright';

async function testSafariLinks() {
    const browser = await webkit.launch({
        headless: false,
        slowMo: 500
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('🧪 Testing Admin Links in Safari (WebKit)...\n');

        // Navigate to admin page
        console.log('📍 Navigating to admin page...');
        await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        console.log('Current URL:', page.url());

        // Check the actual href attribute
        const inventoryLink = await page.locator('a:has-text("Inventory Management")').first();
        if (await inventoryLink.isVisible()) {
            const href = await inventoryLink.getAttribute('href');
            console.log('\n📦 Inventory link href:', href);

            // Try different approaches to navigate
            console.log('\n🔧 Method 1: Direct click...');
            try {
                await inventoryLink.click();
                await page.waitForTimeout(2000);
                console.log('After click URL:', page.url());
            } catch (e) {
                console.log('Click failed:', e.message);
            }

            // If still on admin page, try JavaScript navigation
            if (page.url().includes('/admin')) {
                console.log('\n🔧 Method 2: JavaScript navigation...');
                await page.evaluate(() => {
                    window.location.href = '/inventory';
                });
                await page.waitForTimeout(2000);
                console.log('After JS navigation URL:', page.url());
            }

            // If still on admin page, try full URL
            if (page.url().includes('/admin')) {
                console.log('\n🔧 Method 3: Full URL navigation...');
                await page.goto('http://localhost:3000/inventory', { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(2000);
                console.log('After goto URL:', page.url());
            }
        }

        // Check page content
        console.log('\n📋 Page Content Check:');
        const title = await page.title();
        console.log('Page title:', title);

        // Check for any errors
        const bodyText = await page.locator('body').textContent();
        if (bodyText.includes('Cannot GET') || bodyText.includes('404')) {
            console.log('⚠️ Error on page:', bodyText.substring(0, 200));
        }

        // Take screenshot
        await page.screenshot({
            path: 'docs/test-screenshots/safari-inventory-test.png'
        });

    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

testSafariLinks();