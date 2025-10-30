import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Disable cache
    await page.route('**/*.css', route => route.continue());
    
    // Navigate with cache disabled
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    
    // Force reload CSS
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(2000);
    
    // Navigate to checkout
    await page.click('[data-service-key="item_recovery"]');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("View Estimate")');
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForTimeout(1500);
    
    // Scroll to agreement section
    const agreementSection = await page.$('.agreement-section');
    if (agreementSection) {
        await agreementSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        // Check if our CSS is actually loaded
        const cssCheck = await page.evaluate(() => {
            const ul = document.querySelector('.agreement-section ul');
            if (!ul) return { error: 'No UL found' };
            
            const styles = window.getComputedStyle(ul);
            const li = ul.querySelector('li');
            const liStyles = li ? window.getComputedStyle(li) : null;
            
            // Also check the actual CSS rules
            const sheets = Array.from(document.styleSheets);
            let foundRules = [];
            
            sheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules || []);
                    rules.forEach(rule => {
                        if (rule.selectorText && rule.selectorText.includes('.agreement-section ul')) {
                            foundRules.push({
                                selector: rule.selectorText,
                                styles: rule.style.cssText
                            });
                        }
                    });
                } catch(e) {
                    // Some sheets might be cross-origin
                }
            });
            
            return {
                computed: {
                    ul: {
                        margin: styles.margin,
                        marginLeft: styles.marginLeft,
                        paddingLeft: styles.paddingLeft,
                        listStyle: styles.listStyleType
                    },
                    li: liStyles ? {
                        paddingLeft: liStyles.paddingLeft,
                        position: liStyles.position
                    } : null
                },
                cssRules: foundRules
            };
        });
        
        console.log('CSS Check Results:');
        console.log('Computed styles:', JSON.stringify(cssCheck.computed, null, 2));
        console.log('\nCSS Rules found:');
        cssCheck.cssRules.forEach(rule => {
            console.log(`  ${rule.selector}:`);
            console.log(`    ${rule.styles}`);
        });
        
        // Take screenshot
        await agreementSection.screenshot({ path: 'agreement-after-refresh.png' });
        console.log('\nScreenshot saved as agreement-after-refresh.png');
    }
    
    console.log('\nBrowser will stay open for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
})();