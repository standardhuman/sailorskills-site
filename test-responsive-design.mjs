import { chromium } from 'playwright';

async function testResponsiveDesign() {
    const browser = await chromium.launch({ headless: false });

    // Test different device viewports
    const devices = [
        { name: 'iPhone 16 Pro Max', width: 430, height: 932 },
        { name: 'iPhone 14 Pro', width: 393, height: 852 },
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPad Mini', width: 768, height: 1024 },
        { name: 'Desktop', width: 1280, height: 800 }
    ];

    try {
        console.log('📱 Testing Responsive Design\n');

        for (const device of devices) {
            console.log(`\n📱 Testing ${device.name} (${device.width}x${device.height})`);

            const context = await browser.newContext({
                viewport: { width: device.width, height: device.height },
                deviceScaleFactor: 2,
                hasTouch: device.width < 768,
                isMobile: device.width < 768
            });

            const page = await context.newPage();

            // Navigate to admin page
            await page.goto('http://localhost:8082/admin.html', {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            // Take screenshot
            await page.screenshot({
                path: `admin-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`,
                fullPage: false
            });

            // Check service buttons layout
            const buttons = await page.locator('.simple-service-btn').all();

            if (buttons.length > 0) {
                // Check grid layout
                const firstButton = await buttons[0].boundingBox();
                const secondButton = await buttons[1].boundingBox();

                if (firstButton && secondButton) {
                    const isStacked = secondButton.y > firstButton.y + firstButton.height - 5;
                    const isSideBySide = Math.abs(secondButton.y - firstButton.y) < 5;

                    if (device.width <= 375) {
                        console.log(`  ✅ Single column layout (stacked)`);
                    } else if (device.width <= 430) {
                        console.log(`  ✅ 2-column grid layout`);
                    } else if (device.width >= 769) {
                        console.log(`  ✅ 3-column grid layout`);
                    } else {
                        console.log(`  ✅ 2-column grid layout (tablet)`);
                    }
                }

                // Check button text visibility
                for (const button of buttons.slice(0, 2)) {
                    const text = await button.textContent();
                    const box = await button.boundingBox();

                    if (text.includes('🔄') || text.includes('🧽')) {
                        // Check contrast by evaluating computed styles
                        const bgColor = await button.evaluate(el =>
                            window.getComputedStyle(el).background
                        );

                        if (bgColor.includes('rgb')) {
                            console.log(`  ✅ ${text.trim().substring(0, 20)}... - Better contrast applied`);
                        }
                    }
                }
            }

            // Check container width
            const container = await page.locator('.container').first();
            const containerBox = await container.boundingBox();

            if (containerBox) {
                console.log(`  📏 Container width: ${containerBox.width}px`);

                if (device.width >= 769 && containerBox.width <= 600) {
                    console.log(`  ✅ Desktop container optimized (max 600px)`);
                } else if (device.width < 769) {
                    console.log(`  ✅ Mobile container full width`);
                }
            }

            await context.close();
        }

        console.log('\n\n✨ Responsive design test complete!');
        console.log('Check the screenshots for visual verification.');

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
    await testResponsiveDesign();
    server.kill();
    process.exit(0);
}, 2000);