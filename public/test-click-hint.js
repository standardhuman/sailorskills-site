import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing click hint display...\n');
    
    // Click on Item Recovery service
    await page.click('[data-service-key="item_recovery"]');
    console.log('Clicked Item Recovery button');
    await page.waitForTimeout(1500); // Wait for animations
    
    // Check if hint is displayed
    const hintInfo = await page.evaluate(() => {
        const button = document.querySelector('[data-service-key="item_recovery"]');
        const hint = button ? button.querySelector('.service-click-hint') : null;
        
        return {
            hasHint: !!hint,
            hintText: hint ? hint.textContent : null,
            hintVisible: hint ? window.getComputedStyle(hint).display !== 'none' : false,
            buttonHeight: button ? button.getBoundingClientRect().height : null
        };
    });
    
    console.log('\n=== HINT DISPLAY ===');
    console.log('Has hint element:', hintInfo.hasHint);
    console.log('Hint text:', hintInfo.hintText);
    console.log('Hint visible:', hintInfo.hintVisible);
    console.log('Button height with hint:', hintInfo.buttonHeight);
    
    // Take screenshot of button with hint
    const button = await page.$('[data-service-key="item_recovery"]');
    await button.screenshot({ path: 'button-with-hint.png' });
    console.log('\nScreenshot saved as button-with-hint.png');
    
    // Test the click action
    console.log('\n=== TESTING CLICK ACTION ===');
    console.log('Clicking button again to continue...');
    await page.click('[data-service-key="item_recovery"]');
    await page.waitForTimeout(1000);
    
    // Check if we advanced
    const advanced = await page.evaluate(() => {
        const resultSection = document.querySelector('#step-8');
        return resultSection && window.getComputedStyle(resultSection).display !== 'none';
    });
    
    console.log('Advanced to results:', advanced);
    
    if (advanced) {
        console.log('✅ Click to continue is working!');
    }
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();