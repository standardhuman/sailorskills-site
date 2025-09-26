import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(1000);
    
    // Select a service to trigger the form
    await page.click('.service-option:first-child');
    await page.waitForTimeout(500);
    
    // Navigate through the form to get to the checkout section
    // Click Next through the steps
    for (let i = 0; i < 7; i++) {
        const nextButton = await page.$('#next-button');
        if (nextButton && await nextButton.isVisible()) {
            await page.click('#next-button');
            await page.waitForTimeout(300);
        }
    }
    
    // Now we should be at the checkout step
    // Take a screenshot of the agreement section
    const agreementSection = await page.$('.agreement-section');
    if (agreementSection) {
        await agreementSection.screenshot({ path: 'agreement-bullets-before.png' });
        console.log('Screenshot saved as agreement-bullets-before.png');
        
        // Get the computed styles of the bullet points
        const bulletStyles = await page.evaluate(() => {
            const bullets = document.querySelectorAll('.agreement-section ul li');
            const ul = document.querySelector('.agreement-section ul');
            
            const styles = [];
            bullets.forEach((bullet, index) => {
                const computedStyle = window.getComputedStyle(bullet);
                const beforeStyle = window.getComputedStyle(bullet, '::before');
                styles.push({
                    index: index,
                    text: bullet.textContent.trim(),
                    paddingLeft: computedStyle.paddingLeft,
                    marginBottom: computedStyle.marginBottom,
                    position: computedStyle.position,
                    listStyle: computedStyle.listStyleType
                });
            });
            
            return {
                ulStyles: {
                    margin: window.getComputedStyle(ul).margin,
                    paddingLeft: window.getComputedStyle(ul).paddingLeft,
                    listStyle: window.getComputedStyle(ul).listStyleType
                },
                liStyles: styles
            };
        });
        
        console.log('UL Styles:', bulletStyles.ulStyles);
        console.log('LI Styles:', bulletStyles.liStyles);
    } else {
        console.log('Agreement section not found');
    }
    
    // Keep browser open for inspection
    await page.waitForTimeout(5000);
    await browser.close();
})();