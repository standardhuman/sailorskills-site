import { chromium } from 'playwright';

async function testContainmentAndCentering() {
    const browser = await chromium.launch({ headless: false });

    const viewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 16 Pro Max', width: 430, height: 932 },
        { name: 'iPad Mini', width: 768, height: 1024 },
        { name: 'Desktop HD', width: 1280, height: 720 },
        { name: 'Desktop 4K', width: 1920, height: 1080 }
    ];

    try {
        console.log('🎯 Testing Containment and Centering\n');

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

            // Check for horizontal overflow
            const hasHorizontalOverflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            if (hasHorizontalOverflow) {
                console.log('  ❌ Horizontal overflow detected!');

                // Find elements causing overflow
                const overflowingElements = await page.evaluate(() => {
                    const elements = [];
                    const viewportWidth = window.innerWidth;

                    document.querySelectorAll('*').forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.right > viewportWidth || rect.left < 0) {
                            elements.push({
                                tagName: el.tagName,
                                className: el.className,
                                id: el.id,
                                rect: {
                                    left: rect.left,
                                    right: rect.right,
                                    width: rect.width
                                }
                            });
                        }
                    });

                    return elements;
                });

                if (overflowingElements.length > 0) {
                    console.log('  Overflowing elements:');
                    overflowingElements.forEach(el => {
                        console.log(`    - ${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className : ''}`);
                        console.log(`      Position: left=${el.rect.left}, right=${el.rect.right}, width=${el.rect.width}`);
                    });
                }
            } else {
                console.log('  ✅ No horizontal overflow');
            }

            // Check container centering
            const container = await page.locator('.container').first();
            const containerBox = await container.boundingBox();

            if (containerBox) {
                const viewportCenter = viewport.width / 2;
                const containerCenter = containerBox.x + (containerBox.width / 2);
                const centerOffset = Math.abs(viewportCenter - containerCenter);

                console.log(`  Container: ${containerBox.width}px wide`);

                if (centerOffset < 5) {
                    console.log(`  ✅ Container is centered (offset: ${centerOffset.toFixed(1)}px)`);
                } else {
                    console.log(`  ⚠️ Container off-center by ${centerOffset.toFixed(1)}px`);
                }
            }

            // Check service buttons don't overflow
            const buttons = await page.locator('.simple-service-btn').all();
            let buttonsOk = true;

            for (const button of buttons) {
                const btnBox = await button.boundingBox();
                if (btnBox) {
                    if (btnBox.x < 0 || btnBox.x + btnBox.width > viewport.width) {
                        buttonsOk = false;
                        const text = await button.textContent();
                        console.log(`  ❌ Button "${text.trim()}" overflows viewport`);
                    }
                }
            }

            if (buttonsOk && buttons.length > 0) {
                console.log(`  ✅ All ${buttons.length} buttons within viewport`);
            }

            // Test service modal doesn't overflow
            const propellerBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Propeller' }).first();
            if (await propellerBtn.isVisible()) {
                await propellerBtn.click();
                await page.waitForTimeout(500);

                const modal = await page.locator('.service-form-container').first();
                if (await modal.isVisible()) {
                    const modalBox = await modal.boundingBox();
                    if (modalBox) {
                        if (modalBox.x < 0 || modalBox.x + modalBox.width > viewport.width) {
                            console.log(`  ❌ Modal overflows viewport`);
                        } else {
                            console.log(`  ✅ Modal within viewport`);
                        }
                    }
                }

                // Close modal
                const backBtn = await page.locator('button').filter({ hasText: 'Back' }).first();
                if (await backBtn.isVisible()) {
                    await backBtn.click();
                    await page.waitForTimeout(300);
                }
            }

            // Take screenshot
            await page.screenshot({
                path: `containment-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
                fullPage: false
            });

            await context.close();
        }

        console.log('\n✨ Containment and centering test complete!');

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
    await testContainmentAndCentering();
    server.kill();
    process.exit(0);
}, 2000);