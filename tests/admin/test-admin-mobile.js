import { chromium } from 'playwright';

async function testAdminMobile() {
    const browser = await chromium.launch({ headless: false });

    try {
        // Test desktop viewport
        console.log('Testing desktop viewport...');
        const desktopContext = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const desktopPage = await desktopContext.newPage();

        await desktopPage.goto('http://localhost:3000/admin');
        await desktopPage.waitForLoadState('networkidle');

        // Check for navigation header
        const navHeader = await desktopPage.$('.navigation-header');
        if (navHeader) {
            console.log('✓ Navigation header found on desktop');
        } else {
            console.log('✗ Navigation header missing on desktop');
        }

        // Check for admin badge
        const adminBadge = await desktopPage.$('.admin-badge');
        if (adminBadge) {
            console.log('✓ Admin badge found on desktop');
        } else {
            console.log('✗ Admin badge missing on desktop');
        }

        // Check hero content
        const heroTitle = await desktopPage.$eval('.hero-service', el => el.textContent);
        console.log(`Hero title: ${heroTitle}`);

        await desktopPage.screenshot({ path: 'admin-desktop.png', fullPage: true });
        console.log('Desktop screenshot saved as admin-desktop.png');

        // Test mobile viewport (iPhone 12)
        console.log('\nTesting mobile viewport (iPhone 12)...');
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        });
        const mobilePage = await mobileContext.newPage();

        await mobilePage.goto('http://localhost:3000/admin');
        await mobilePage.waitForLoadState('networkidle');

        // Check for navigation header on mobile
        const mobileNavHeader = await mobilePage.$('.navigation-header');
        if (mobileNavHeader) {
            console.log('✓ Navigation header found on mobile');
        } else {
            console.log('✗ Navigation header missing on mobile');
        }

        // Check nav links are hidden on mobile
        const navLinksDisplay = await mobilePage.$eval('.nav-links', el => {
            return window.getComputedStyle(el).display;
        });
        if (navLinksDisplay === 'none') {
            console.log('✓ Nav links properly hidden on mobile');
        } else {
            console.log('✗ Nav links should be hidden on mobile');
        }

        // Check for admin badge on mobile
        const mobileAdminBadge = await mobilePage.$('.admin-badge');
        if (mobileAdminBadge) {
            console.log('✓ Admin badge found on mobile');
            const badgePosition = await mobilePage.$eval('.admin-badge', el => {
                const rect = el.getBoundingClientRect();
                return { top: rect.top, right: window.innerWidth - rect.right };
            });
            console.log(`  Badge position: top=${badgePosition.top}px, right=${badgePosition.right}px`);
        } else {
            console.log('✗ Admin badge missing on mobile');
        }

        // Check hero responsiveness
        const mobileHeroTitle = await mobilePage.$eval('.hero-service', el => {
            const styles = window.getComputedStyle(el);
            return {
                text: el.textContent,
                fontSize: styles.fontSize
            };
        });
        console.log(`Mobile hero: ${mobileHeroTitle.text}, font-size: ${mobileHeroTitle.fontSize}`);

        // Test customer controls layout
        const customerControls = await mobilePage.$eval('.customer-controls', el => {
            const styles = window.getComputedStyle(el);
            return styles.flexDirection;
        });
        if (customerControls === 'column') {
            console.log('✓ Customer controls properly stacked on mobile');
        } else {
            console.log('✗ Customer controls should be stacked on mobile');
        }

        await mobilePage.screenshot({ path: 'admin-mobile.png', fullPage: true });
        console.log('Mobile screenshot saved as admin-mobile.png');

        // Test small mobile (iPhone SE)
        console.log('\nTesting small mobile viewport (iPhone SE)...');
        const smallMobileContext = await browser.newContext({
            viewport: { width: 375, height: 667 }
        });
        const smallMobilePage = await smallMobileContext.newPage();

        await smallMobilePage.goto('http://localhost:3000/admin');
        await smallMobilePage.waitForLoadState('networkidle');

        await smallMobilePage.screenshot({ path: 'admin-small-mobile.png', fullPage: true });
        console.log('Small mobile screenshot saved as admin-small-mobile.png');

        // Compare with diving page
        console.log('\nComparing with diving page...');
        const divingPage = await desktopContext.newPage();
        await divingPage.goto('http://localhost:3000/diving');
        await divingPage.waitForLoadState('networkidle');

        const divingNavHeader = await divingPage.$('.navigation-header');
        if (divingNavHeader) {
            console.log('✓ Diving page has navigation header');
        }

        await divingPage.screenshot({ path: 'diving-comparison.png', fullPage: true });
        console.log('Diving page screenshot saved for comparison');

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testAdminMobile().catch(console.error);