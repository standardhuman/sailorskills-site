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
    
    // Find all buttons on the page
    const buttons = await page.evaluate(() => {
        const allButtons = document.querySelectorAll('button');
        return Array.from(allButtons).map(btn => ({
            id: btn.id,
            text: btn.textContent.trim(),
            visible: window.getComputedStyle(btn).display !== 'none' && btn.offsetParent !== null,
            className: btn.className
        }));
    });
    
    console.log('\nAll buttons found:');
    buttons.forEach(btn => {
        console.log(`  - ID: "${btn.id}", Text: "${btn.text}", Visible: ${btn.visible}, Class: "${btn.className}"`);
    });
    
    // Try the "View Estimate" button by text
    try {
        await page.click('button:has-text("View Estimate")');
        console.log('\n✓ Clicked "View Estimate" button');
        await page.waitForTimeout(2000);
        
        // Check current step after clicking
        const afterClickStep = await page.evaluate(() => {
            const activeStep = document.querySelector('.form-step.active');
            return activeStep ? activeStep.id : 'no active step';
        });
        console.log('Current step after View Estimate:', afterClickStep);
        
        // Look for buttons again
        const buttonsAfter = await page.evaluate(() => {
            const allButtons = document.querySelectorAll('button');
            return Array.from(allButtons).filter(btn => {
                const style = window.getComputedStyle(btn);
                return style.display !== 'none' && btn.offsetParent !== null;
            }).map(btn => ({
                id: btn.id,
                text: btn.textContent.trim()
            }));
        });
        
        console.log('\nVisible buttons after View Estimate:');
        buttonsAfter.forEach(btn => {
            console.log(`  - "${btn.text}" (id: ${btn.id || 'none'})`);
        });
        
        // Try to find "Proceed to Checkout"
        const proceedBtn = buttonsAfter.find(btn => btn.text.includes('Proceed to Checkout'));
        if (proceedBtn) {
            await page.click(`button:has-text("Proceed to Checkout")`);
            console.log('\n✓ Clicked "Proceed to Checkout"');
            await page.waitForTimeout(2000);
            
            // Now check for agreement section
            const agreementVisible = await page.evaluate(() => {
                const section = document.querySelector('.agreement-section');
                return section && window.getComputedStyle(section).display !== 'none';
            });
            
            console.log('\nAgreement section visible:', agreementVisible);
            
            if (agreementVisible) {
                // Analyze the bullet styling
                const styles = await page.evaluate(() => {
                    const ul = document.querySelector('.agreement-section ul');
                    const li = document.querySelector('.agreement-section ul li');
                    
                    if (!ul || !li) return { error: 'Elements not found' };
                    
                    const ulStyles = window.getComputedStyle(ul);
                    const liStyles = window.getComputedStyle(li);
                    
                    return {
                        ul: {
                            margin: ulStyles.margin,
                            marginLeft: ulStyles.marginLeft,
                            paddingLeft: ulStyles.paddingLeft
                        },
                        li: {
                            paddingLeft: liStyles.paddingLeft,
                            marginBottom: liStyles.marginBottom,
                            position: liStyles.position,
                            color: liStyles.color
                        }
                    };
                });
                
                console.log('\n=== BULLET STYLING ===');
                console.log('UL:', styles.ul);
                console.log('LI:', styles.li);
                
                // Take screenshot
                await page.screenshot({ path: 'checkout-bullets.png' });
                console.log('\nScreenshot saved as checkout-bullets.png');
            }
        }
        
    } catch (e) {
        console.log('Error clicking View Estimate:', e.message);
    }
    
    console.log('\nKeeping browser open for inspection...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();