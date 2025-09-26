import { chromium } from 'playwright';

async function testAdminNav() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newContext().then(ctx => ctx.newPage());
    
    try {
        console.log('Testing admin page navigation header...');
        await page.goto('http://localhost:3000/admin');
        await page.waitForTimeout(1000);
        
        // Check if navigation header exists
        const navHeader = await page.$('.navigation-header');
        console.log('✓ Navigation header exists:', navHeader !== null);
        
        // Check nav links visibility and text
        const navLinks = await page.$$eval('.nav-links a', links => 
            links.map(link => ({
                text: link.textContent,
                href: link.href,
                visible: window.getComputedStyle(link).display !== 'none'
            }))
        );
        console.log('✓ Nav links found:', navLinks.length);
        navLinks.forEach(link => {
            console.log(`  - ${link.text}: ${link.visible ? 'visible' : 'hidden'}`);
        });
        
        // Check if styles are applied
        const navStyles = await page.$eval('.navigation-header', el => {
            const styles = window.getComputedStyle(el);
            return {
                backgroundColor: styles.backgroundColor,
                padding: styles.padding,
                borderBottom: styles.borderBottom
            };
        });
        console.log('✓ Navigation styles:', navStyles);
        
        // Check hero section
        const heroTitle = await page.$eval('.hero-title', el => el.textContent);
        console.log('✓ Hero title:', heroTitle);
        
        // Take screenshot
        await page.screenshot({ path: 'admin-nav-test.png', fullPage: false });
        console.log('✓ Screenshot saved as admin-nav-test.png');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testAdminNav().catch(console.error);
