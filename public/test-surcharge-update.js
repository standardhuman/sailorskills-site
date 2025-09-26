import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing dynamic surcharge update for Last Cleaning...\n');
    
    // Select a cleaning service
    await page.click('[data-service-key="onetime_cleaning"]');
    console.log('Selected One-time Cleaning service');
    await page.waitForTimeout(1000);
    
    // Click to continue (double-click on selected service)
    await page.click('[data-service-key="onetime_cleaning"]');
    await page.waitForTimeout(1000);
    
    // Enter boat length
    const boatLengthInput = await page.$('#boatLength');
    if (boatLengthInput) {
        await boatLengthInput.fill('35');
        console.log('Entered boat length: 35 feet');
    }
    
    // Click through steps to get to Last Cleaning
    for (let i = 0; i < 5; i++) {
        const nextBtn = await page.$('#nextButton:visible');
        if (nextBtn) {
            const btnText = await nextBtn.textContent();
            console.log(`Clicking: ${btnText}`);
            await nextBtn.click();
            await page.waitForTimeout(500);
        }
    }
    
    // Check if we're at the Last Cleaning step
    const isAtLastCleaning = await page.evaluate(() => {
        const explainer = document.getElementById('growthExplainerText');
        const dropdown = document.getElementById('lastCleanedTime');
        return {
            hasExplainer: !!explainer,
            hasDropdown: !!dropdown,
            currentValue: dropdown?.value,
            explainerText: explainer?.innerHTML
        };
    });
    
    console.log('\n=== LAST CLEANING STEP ===');
    console.log('Has explainer:', isAtLastCleaning.hasExplainer);
    console.log('Has dropdown:', isAtLastCleaning.hasDropdown);
    console.log('Current dropdown value:', isAtLastCleaning.currentValue);
    console.log('Initial explainer text:', isAtLastCleaning.explainerText);
    
    if (isAtLastCleaning.hasDropdown) {
        // Test different dropdown values
        const testValues = [
            { value: '0-2_months', label: 'Within 2 months' },
            { value: '3-4_months', label: '3-4 months ago' },
            { value: '7-8_months', label: '7-8 months ago' },
            { value: '13-24_months', label: '13-24 months ago' },
            { value: 'over_24_months_unsure', label: 'Over 24 months / Unsure' }
        ];
        
        console.log('\n=== TESTING DROPDOWN CHANGES ===');
        
        for (const test of testValues) {
            await page.selectOption('#lastCleanedTime', test.value);
            await page.waitForTimeout(500);
            
            const explainerText = await page.evaluate(() => {
                return document.getElementById('growthExplainerText')?.innerHTML;
            });
            
            console.log(`\n${test.label}:`);
            console.log(`  ${explainerText}`);
        }
        
        // Take screenshot of the dropdown with updated surcharge
        await page.screenshot({ path: 'surcharge-update-test.png' });
        console.log('\nScreenshot saved as surcharge-update-test.png');
    } else {
        console.log('\n⚠️ Not at the Last Cleaning step or elements not found');
    }
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();