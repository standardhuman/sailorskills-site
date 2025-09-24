import { chromium } from 'playwright';

async function testAdminMobile() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone SE size
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true
    });
    const page = await context.newPage();

    try {
        console.log('Testing admin page mobile responsiveness...');

        // Navigate to admin page
        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Take screenshot of mobile view
        await page.screenshot({
            path: 'admin-mobile-view.png',
            fullPage: true
        });
        console.log('📱 Mobile screenshot saved as admin-mobile-view.png');

        // Scroll to service buttons
        const serviceSection = await page.locator('.service-selector');
        await serviceSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Check service buttons are stacked vertically
        const buttons = await page.locator('.simple-service-btn').all();
        console.log(`Found ${buttons.length} service buttons`);

        if (buttons.length > 0) {
            const firstButton = await buttons[0].boundingBox();
            const secondButton = await buttons[1].boundingBox();

            if (firstButton && secondButton) {
                const isStacked = secondButton.y > firstButton.y + firstButton.height;
                console.log(`✓ Service buttons are ${isStacked ? 'stacked vertically' : 'NOT stacked'}`);
                console.log(`  First button: y=${firstButton.y}, height=${firstButton.height}`);
                console.log(`  Second button: y=${secondButton.y}`);
            }
        }

        // Take screenshot of service buttons area
        await page.screenshot({
            path: 'admin-mobile-service-buttons.png',
            clip: await serviceSection.boundingBox()
        });
        console.log('📸 Service buttons screenshot saved');

        // Test tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        await page.screenshot({
            path: 'admin-tablet-view.png',
            fullPage: true
        });
        console.log('📱 Tablet screenshot saved as admin-tablet-view.png');

        // Test desktop view for comparison
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(500);
        await page.screenshot({
            path: 'admin-desktop-comparison.png',
            fullPage: true
        });
        console.log('💻 Desktop screenshot saved for comparison');

        console.log('\n✅ Mobile responsiveness test completed successfully!');
        console.log('Check the screenshots to verify the mobile layout.');

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await browser.close();
    }
}

testAdminMobile();