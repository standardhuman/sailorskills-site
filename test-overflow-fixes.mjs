import { chromium } from 'playwright';

async function testOverflowFixes() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('🔧 Testing Overflow Fixes\n');

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

        // Wait for page to load
        await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

        // Check for horizontal overflow
        const hasHorizontalOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        console.log(`Horizontal scroll: ${hasHorizontalOverflow ? '❌ PRESENT' : '✅ None'}`);

        // Check navigation menu
        const navMenu = await page.locator('.nav-menu').first();
        if (await navMenu.isVisible()) {
            const navBox = await navMenu.boundingBox();
            if (navBox) {
                const withinBounds = navBox.x >= 0 && navBox.x + navBox.width <= 430;
                console.log(`Navigation menu: ${withinBounds ? '✅ Within bounds' : '❌ Overflows'} (x: ${navBox.x}, width: ${navBox.width})`);
            }
        }

        // Check "Select Customer" heading
        const customerHeading = await page.locator('.customer-section h2').first();
        if (await customerHeading.isVisible()) {
            const headingBox = await customerHeading.boundingBox();
            if (headingBox) {
                const withinBounds = headingBox.x >= 0 && headingBox.x + headingBox.width <= 430;
                console.log(`"Select Customer" text: ${withinBounds ? '✅ Within bounds' : '❌ Cut off'} (x: ${headingBox.x})`);
            }
        }

        // Check search box
        const searchBox = await page.locator('.customer-search-input').first();
        if (await searchBox.isVisible()) {
            const searchBoxBounds = await searchBox.boundingBox();
            if (searchBoxBounds) {
                const withinBounds = searchBoxBounds.x >= 0 && searchBoxBounds.x + searchBoxBounds.width <= 430;
                console.log(`Search box: ${withinBounds ? '✅ Within bounds' : '❌ Cut off'} (x: ${searchBoxBounds.x})`);
            }
        }

        // Check Search button
        const searchBtn = await page.locator('.customer-btn').first();
        if (await searchBtn.isVisible()) {
            const btnBox = await searchBtn.boundingBox();
            if (btnBox) {
                const withinBounds = btnBox.x >= 0 && btnBox.x + btnBox.width <= 430;
                console.log(`Search button: ${withinBounds ? '✅ Within bounds' : '❌ Cut off'} (x: ${btnBox.x})`);
            }
        }

        // Check "Select Service Type" heading
        const serviceHeading = await page.locator('.service-details-section h2').first();
        if (await serviceHeading.isVisible()) {
            const headingBox = await serviceHeading.boundingBox();
            if (headingBox) {
                const withinBounds = headingBox.x >= 0 && headingBox.x + headingBox.width <= 430;
                console.log(`"Select Service Type" text: ${withinBounds ? '✅ Within bounds' : '❌ Cut off'} (x: ${headingBox.x})`);
            }
        }

        // Check service buttons
        console.log('\nService buttons:');
        const buttons = await page.locator('.simple-service-btn').all();
        let allButtonsOk = true;

        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = await button.textContent();
            const btnBox = await button.boundingBox();

            if (btnBox) {
                const leftOk = btnBox.x >= 0;
                const rightOk = btnBox.x + btnBox.width <= 430;

                if (!leftOk || !rightOk) {
                    allButtonsOk = false;
                    console.log(`  ❌ "${text.trim()}": ${!leftOk ? 'left edge cut off' : 'right edge cut off'} (x: ${btnBox.x}, width: ${btnBox.width})`);
                }
            }
        }

        if (allButtonsOk && buttons.length > 0) {
            console.log(`  ✅ All ${buttons.length} buttons within viewport bounds`);
        }

        // Check container padding
        const container = await page.locator('.container').first();
        const containerBox = await container.boundingBox();
        if (containerBox) {
            const leftPadding = containerBox.x;
            const rightPadding = 430 - (containerBox.x + containerBox.width);
            console.log(`\nContainer padding: left=${leftPadding}px, right=${rightPadding}px`);

            if (leftPadding >= 15 && rightPadding >= 15) {
                console.log('✅ Adequate padding on both sides');
            } else {
                console.log('❌ Insufficient padding');
            }
        }

        // Take screenshot
        await page.screenshot({
            path: 'overflow-fixes-test.png',
            fullPage: false
        });
        console.log('\n📸 Screenshot saved as overflow-fixes-test.png');

        await context.close();
        console.log('\n✨ Overflow fix test complete!');

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
    await testOverflowFixes();
    server.kill();
    process.exit(0);
}, 2000);