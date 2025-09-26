import { chromium } from 'playwright';

async function testFullyResponsive() {
    const browser = await chromium.launch({ headless: false });

    const viewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 16 Pro Max', width: 430, height: 932 },
        { name: 'iPad Mini', width: 768, height: 1024 },
        { name: 'Desktop HD', width: 1280, height: 720 },
        { name: 'Desktop 4K', width: 1920, height: 1080 }
    ];

    try {
        console.log('🎨 Testing Fully Responsive Admin Page\n');

        for (const viewport of viewports) {
            console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);

            const context = await browser.newContext({
                viewport: { width: viewport.width, height: viewport.height },
                deviceScaleFactor: viewport.width < 769 ? 2 : 1,
                hasTouch: viewport.width < 769,
                isMobile: viewport.width < 769
            });

            const page = await context.newPage();

            await page.goto('http://localhost:8082/admin.html', {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });

            // Wait for page to load
            await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

            // Check header responsiveness
            const heroTitle = await page.locator('.hero-title').first();
            if (await heroTitle.isVisible()) {
                const titleSize = await heroTitle.evaluate(el =>
                    window.getComputedStyle(el).fontSize
                );
                console.log(`  Header title size: ${titleSize}`);
            }

            // Check container width
            const container = await page.locator('.container').first();
            const containerBox = await container.boundingBox();
            if (containerBox) {
                console.log(`  Container width: ${containerBox.width}px`);
            }

            // Check service button grid
            const buttons = await page.locator('.simple-service-btn').all();
            if (buttons.length >= 2) {
                const btn1 = await buttons[0].boundingBox();
                const btn2 = await buttons[1].boundingBox();

                if (btn1 && btn2) {
                    const sameRow = Math.abs(btn1.y - btn2.y) < 5;

                    let layout = 'single column';
                    if (sameRow && buttons.length >= 3) {
                        const btn3 = await buttons[2].boundingBox();
                        if (btn3 && Math.abs(btn2.y - btn3.y) < 5) {
                            layout = '3-column grid';
                        } else {
                            layout = '2-column grid';
                        }
                    } else if (sameRow) {
                        layout = '2-column grid';
                    }

                    console.log(`  Button layout: ${layout}`);
                }
            }

            // Check button font sizes
            if (buttons.length > 0) {
                const fontSize = await buttons[0].evaluate(el =>
                    window.getComputedStyle(el).fontSize
                );
                console.log(`  Button font size: ${fontSize}`);
            }

            // Check admin badge
            const badge = await page.locator('.admin-badge');
            if (await badge.isVisible()) {
                const badgeStyles = await badge.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        fontSize: styles.fontSize,
                        top: styles.top,
                        right: styles.right
                    };
                });
                console.log(`  Admin badge: ${badgeStyles.fontSize} at ${badgeStyles.top}/${badgeStyles.right}`);
            }

            // Take screenshot
            await page.screenshot({
                path: `admin-responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
                fullPage: false
            });

            // Test smooth resizing
            if (viewport.name === 'Desktop HD') {
                console.log('\n  📐 Testing smooth resizing...');

                const sizes = [1280, 1024, 768, 600, 430, 375];
                for (const width of sizes) {
                    await page.setViewportSize({ width, height: 720 });
                    await page.waitForTimeout(100);

                    const containerWidth = await page.locator('.container').evaluate(el =>
                        el.getBoundingClientRect().width
                    );
                    console.log(`    Width ${width}px → Container: ${containerWidth.toFixed(0)}px`);
                }
            }

            await context.close();
        }

        console.log('\n✨ Responsive design test complete!');

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
    await testFullyResponsive();
    server.kill();
    process.exit(0);
}, 2000);