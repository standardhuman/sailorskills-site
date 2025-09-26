import { chromium } from 'playwright';

async function testAutoScroll() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('📜 Testing Auto-Scroll Feature\n');

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

        // Get initial scroll position
        const initialScroll = await page.evaluate(() => window.pageYOffset);
        console.log(`Initial scroll position: ${initialScroll}px`);

        // Click the Underwater Inspection button (per-foot service that shows wizard)
        const inspectionBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Underwater Inspection' });
        await inspectionBtn.click();

        // Wait for scroll animation to complete
        await page.waitForTimeout(1000);

        // Check if wizard is visible
        const wizardVisible = await page.locator('#wizardContainer').isVisible();
        console.log(`Wizard visible: ${wizardVisible ? '✅ Yes' : '❌ No'}`);

        // Get new scroll position
        const scrollAfterClick = await page.evaluate(() => window.pageYOffset);
        console.log(`Scroll position after click: ${scrollAfterClick}px`);

        // Check if we scrolled down
        if (scrollAfterClick > initialScroll) {
            console.log('✅ Page scrolled down automatically');

            // Check if wizard is in view
            const wizardInView = await page.evaluate(() => {
                const wizard = document.getElementById('wizardContainer');
                if (!wizard) return false;

                const rect = wizard.getBoundingClientRect();
                return rect.top >= 0 && rect.top < window.innerHeight;
            });

            console.log(`Wizard in viewport: ${wizardInView ? '✅ Yes' : '❌ No'}`);
        } else {
            console.log('❌ No automatic scroll detected');
        }

        // Go back to test another service
        const backBtn = await page.locator('button').filter({ hasText: 'Back' }).first();
        if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(500);
        }

        // Test with Propeller Service (different form type)
        console.log('\n🔧 Testing with Propeller Service:\n');

        const propellerBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Propeller' });
        await propellerBtn.click();

        // Wait for scroll and form to appear
        await page.waitForTimeout(1000);

        const propellerFormVisible = await page.locator('#propellerCount').isVisible();
        console.log(`Propeller form visible: ${propellerFormVisible ? '✅ Yes' : '❌ No'}`);

        // Check scroll position
        const scrollAfterPropeller = await page.evaluate(() => window.pageYOffset);
        console.log(`Scroll position: ${scrollAfterPropeller}px`);

        // Check if form is in view
        const formInView = await page.evaluate(() => {
            const form = document.querySelector('.service-form-container');
            if (!form) return false;

            const rect = form.getBoundingClientRect();
            return rect.top >= 0 && rect.top < window.innerHeight;
        });

        console.log(`Service form in viewport: ${formInView ? '✅ Yes' : '❌ No'}`);

        // Test on desktop
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(500);

        console.log('\n💻 Testing on Desktop (1280x800):\n');

        // Go back and test again
        const backBtn2 = await page.locator('button').filter({ hasText: 'Back' }).first();
        if (await backBtn2.isVisible()) {
            await backBtn2.click();
            await page.waitForTimeout(500);
        }

        // Click a service button on desktop
        const cleaningBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Recurring Cleaning' });
        await cleaningBtn.click();

        await page.waitForTimeout(1000);

        const desktopScroll = await page.evaluate(() => window.pageYOffset);
        console.log(`Desktop scroll after service selection: ${desktopScroll}px`);

        // Take screenshots
        await page.screenshot({
            path: 'auto-scroll-mobile.png',
            fullPage: false
        });

        await context.close();
        console.log('\n✨ Auto-scroll test complete!');

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
    await testAutoScroll();
    server.kill();
    process.exit(0);
}, 2000);