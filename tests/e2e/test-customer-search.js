import { chromium } from 'playwright';

async function testCustomerSearch() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newContext().then(ctx => ctx.newPage());
    
    try {
        console.log('Testing customer search functionality...\n');
        await page.goto('http://localhost:3000/admin');
        await page.waitForTimeout(2000);
        
        const searchTerms = ['Maris', 'Brian', 'Brian Cline'];
        
        for (const term of searchTerms) {
            console.log(`\nSearching for: "${term}"`);
            
            // Clear and type in search box
            await page.fill('#customerSearch', '');
            await page.fill('#customerSearch', term);
            
            // Click search button
            await page.click('button:has-text("Search")');
            
            // Wait for search results
            await page.waitForTimeout(2000);
            
            // Check customer list
            const customerList = await page.$('#customerList');
            const listVisible = customerList && await customerList.isVisible();
            console.log('  Customer list visible:', listVisible);
            
            // Get customer results
            const customers = await page.$$eval('.customer-card', cards => 
                cards.map(card => {
                    const nameEl = card.querySelector('.customer-name, h3');
                    const emailEl = card.querySelector('.customer-email, .customer-info');
                    return {
                        name: nameEl?.textContent?.trim() || '',
                        info: emailEl?.textContent?.trim() || '',
                        visible: window.getComputedStyle(card).display !== 'none'
                    };
                })
            );
            
            if (customers.length > 0) {
                console.log(`  Found ${customers.length} customer(s):`);
                customers.forEach(customer => {
                    console.log(`    - ${customer.name}`);
                    if (customer.info) {
                        console.log(`      ${customer.info}`);
                    }
                });
            } else {
                // Check for no results message
                const noResults = await page.$('.no-customers');
                if (noResults) {
                    const msg = await noResults.textContent();
                    console.log(`  Message: ${msg}`);
                }
            }
            
            // Try selecting first customer if available
            if (customers.length > 0) {
                const firstCard = await page.$('.customer-card');
                if (firstCard) {
                    await firstCard.click();
                    console.log('  ✓ Clicked first result');
                    await page.waitForTimeout(1000);
                    
                    // Check if customer was selected
                    const selectedInfo = await page.$('.selected-customer-info');
                    if (selectedInfo) {
                        const text = await selectedInfo.textContent();
                        console.log('  Selected:', text.trim());
                    }
                }
            }
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'customer-search-test.png', fullPage: true });
        console.log('\n✓ Screenshot saved as customer-search-test.png');
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'customer-search-error.png' });
    } finally {
        await browser.close();
    }
}

testCustomerSearch().catch(console.error);
