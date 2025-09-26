import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Select a service (One-Time Cleaning)
    await page.click('[data-service-key="onetime_cleaning"]');
    await page.waitForTimeout(500);
    
    // Fill in boat length
    const boatLengthInput = await page.$('#boatLength');
    if (boatLengthInput) {
        await boatLengthInput.fill('35');
    }
    
    // Click through all the steps quickly
    for (let i = 0; i < 8; i++) {
        try {
            const nextBtn = await page.$('#next-button:visible');
            if (nextBtn) {
                await nextBtn.click();
                await page.waitForTimeout(200);
            }
        } catch (e) {
            console.log(`Step ${i}: Next button not found or not clickable`);
        }
    }
    
    // Wait a bit more to ensure we're at checkout
    await page.waitForTimeout(1000);
    
    // Check if the agreement section exists and is visible
    const agreementExists = await page.$('.agreement-section');
    if (agreementExists) {
        const isVisible = await agreementExists.isVisible();
        console.log('Agreement section exists:', !!agreementExists);
        console.log('Agreement section visible:', isVisible);
        
        if (isVisible) {
            // Take screenshot
            await page.screenshot({ path: 'full-page.png', fullPage: true });
            console.log('Full page screenshot saved as full-page.png');
            
            // Get the computed styles
            const styles = await page.evaluate(() => {
                const section = document.querySelector('.agreement-section');
                const ul = section ? section.querySelector('ul') : null;
                const lis = ul ? ul.querySelectorAll('li') : [];
                
                if (!ul || lis.length === 0) {
                    return { error: 'No list items found' };
                }
                
                const ulStyles = window.getComputedStyle(ul);
                const firstLiStyles = window.getComputedStyle(lis[0]);
                
                return {
                    ul: {
                        margin: ulStyles.margin,
                        marginLeft: ulStyles.marginLeft,
                        paddingLeft: ulStyles.paddingLeft,
                        listStyle: ulStyles.listStyleType
                    },
                    li: {
                        paddingLeft: firstLiStyles.paddingLeft,
                        marginBottom: firstLiStyles.marginBottom,
                        position: firstLiStyles.position,
                        color: firstLiStyles.color
                    },
                    liTexts: Array.from(lis).map(li => li.textContent.trim())
                };
            });
            
            console.log('\n=== BULLET POINT STYLES ===');
            console.log('UL styles:', styles.ul);
            console.log('LI styles:', styles.li);
            console.log('List items:', styles.liTexts);
        } else {
            // Try to scroll to it
            await agreementExists.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            const visibleAfterScroll = await agreementExists.isVisible();
            console.log('Visible after scroll:', visibleAfterScroll);
        }
    } else {
        console.log('Agreement section not found!');
        
        // Check what step we're on
        const activeStep = await page.evaluate(() => {
            const active = document.querySelector('.form-step.active');
            return active ? active.id : 'unknown';
        });
        console.log('Current active step:', activeStep);
        
        // Take a screenshot to see what's on screen
        await page.screenshot({ path: 'debug-page.png', fullPage: true });
        console.log('Debug screenshot saved as debug-page.png');
    }
    
    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();