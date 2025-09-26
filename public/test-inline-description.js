import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing inline description display...\n');
    
    // Test clicking on Item Recovery service
    const itemRecoveryButton = await page.$('[data-service-key="item_recovery"]');
    
    // Get initial height
    const initialBox = await itemRecoveryButton.boundingBox();
    console.log('Initial button height:', initialBox.height);
    
    // Click the button
    await itemRecoveryButton.click();
    console.log('Clicked Item Recovery button');
    await page.waitForTimeout(1000);
    
    // Check if button expanded and has description
    const expandedState = await page.evaluate(() => {
        const button = document.querySelector('[data-service-key="item_recovery"]');
        const description = button ? button.querySelector('.service-description-inline') : null;
        const box = button ? button.getBoundingClientRect() : null;
        
        return {
            hasExpandedClass: button ? button.classList.contains('expanded') : false,
            hasSelectedClass: button ? button.classList.contains('selected') : false,
            hasDescription: !!description,
            descriptionText: description ? description.textContent : null,
            expandedHeight: box ? box.height : null
        };
    });
    
    console.log('\n=== ITEM RECOVERY BUTTON STATE ===');
    console.log('Has expanded class:', expandedState.hasExpandedClass);
    console.log('Has selected class:', expandedState.hasSelectedClass);
    console.log('Has description element:', expandedState.hasDescription);
    console.log('Expanded height:', expandedState.expandedHeight);
    console.log('Height increased by:', expandedState.expandedHeight - initialBox.height, 'px');
    
    if (expandedState.descriptionText) {
        console.log('\nDescription text:');
        console.log('"' + expandedState.descriptionText + '"');
    }
    
    // Take screenshot of expanded button
    await itemRecoveryButton.screenshot({ path: 'expanded-button.png' });
    console.log('\nScreenshot saved as expanded-button.png');
    
    // Test clicking another button to see if first one collapses
    console.log('\n=== TESTING BUTTON SWITCHING ===');
    await page.click('[data-service-key="underwater_inspection"]');
    console.log('Clicked Underwater Inspection button');
    await page.waitForTimeout(1000);
    
    // Check states of both buttons
    const switchState = await page.evaluate(() => {
        const itemButton = document.querySelector('[data-service-key="item_recovery"]');
        const inspectionButton = document.querySelector('[data-service-key="underwater_inspection"]');
        
        return {
            itemRecovery: {
                hasExpanded: itemButton ? itemButton.classList.contains('expanded') : false,
                hasDescription: itemButton ? !!itemButton.querySelector('.service-description-inline') : false
            },
            inspection: {
                hasExpanded: inspectionButton ? inspectionButton.classList.contains('expanded') : false,
                hasDescription: inspectionButton ? !!inspectionButton.querySelector('.service-description-inline') : false
            }
        };
    });
    
    console.log('\nItem Recovery button:');
    console.log('  Expanded:', switchState.itemRecovery.hasExpanded);
    console.log('  Has description:', switchState.itemRecovery.hasDescription);
    console.log('\nUnderwater Inspection button:');
    console.log('  Expanded:', switchState.inspection.hasExpanded);
    console.log('  Has description:', switchState.inspection.hasDescription);
    
    // Take full screenshot
    await page.screenshot({ path: 'service-buttons-expanded.png', fullPage: false });
    console.log('\nFull view saved as service-buttons-expanded.png');
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();