import { chromium } from 'playwright';

async function testServiceLayout() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newContext().then(ctx => ctx.newPage());
    
    try {
        console.log('Testing new service button layout...\n');
        await page.goto('http://localhost:3000/diving');
        await page.waitForTimeout(2000);
        
        // Get all service buttons
        const services = await page.$$eval('.service-option', buttons => 
            buttons.map((btn, index) => ({
                index: index + 1,
                text: btn.querySelector('.service-name')?.textContent || '',
                classes: btn.className,
                gridColumn: window.getComputedStyle(btn).gridColumn
            }))
        );
        
        console.log('Service Button Layout:');
        console.log('='.repeat(50));
        services.forEach(service => {
            const isFullWidth = service.classes.includes('full-width') || service.classes.includes('cleaning-service');
            console.log(`${service.index}. ${service.text}`);
            console.log(`   Classes: ${service.classes}`);
            console.log(`   Grid column: ${service.gridColumn}`);
            console.log(`   Full width: ${isFullWidth ? 'Yes' : 'No'}\n`);
        });
        
        // Take screenshot
        await page.screenshot({ path: 'service-layout.png', fullPage: false });
        console.log('Screenshot saved as service-layout.png');
        
    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

testServiceLayout().catch(console.error);
