import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Click on Item Recovery service
    await page.click('[data-service-key="item_recovery"]');
    console.log('Selected Item Recovery service');
    await page.waitForTimeout(1000);
    
    // Click View Estimate
    await page.click('button:has-text("View Estimate")');
    console.log('Clicked View Estimate');
    await page.waitForTimeout(1500);
    
    // Click Proceed to Checkout
    await page.click('button:has-text("Proceed to Checkout")');
    console.log('Clicked Proceed to Checkout');
    await page.waitForTimeout(1500);
    
    // Scroll to the agreement section
    const agreementSection = await page.$('.agreement-section');
    if (agreementSection) {
        await agreementSection.scrollIntoViewIfNeeded();
        console.log('Scrolled to agreement section');
        await page.waitForTimeout(500);
        
        // Take a screenshot of just the agreement section
        const boundingBox = await agreementSection.boundingBox();
        if (boundingBox) {
            await page.screenshot({
                path: 'agreement-bullets.png',
                clip: {
                    x: boundingBox.x - 10,
                    y: boundingBox.y - 10,
                    width: boundingBox.width + 20,
                    height: boundingBox.height + 20
                }
            });
            console.log('Screenshot of agreement section saved as agreement-bullets.png');
        }
        
        // Also take a full viewport screenshot showing the context
        await page.screenshot({ path: 'full-checkout-view.png' });
        console.log('Full viewport saved as full-checkout-view.png');
        
        // Analyze the bullet point styles
        const bulletAnalysis = await page.evaluate(() => {
            const section = document.querySelector('.agreement-section');
            const ul = section?.querySelector('ul');
            const lis = ul?.querySelectorAll('li');
            
            if (!ul || !lis || lis.length === 0) {
                return { error: 'Could not find list elements' };
            }
            
            // Get actual rendered position of first bullet
            const firstLi = lis[0];
            const liRect = firstLi.getBoundingClientRect();
            const ulRect = ul.getBoundingClientRect();
            
            // Get computed styles
            const ulStyles = window.getComputedStyle(ul);
            const liStyles = window.getComputedStyle(firstLi);
            
            // Try to measure the actual indentation
            const textNode = firstLi.childNodes[0];
            const range = document.createRange();
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                range.selectNodeContents(textNode);
                const textRect = range.getBoundingClientRect();
                
                return {
                    success: true,
                    measurements: {
                        ulLeftEdge: ulRect.left,
                        liLeftEdge: liRect.left,
                        textLeftEdge: textRect.left,
                        indentFromUL: textRect.left - ulRect.left,
                        indentFromLI: textRect.left - liRect.left
                    },
                    styles: {
                        ul: {
                            marginLeft: ulStyles.marginLeft,
                            paddingLeft: ulStyles.paddingLeft,
                            listStyle: ulStyles.listStyleType
                        },
                        li: {
                            paddingLeft: liStyles.paddingLeft,
                            marginBottom: liStyles.marginBottom,
                            position: liStyles.position
                        }
                    },
                    content: Array.from(lis).map(li => li.textContent.trim())
                };
            }
            
            return {
                success: false,
                error: 'Could not measure text position'
            };
        });
        
        console.log('\n=== BULLET POINT ANALYSIS ===');
        if (bulletAnalysis.success) {
            console.log('Visual measurements (pixels from left):');
            console.log(`  UL starts at: ${bulletAnalysis.measurements.ulLeftEdge}px`);
            console.log(`  LI starts at: ${bulletAnalysis.measurements.liLeftEdge}px`);
            console.log(`  Text starts at: ${bulletAnalysis.measurements.textLeftEdge}px`);
            console.log(`  Total indent from UL: ${bulletAnalysis.measurements.indentFromUL}px`);
            console.log(`  Text indent from LI: ${bulletAnalysis.measurements.indentFromLI}px`);
            console.log('\nCSS Styles:');
            console.log('  UL margin-left:', bulletAnalysis.styles.ul.marginLeft);
            console.log('  UL padding-left:', bulletAnalysis.styles.ul.paddingLeft);
            console.log('  LI padding-left:', bulletAnalysis.styles.li.paddingLeft);
            console.log('\nBullet items:');
            bulletAnalysis.content.forEach((item, i) => {
                console.log(`  ${i + 1}. ${item}`);
            });
        } else {
            console.log('Error:', bulletAnalysis.error);
        }
    } else {
        console.log('Agreement section not found!');
    }
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();