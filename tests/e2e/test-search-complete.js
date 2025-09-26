import { chromium } from 'playwright';

async function testSearchComplete() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newContext().then(ctx => ctx.newPage());
    
    try {
        console.log('Complete Customer Search Test\n');
        console.log('='.repeat(50) + '\n');
        
        await page.goto('http://localhost:3000/admin');
        await page.waitForTimeout(2000);
        
        const searchTests = [
            { term: 'Maris', desc: 'Search by boat name' },
            { term: 'Brian', desc: 'Search by first name' },
            { term: 'Brian Cline', desc: 'Search by full name' }
        ];
        
        for (const test of searchTests) {
            console.log(`\n${test.desc}: "${test.term}"`);
            console.log('-'.repeat(40));
            
            // Clear and search
            await page.fill('#customerSearch', '');
            await page.fill('#customerSearch', test.term);
            await page.click('button:has-text("Search")');
            await page.waitForTimeout(2000);
            
            // Get all customer items
            const customers = await page.$$eval('.customer-item', items => 
                items.map(item => ({
                    name: item.querySelector('.customer-name')?.textContent?.trim() || '',
                    email: item.querySelector('.customer-email')?.textContent?.trim() || '',
                    boat: item.querySelector('.customer-boat')?.textContent?.trim() || '',
                    hasCard: item.textContent.includes('Has payment method')
                }))
            );
            
            console.log(`Found ${customers.length} customer(s):\n`);
            customers.forEach((customer, i) => {
                console.log(`  ${i+1}. ${customer.name}`);
                console.log(`     Email: ${customer.email}`);
                if (customer.boat) {
                    console.log(`     Boat: ${customer.boat}`);
                }
                console.log(`     Payment method: ${customer.hasCard ? 'Yes' : 'No'}`);
                console.log('');
            });
            
            // Test selecting the first customer
            if (customers.length > 0) {
                const firstItem = await page.$('.customer-item');
                await firstItem.click();
                console.log('  ✓ Selected first customer');
                await page.waitForTimeout(1000);
                
                // Check selected customer display
                const selectedDisplay = await page.$('.selected-customer-display');
                if (selectedDisplay) {
                    const selectedText = await selectedDisplay.textContent();
                    console.log(`  Selected display: ${selectedText.trim()}`);
                }
            }
        }
        
        // Take screenshot of final state
        await page.screenshot({ path: 'search-test-complete.png', fullPage: true });
        console.log('\n✓ Screenshot saved as search-test-complete.png');
        
    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

testSearchComplete().catch(console.error);
