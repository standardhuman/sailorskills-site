import { chromium } from 'playwright';

async function testContrastIssue() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('🔍 Testing Contrast Issue for Cleaning Services\n');

        // Navigate to admin page
        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Wait for buttons to load
        await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

        // Get all service buttons
        const buttons = await page.locator('.simple-service-btn').all();

        console.log(`Found ${buttons.length} service buttons\n`);

        // Check each button's contrast
        for (const button of buttons) {
            const text = await button.textContent();
            const buttonName = text.trim();

            // Get computed styles
            const styles = await button.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                    background: computed.background,
                    backgroundImage: computed.backgroundImage,
                    backgroundColor: computed.backgroundColor,
                    color: computed.color
                };
            });

            console.log(`Button: ${buttonName}`);
            console.log(`  Background: ${styles.backgroundImage || styles.backgroundColor}`);
            console.log(`  Text Color: ${styles.color}`);

            // Check if it's a cleaning service button
            if (buttonName.includes('Cleaning')) {
                // Extract RGB values from gradient if possible
                const gradientMatch = styles.backgroundImage.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g);

                if (gradientMatch && gradientMatch.length > 0) {
                    const firstColor = gradientMatch[0];
                    const rgbValues = firstColor.match(/\d+/g);

                    if (rgbValues) {
                        const [r, g, b] = rgbValues.map(Number);
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

                        console.log(`  First gradient color: RGB(${r}, ${g}, ${b})`);
                        console.log(`  Brightness: ${brightness.toFixed(1)} (0=dark, 255=light)`);

                        // Check contrast ratio (rough estimate)
                        // For white text on colored background, brightness should be < 130
                        if (brightness > 130) {
                            console.log(`  ⚠️ CONTRAST ISSUE: Background too light for white text!`);
                        } else {
                            console.log(`  ✅ Good contrast`);
                        }
                    }
                }
            }

            console.log('');
        }

        // Take a screenshot for visual inspection
        await page.screenshot({
            path: 'admin-contrast-check.png',
            clip: await page.locator('.service-selector').boundingBox()
        });
        console.log('📸 Screenshot saved as admin-contrast-check.png');

        // Test hover states
        console.log('\nTesting hover states:');
        for (const button of buttons.slice(0, 2)) {
            const text = await button.textContent();

            await button.hover();
            await page.waitForTimeout(300);

            const hoverStyles = await button.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                    transform: computed.transform,
                    boxShadow: computed.boxShadow
                };
            });

            console.log(`${text.trim().substring(0, 20)}... hover: ${hoverStyles.transform !== 'none' ? '✅' : '❌'}`);
        }

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
    await testContrastIssue();
    server.kill();
    process.exit(0);
}, 2000);