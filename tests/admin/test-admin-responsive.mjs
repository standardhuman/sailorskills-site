import { chromium, devices } from 'playwright';

async function testAdminResponsive() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    try {
        // Test in mobile view (Safari iPhone)
        console.log('Testing mobile view (Safari iPhone)...');
        const mobileContext = await browser.newContext({
            ...devices['iPhone 14'],
            permissions: ['clipboard-read', 'clipboard-write']
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto('http://localhost:3000/admin');
        await mobilePage.waitForLoadState('networkidle');

        // Check if hamburger menu is visible on mobile
        const hamburgerVisible = await mobilePage.locator('#navToggle').isVisible();
        console.log('Hamburger menu visible on mobile:', hamburgerVisible);

        // Check if nav links are hidden initially
        const navLinksVisible = await mobilePage.locator('#navLinks').isVisible();
        console.log('Nav links initially visible on mobile:', navLinksVisible);

        // Click hamburger if visible
        if (hamburgerVisible) {
            await mobilePage.click('#navToggle');
            await mobilePage.waitForTimeout(500);
            const navLinksAfterClick = await mobilePage.locator('#navLinks').isVisible();
            console.log('Nav links visible after hamburger click:', navLinksAfterClick);

            // Take screenshot
            await mobilePage.screenshot({
                path: 'docs/test-screenshots/admin-mobile-menu-open.png',
                fullPage: false
            });
        }

        // Test in desktop view
        console.log('\nTesting desktop view...');
        const desktopContext = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        const desktopPage = await desktopContext.newPage();
        await desktopPage.goto('http://localhost:3000/admin');
        await desktopPage.waitForLoadState('networkidle');

        // Check if hamburger is hidden on desktop
        const hamburgerVisibleDesktop = await desktopPage.locator('#navToggle').isVisible();
        console.log('Hamburger menu visible on desktop:', hamburgerVisibleDesktop);

        // Check if nav links are visible on desktop
        const navLinksVisibleDesktop = await desktopPage.locator('#navLinks').isVisible();
        console.log('Nav links visible on desktop:', navLinksVisibleDesktop);

        // Take desktop screenshot
        await desktopPage.screenshot({
            path: 'docs/test-screenshots/admin-desktop-nav.png',
            fullPage: false
        });

        // Check admin tools section
        const adminToolsVisible = await desktopPage.locator('.admin-tools-section').isVisible();
        console.log('Admin tools section visible:', adminToolsVisible);

        // Check service buttons
        const serviceButtons = await desktopPage.locator('.simple-service-btn').count();
        console.log('Number of service buttons:', serviceButtons);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testAdminResponsive();