import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Click on Item Recovery service (simple flat fee)
    await page.click('[data-service-key="item_recovery"]');
    console.log('Selected Item Recovery service');
    await page.waitForTimeout(1000);
    
    // Click View Estimate
    await page.click('button:has-text("View Estimate")');
    console.log('Clicked View Estimate');
    await page.waitForTimeout(1500);
    
    // Get scroll position before checkout
    const scrollBefore = await page.evaluate(() => window.scrollY);
    console.log('Scroll position before checkout:', scrollBefore);
    
    // Click Proceed to Checkout
    await page.click('button:has-text("Proceed to Checkout")');
    console.log('Clicked Proceed to Checkout');
    
    // Wait for potential scroll animation
    await page.waitForTimeout(1500);
    
    // Get scroll position after checkout
    const scrollAfter = await page.evaluate(() => window.scrollY);
    console.log('Scroll position after checkout:', scrollAfter);
    
    // Check what's visible in viewport
    const viewportInfo = await page.evaluate(() => {
        const header = document.querySelector('.navigation-header');
        const checkoutTitle = document.querySelector('#checkout-section h2');
        const container = document.querySelector('.container');
        
        const headerRect = header ? header.getBoundingClientRect() : null;
        const checkoutRect = checkoutTitle ? checkoutTitle.getBoundingClientRect() : null;
        const containerRect = container ? container.getBoundingClientRect() : null;
        
        return {
            headerVisible: headerRect ? headerRect.bottom > 0 : false,
            headerBottom: headerRect ? headerRect.bottom : null,
            checkoutTitleTop: checkoutRect ? checkoutRect.top : null,
            checkoutTitleVisible: checkoutRect ? checkoutRect.top < window.innerHeight : false,
            containerTop: containerRect ? containerRect.top : null,
            scrollY: window.scrollY,
            windowHeight: window.innerHeight
        };
    });
    
    console.log('\n=== VIEWPORT ANALYSIS ===');
    console.log('Header visible:', viewportInfo.headerVisible);
    console.log('Header bottom position:', viewportInfo.headerBottom);
    console.log('Checkout title top position:', viewportInfo.checkoutTitleTop);
    console.log('Checkout title visible:', viewportInfo.checkoutTitleVisible);
    console.log('Container top:', viewportInfo.containerTop);
    console.log('Current scroll:', viewportInfo.scrollY);
    console.log('Window height:', viewportInfo.windowHeight);
    
    if (viewportInfo.headerVisible) {
        console.log('\n⚠️ Header is still visible - scrolling may not be working');
    } else {
        console.log('\n✓ Header is hidden - scrolling is working');
    }
    
    // Take a screenshot to see current view
    await page.screenshot({ path: 'checkout-scroll-view.png' });
    console.log('\nScreenshot saved as checkout-scroll-view.png');
    
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();