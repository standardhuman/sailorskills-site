import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing checkout button position...\n');
    
    // Select Item Recovery (simple flat fee)
    await page.click('[data-service-key="item_recovery"]');
    console.log('Selected Item Recovery service');
    await page.waitForTimeout(1000);
    
    // Click to continue (double-click)
    await page.click('[data-service-key="item_recovery"]');
    console.log('Advanced to results');
    await page.waitForTimeout(1500);
    
    // Check the position and content
    const pageAnalysis = await page.evaluate(() => {
        const resultSection = document.getElementById('step-8');
        const checkoutButton = document.getElementById('checkout-button');
        const minimumText = resultSection?.querySelector('.variable-info');
        const costBreakdown = document.getElementById('costBreakdown');
        const totalDisplay = document.getElementById('totalCostDisplay');
        
        // Get positions of elements
        const elements = [];
        if (resultSection) {
            const heading = resultSection.querySelector('h3');
            if (heading) elements.push({ name: 'Heading', top: heading.getBoundingClientRect().top });
        }
        if (totalDisplay) elements.push({ name: 'Total Display', top: totalDisplay.getBoundingClientRect().top });
        if (minimumText) {
            elements.push({ 
                name: 'Minimum Text', 
                top: minimumText.getBoundingClientRect().top,
                text: minimumText.textContent 
            });
        }
        if (checkoutButton) elements.push({ name: 'Checkout Button', top: checkoutButton.getBoundingClientRect().top });
        if (costBreakdown) elements.push({ name: 'Cost Breakdown', top: costBreakdown.getBoundingClientRect().top });
        
        // Sort by position
        elements.sort((a, b) => a.top - b.top);
        
        return {
            elementsOrder: elements,
            checkoutButtonExists: !!checkoutButton,
            minimumFeeText: minimumText?.textContent,
            buttonText: checkoutButton?.textContent
        };
    });
    
    console.log('=== PAGE LAYOUT ANALYSIS ===');
    console.log('Checkout button exists:', pageAnalysis.checkoutButtonExists);
    console.log('Minimum fee text:', pageAnalysis.minimumFeeText);
    console.log('Button text:', pageAnalysis.buttonText);
    
    console.log('\n=== ELEMENTS ORDER (top to bottom) ===');
    pageAnalysis.elementsOrder.forEach((elem, index) => {
        console.log(`${index + 1}. ${elem.name}${elem.text ? ` - "${elem.text}"` : ''}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'checkout-button-position.png' });
    console.log('\nScreenshot saved as checkout-button-position.png');
    
    // Check if button is clickable and visible
    const buttonCheck = await page.evaluate(() => {
        const btn = document.getElementById('checkout-button');
        if (!btn) return { error: 'Button not found' };
        
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        
        return {
            visible: rect.width > 0 && rect.height > 0,
            display: styles.display,
            position: `${rect.left}, ${rect.top}`,
            size: `${rect.width}x${rect.height}`
        };
    });
    
    console.log('\n=== BUTTON VISIBILITY CHECK ===');
    console.log('Button details:', buttonCheck);
    
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    
    await browser.close();
})();