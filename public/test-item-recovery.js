import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Click on Item Recovery service (flat fee, no boat details needed)
    await page.click('[data-service-key="item_recovery"]');
    console.log('Selected Item Recovery service');
    await page.waitForTimeout(1000);
    
    // Click "View Estimate" button to proceed
    const viewEstimateButton = await page.$('#next-button');
    if (viewEstimateButton && await viewEstimateButton.isVisible()) {
        await viewEstimateButton.click();
        console.log('Clicked View Estimate button');
        await page.waitForTimeout(1500);
    }
    
    // For flat rate services, we should now be at the checkout step
    // Try clicking Proceed to Checkout if we're at the result step
    const proceedButton = await page.$('#proceed-to-checkout');
    if (proceedButton && await proceedButton.isVisible()) {
        await proceedButton.click();
        console.log('Clicked Proceed to Checkout');
        await page.waitForTimeout(1500);
    }
    
    // Check what step we're on
    const currentStep = await page.evaluate(() => {
        const activeStep = document.querySelector('.form-step.active');
        return activeStep ? activeStep.id : null;
    });
    console.log('Current step:', currentStep);
    
    // Try to find and analyze the agreement section
    const agreementSection = await page.$('.agreement-section');
    
    if (agreementSection && await agreementSection.isVisible()) {
        console.log('✓ Agreement section found and visible');
        
        // Take a screenshot of the agreement section
        await page.screenshot({ path: 'agreement-section.png', fullPage: false });
        console.log('Screenshot saved as agreement-section.png');
        
        // Get the computed styles of the bullet points
        const styles = await page.evaluate(() => {
            const section = document.querySelector('.agreement-section');
            const ul = section ? section.querySelector('ul') : null;
            const lis = ul ? ul.querySelectorAll('li') : [];
            
            if (!ul || lis.length === 0) {
                return { error: 'No list items found in agreement section' };
            }
            
            const ulStyles = window.getComputedStyle(ul);
            const firstLi = lis[0];
            const liStyles = window.getComputedStyle(firstLi);
            
            // Try to get the pseudo-element content
            let bulletContent = 'not found';
            try {
                const before = window.getComputedStyle(firstLi, '::before');
                bulletContent = before.content;
            } catch(e) {
                bulletContent = 'error getting ::before';
            }
            
            return {
                found: true,
                itemCount: lis.length,
                ul: {
                    margin: ulStyles.margin,
                    marginLeft: ulStyles.marginLeft,
                    paddingLeft: ulStyles.paddingLeft,
                    listStyleType: ulStyles.listStyleType
                },
                li: {
                    position: liStyles.position,
                    paddingLeft: liStyles.paddingLeft,
                    marginBottom: liStyles.marginBottom,
                    color: liStyles.color,
                    lineHeight: liStyles.lineHeight
                },
                bulletChar: bulletContent,
                items: Array.from(lis).map(li => li.textContent.trim())
            };
        });
        
        console.log('\n=== BULLET POINT STYLING ANALYSIS ===');
        console.log('Found:', styles.found);
        console.log('Number of items:', styles.itemCount);
        console.log('\nUL styles:');
        console.log('  margin:', styles.ul.margin);
        console.log('  margin-left:', styles.ul.marginLeft);
        console.log('  padding-left:', styles.ul.paddingLeft);
        console.log('  list-style:', styles.ul.listStyleType);
        console.log('\nLI styles:');
        console.log('  position:', styles.li.position);
        console.log('  padding-left:', styles.li.paddingLeft);
        console.log('  margin-bottom:', styles.li.marginBottom);
        console.log('  color:', styles.li.color);
        console.log('  line-height:', styles.li.lineHeight);
        console.log('\nBullet character:', styles.bulletChar);
        console.log('\nList items:');
        styles.items.forEach((item, i) => {
            console.log(`  ${i + 1}. ${item}`);
        });
        
    } else {
        console.log('✗ Agreement section not found or not visible');
        
        // Take a debug screenshot
        await page.screenshot({ path: 'debug-state.png', fullPage: true });
        console.log('Debug screenshot saved as debug-state.png');
        
        // List all visible sections
        const visibleSections = await page.evaluate(() => {
            const sections = document.querySelectorAll('.form-step, .agreement-section, .pricing-display');
            return Array.from(sections).map(section => ({
                id: section.id || 'no-id',
                class: section.className,
                visible: window.getComputedStyle(section).display !== 'none',
                text: section.textContent.substring(0, 50)
            }));
        });
        
        console.log('\nVisible sections:');
        visibleSections.forEach(section => {
            if (section.visible) {
                console.log(`  - ${section.id || section.class}: ${section.text}...`);
            }
        });
    }
    
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();