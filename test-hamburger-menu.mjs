import { chromium } from 'playwright';

async function testHamburgerMenu() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('🍔 Testing Hamburger Menu\n');

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

        // Check if hamburger button is visible
        const hamburgerBtn = await page.locator('#navToggle');
        const isHamburgerVisible = await hamburgerBtn.isVisible();
        console.log(`Hamburger button: ${isHamburgerVisible ? '✅ Visible' : '❌ Not visible'}`);

        // Check if nav links are hidden initially
        const navLinks = await page.locator('#navLinks');
        const navLinksBox = await navLinks.boundingBox();
        if (navLinksBox) {
            const isOffscreen = navLinksBox.x >= 430;
            console.log(`Nav menu initially: ${isOffscreen ? '✅ Hidden off-screen' : '❌ Visible'}`);
        }

        // Click hamburger to open menu
        await hamburgerBtn.click();
        await page.waitForTimeout(400); // Wait for animation

        // Check if menu slides in
        const navLinksActiveBox = await navLinks.boundingBox();
        if (navLinksActiveBox) {
            const isVisible = navLinksActiveBox.x < 430 && navLinksActiveBox.x >= 0;
            console.log(`Nav menu after click: ${isVisible ? '✅ Slides in from right' : '❌ Not visible'}`);
        }

        // Check if hamburger animates to X
        const hasActiveClass = await hamburgerBtn.evaluate(el => el.classList.contains('active'));
        console.log(`Hamburger animation: ${hasActiveClass ? '✅ Transforms to X' : '❌ No animation'}`);

        // Take screenshot with menu open
        await page.screenshot({
            path: 'hamburger-menu-open.png',
            fullPage: false
        });

        // Click hamburger again to close
        await hamburgerBtn.click();
        await page.waitForTimeout(400);

        const navLinksClosedBox = await navLinks.boundingBox();
        if (navLinksClosedBox) {
            const isHidden = navLinksClosedBox.x >= 430;
            console.log(`Nav menu after close: ${isHidden ? '✅ Slides back out' : '❌ Still visible'}`);
        }

        // Test on desktop
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(500);

        console.log('\n💻 Testing on Desktop (1280x800)\n');

        // Check if hamburger is hidden on desktop
        const isHamburgerHidden = await hamburgerBtn.isHidden();
        console.log(`Hamburger button: ${isHamburgerHidden ? '✅ Hidden on desktop' : '❌ Still visible'}`);

        // Check if nav links are visible inline
        const navLinksDesktop = await page.locator('.nav-links a').all();
        if (navLinksDesktop.length > 0) {
            const firstLink = await navLinksDesktop[0].boundingBox();
            const lastLink = await navLinksDesktop[navLinksDesktop.length - 1].boundingBox();

            if (firstLink && lastLink) {
                const isInline = Math.abs(firstLink.y - lastLink.y) < 5;
                console.log(`Nav links: ${isInline ? '✅ Displayed inline' : '❌ Not inline'}`);
            }
        }

        // Take desktop screenshot
        await page.screenshot({
            path: 'hamburger-menu-desktop.png',
            fullPage: false
        });

        await context.close();
        console.log('\n✨ Hamburger menu test complete!');

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
    await testHamburgerMenu();
    server.kill();
    process.exit(0);
}, 2000);