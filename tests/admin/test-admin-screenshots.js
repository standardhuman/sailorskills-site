import { chromium } from 'playwright';

async function takeScreenshots() {
    const browser = await chromium.launch({ headless: true });

    try {
        // Desktop screenshot
        console.log('Taking desktop screenshot...');
        const desktopContext = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const desktopPage = await desktopContext.newPage();
        await desktopPage.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await desktopPage.screenshot({ path: 'admin-desktop.png', fullPage: true });
        console.log('✓ Desktop screenshot saved as admin-desktop.png');

        // Mobile screenshot
        console.log('Taking mobile screenshot...');
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await mobilePage.screenshot({ path: 'admin-mobile.png', fullPage: true });
        console.log('✓ Mobile screenshot saved as admin-mobile.png');

        // Diving page for comparison
        console.log('Taking diving page screenshot...');
        const divingPage = await desktopContext.newPage();
        await divingPage.goto('http://localhost:3000/diving', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await divingPage.screenshot({ path: 'diving-desktop.png', fullPage: true });
        console.log('✓ Diving screenshot saved as diving-desktop.png');

        console.log('\n✅ All screenshots captured successfully!');
        console.log('Check admin-desktop.png, admin-mobile.png, and diving-desktop.png');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
}

takeScreenshots().catch(console.error);