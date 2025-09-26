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
    
    // Check which sections are visible
    const boatSectionVisible = await page.evaluate(() => {
        const section = document.getElementById('boat-info-section');
        return section ? window.getComputedStyle(section).display !== 'none' : false;
    });
    
    const itemRecoverySectionVisible = await page.evaluate(() => {
        const section = document.getElementById('item-recovery-section');
        return section ? window.getComputedStyle(section).display !== 'none' : false;
    });
    
    console.log('\n=== FORM VISIBILITY CHECK ===');
    console.log('Boat Info Section visible:', boatSectionVisible);
    console.log('Item Recovery Section visible:', itemRecoverySectionVisible);
    
    if (itemRecoverySectionVisible) {
        console.log('\n✓ Item Recovery form is showing correctly!');
        
        // Check the form fields
        const fields = await page.evaluate(() => {
            const recoveryLocation = document.getElementById('recovery-location');
            const itemDescription = document.getElementById('item-description');
            const dropDate = document.getElementById('drop-date');
            const waterDepth = document.getElementById('water-depth');
            
            return {
                recoveryLocation: {
                    exists: !!recoveryLocation,
                    required: recoveryLocation?.required,
                    placeholder: recoveryLocation?.placeholder
                },
                itemDescription: {
                    exists: !!itemDescription,
                    required: itemDescription?.required,
                    placeholder: itemDescription?.placeholder
                },
                dropDate: {
                    exists: !!dropDate,
                    required: dropDate?.required,
                    type: dropDate?.type
                },
                waterDepth: {
                    exists: !!waterDepth,
                    required: waterDepth?.required,
                    placeholder: waterDepth?.placeholder
                }
            };
        });
        
        console.log('\n=== FIELD ANALYSIS ===');
        console.log('Recovery Location:', fields.recoveryLocation);
        console.log('Item Description:', fields.itemDescription);
        console.log('Drop Date:', fields.dropDate);
        console.log('Water Depth:', fields.waterDepth);
        
        // Take a screenshot
        await page.screenshot({ path: 'item-recovery-form.png', fullPage: false });
        console.log('\nScreenshot saved as item-recovery-form.png');
        
        // Scroll to the item recovery section
        const itemSection = await page.$('#item-recovery-section');
        if (itemSection) {
            await itemSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            // Take a focused screenshot
            const box = await itemSection.boundingBox();
            if (box) {
                await page.screenshot({
                    path: 'item-recovery-section-focused.png',
                    clip: {
                        x: box.x - 10,
                        y: box.y - 10,
                        width: box.width + 20,
                        height: box.height + 20
                    }
                });
                console.log('Focused screenshot saved as item-recovery-section-focused.png');
            }
        }
    } else {
        console.log('\n✗ Item Recovery form is NOT showing - this is a problem!');
        console.log('Boat form is showing instead:', boatSectionVisible);
    }
    
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();