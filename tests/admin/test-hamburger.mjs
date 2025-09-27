import { chromium } from 'playwright';

async function testHamburgerMenu() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300
    });

    try {
        // Test mobile viewport (390x844 - iPhone 14 size)
        console.log('Testing mobile viewport...');
        const page = await browser.newPage();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });

        // Wait for page to render
        await page.waitForTimeout(1000);

        // Check if hamburger menu is visible
        const hamburgerVisible = await page.locator('#navToggle').isVisible();
        console.log('✓ Hamburger menu visible on mobile:', hamburgerVisible);

        if (!hamburgerVisible) {
            console.log('❌ ERROR: Hamburger menu not visible on mobile viewport!');
            // Check CSS display property
            const display = await page.locator('#navToggle').evaluate(el => {
                return window.getComputedStyle(el).display;
            });
            console.log('  Hamburger display CSS:', display);
        }

        // Check if nav links are hidden by default
        const navLinksVisible = await page.locator('#navLinks').isVisible();
        console.log('✓ Nav links hidden by default:', !navLinksVisible);

        // Test hamburger click if visible
        if (hamburgerVisible) {
            console.log('Clicking hamburger menu...');
            await page.click('#navToggle');
            await page.waitForTimeout(500);

            const navLinksAfterClick = await page.locator('#navLinks').isVisible();
            console.log('✓ Nav links visible after click:', navLinksAfterClick);
        }

        // Take screenshot
        await page.screenshot({
            path: 'docs/test-screenshots/admin-mobile-hamburger.png'
        });

        // Test desktop viewport
        console.log('\nTesting desktop viewport...');
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.waitForTimeout(500);

        const hamburgerDesktop = await page.locator('#navToggle').isVisible();
        console.log('✓ Hamburger hidden on desktop:', !hamburgerDesktop);

        const navLinksDesktop = await page.locator('#navLinks').isVisible();
        console.log('✓ Nav links visible on desktop:', navLinksDesktop);

        await page.screenshot({
            path: 'docs/test-screenshots/admin-desktop-full.png'
        });

        console.log('\n✅ Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testHamburgerMenu();