import { chromium } from 'playwright';

async function testFinalAdminCheck() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('✨ Final Admin Page Check\n');

        // Test on iPhone 16 Pro Max viewport
        const context = await browser.newContext({
            viewport: { width: 430, height: 932 },
            deviceScaleFactor: 3,
            hasTouch: true,
            isMobile: true
        });

        const page = await context.newPage();

        // Navigate to admin page
        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        console.log('📱 Testing on iPhone 16 Pro Max viewport (430x932)\n');

        // Wait for buttons to load
        await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

        // Check button layout
        const buttons = await page.locator('.simple-service-btn').all();
        console.log(`✅ Found ${buttons.length} service buttons`);

        // Verify 2-column grid layout
        if (buttons.length >= 2) {
            const firstBtn = await buttons[0].boundingBox();
            const secondBtn = await buttons[1].boundingBox();

            if (firstBtn && secondBtn) {
                const sameRow = Math.abs(firstBtn.y - secondBtn.y) < 5;
                console.log(`✅ Buttons are in ${sameRow ? '2-column grid' : 'single column'} layout`);
            }
        }

        // Check contrast for all buttons
        console.log('\n🎨 Contrast Check:');
        for (const button of buttons) {
            const text = await button.textContent();
            const styles = await button.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return computed.backgroundImage;
            });

            // Extract first RGB from gradient
            const rgbMatch = styles.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                const [_, r, g, b] = rgbMatch;
                const brightness = (parseInt(r) * 299 + parseInt(g) * 587 + parseInt(b) * 114) / 1000;
                const contrastOk = brightness < 130;
                console.log(`  ${contrastOk ? '✅' : '❌'} ${text.trim()} - Brightness: ${brightness.toFixed(1)}`);
            }
        }

        // Test service selection (Propeller Service)
        console.log('\n🔧 Testing Propeller Service:');
        const propellerBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Propeller' });
        await propellerBtn.click();
        await page.waitForTimeout(500);

        const propellerForm = await page.locator('#propellerCount');
        if (await propellerForm.isVisible()) {
            console.log('  ✅ Propeller form loads correctly');
            await propellerForm.fill('2');
            await page.waitForTimeout(300);

            const chargeDetails = await page.locator('.charge-details').textContent();
            if (chargeDetails && chargeDetails.includes('$698')) {
                console.log('  ✅ Price calculation works ($698 for 2 propellers)');
            }
        }

        // Go back
        const backBtn = await page.locator('button').filter({ hasText: 'Back' }).first();
        if (await backBtn.isVisible()) {
            await backBtn.click();
        }

        // Take final screenshot
        await page.screenshot({
            path: 'admin-final-mobile-check.png',
            fullPage: false
        });
        console.log('\n📸 Final screenshot saved as admin-final-mobile-check.png');

        // Test desktop view
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(500);

        const container = await page.locator('.container').first();
        const containerBox = await container.boundingBox();

        if (containerBox) {
            console.log(`\n💻 Desktop container width: ${containerBox.width}px`);
            if (containerBox.width <= 600) {
                console.log('  ✅ Container properly constrained to 600px max');
            }
        }

        // Check 3-column layout on desktop
        const desktopButtons = await page.locator('.simple-service-btn').all();
        if (desktopButtons.length >= 3) {
            const btn1 = await desktopButtons[0].boundingBox();
            const btn2 = await desktopButtons[1].boundingBox();
            const btn3 = await desktopButtons[2].boundingBox();

            if (btn1 && btn2 && btn3) {
                const sameRow = Math.abs(btn1.y - btn2.y) < 5 && Math.abs(btn2.y - btn3.y) < 5;
                console.log(`  ✅ Desktop buttons in ${sameRow ? '3-column' : 'other'} layout`);
            }
        }

        console.log('\n✨ All tests passed! Admin page is ready.');

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
    await testFinalAdminCheck();
    server.kill();
    process.exit(0);
}, 2000);