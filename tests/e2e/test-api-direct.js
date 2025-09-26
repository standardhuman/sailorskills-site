// Test API directly from browser context
import { chromium } from 'playwright';

async function testAPI() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newContext().then(ctx => ctx.newPage());
    
    try {
        await page.goto('http://localhost:3000/admin');
        await page.waitForTimeout(1000);
        
        // Test API call from browser console
        const apiResult = await page.evaluate(async () => {
            try {
                const response = await fetch('http://localhost:3001/api/stripe-customers?search=Brian');
                const data = await response.json();
                return {
                    success: true,
                    customerCount: data.customers ? data.customers.length : 0,
                    firstCustomer: data.customers ? data.customers[0] : null
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });
        
        console.log('API call from browser:');
        console.log('  Success:', apiResult.success);
        if (apiResult.success) {
            console.log('  Customer count:', apiResult.customerCount);
            if (apiResult.firstCustomer) {
                console.log('  First customer:', apiResult.firstCustomer.name, '-', apiResult.firstCustomer.email);
            }
        } else {
            console.log('  Error:', apiResult.error);
        }
        
        // Now test the actual search function
        console.log('\nTesting search function:');
        await page.fill('#customerSearch', 'Brian');
        await page.click('button:has-text("Search")');
        await page.waitForTimeout(3000);
        
        // Check what's in the customer list
        const listContent = await page.$eval('#customerList', el => el.innerHTML);
        console.log('Customer list HTML:', listContent.substring(0, 200) + '...');
        
    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

testAPI().catch(console.error);
