import { chromium } from 'playwright';

async function testScrollFix() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('🎯 Testing Improved Auto-Scroll\n');

        // Test on iPhone 16 Pro Max
        const context = await browser.newContext({
            viewport: { width: 430, height: 932 },
            deviceScaleFactor: 3,
            hasTouch: true,
            isMobile: true
        });

        const page = await context.newPage();

        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        console.log('📱 Testing on iPhone 16 Pro Max (430x932)\n');

        // Wait for service buttons to load
        await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

        // Get service buttons container position
        const buttonsContainer = await page.locator('#simpleServiceButtons, .simple-service-buttons').first();
        const buttonsBox = await buttonsContainer.boundingBox();

        console.log('Service buttons info:');
        console.log(`  Top: ${buttonsBox.y}px`);
        console.log(`  Bottom: ${buttonsBox.y + buttonsBox.height}px`);
        console.log(`  Height: ${buttonsBox.height}px`);

        // Click Recurring Cleaning to trigger scroll
        const cleaningBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Recurring Cleaning' });
        await cleaningBtn.click();

        // Wait for scroll animation to complete
        await page.waitForTimeout(1500);

        // Check scroll position
        const scrollPosition = await page.evaluate(() => window.pageYOffset);
        const viewportHeight = 932;
        const buttonsBottom = buttonsBox.y + buttonsBox.height;

        console.log('\nAfter clicking service:');
        console.log(`  Scroll position: ${scrollPosition}px`);
        console.log(`  Expected minimum scroll: ${buttonsBottom + 20}px`);

        // Check if buttons are completely off screen
        const buttonsCompletelyHidden = scrollPosition >= buttonsBottom;
        console.log(`  Service buttons completely hidden: ${buttonsCompletelyHidden ? '✅ Yes' : '❌ No'}`);

        if (!buttonsCompletelyHidden) {
            const pixelsVisible = buttonsBottom - scrollPosition;
            console.log(`  Pixels of buttons still visible: ${pixelsVisible}px`);
        }

        // Check what's visible in viewport
        const visibleElements = await page.evaluate(() => {
            const elements = [];
            const viewportHeight = window.innerHeight;
            const scrollTop = window.pageYOffset;

            // Check if service buttons are visible
            const buttons = document.querySelector('.simple-service-buttons');
            if (buttons) {
                const rect = buttons.getBoundingClientRect();
                if (rect.bottom > 0) {
                    elements.push(`Service buttons: ${rect.bottom}px visible`);
                }
            }

            // Check if wizard is visible
            const wizard = document.getElementById('wizardContainer');
            if (wizard && wizard.style.display !== 'none') {
                const rect = wizard.getBoundingClientRect();
                if (rect.top < viewportHeight) {
                    elements.push(`Wizard: top at ${rect.top}px`);
                }
            }

            return elements;
        });

        console.log('\nVisible elements:');
        visibleElements.forEach(el => console.log(`  - ${el}`));

        // Take screenshot
        await page.screenshot({
            path: 'scroll-fix-test.png',
            fullPage: false
        });

        await context.close();
        console.log('\n✨ Scroll test complete! Check scroll-fix-test.png');

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await browser.close();
    }
}

// Start server and run test
import { spawn } from 'child_process';

const server = spawn('python3', ['-m', 'http.server', '8082'], {
    detached: false,
    stdio: 'ignore'
});

setTimeout(async () => {
    await testScrollFix();
    server.kill();
    process.exit(0);
}, 2000);