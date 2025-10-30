import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing dynamic surcharge update for Paint Age...\n');
    
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
    
    // Click through steps to get to Paint Age
    for (let i = 0; i < 4; i++) {
        const nextBtn = await page.$('#nextButton:visible');
        if (nextBtn) {
            const btnText = await nextBtn.textContent();
            console.log(`Clicking: ${btnText}`);
            await nextBtn.click();
            await page.waitForTimeout(500);
        }
    }
    
    // Check if we're at the Paint Age step
    const isAtPaintAge = await page.evaluate(() => {
        const explainer = document.getElementById('paintExplainerText');
        const dropdown = document.getElementById('lastPaintedTime');
        return {
            hasExplainer: !!explainer,
            hasDropdown: !!dropdown,
            currentValue: dropdown?.value,
            explainerText: explainer?.innerHTML
        };
    });
    
    console.log('\n=== PAINT AGE STEP ===');
    console.log('Has explainer:', isAtPaintAge.hasExplainer);
    console.log('Has dropdown:', isAtPaintAge.hasDropdown);
    console.log('Current dropdown value:', isAtPaintAge.currentValue);
    console.log('Initial explainer text:', isAtPaintAge.explainerText);
    
    if (isAtPaintAge.hasDropdown) {
        // Test different dropdown values
        const testValues = [
            { value: '0-6_months', label: 'Within 6 months' },
            { value: '7-12_months', label: '7-12 months ago' },
            { value: '13-21_months', label: '13-21 months ago' },
            { value: '22-24_months', label: '22-24 months ago' },
            { value: 'over_24_months', label: 'Over 24 months ago' },
            { value: 'unsure_paint', label: 'Unsure' }
        ];
        
        console.log('\n=== TESTING PAINT AGE DROPDOWN CHANGES ===');
        
        for (const test of testValues) {
            await page.selectOption('#lastPaintedTime', test.value);
            await page.waitForTimeout(500);
            
            const explainerText = await page.evaluate(() => {
                return document.getElementById('paintExplainerText')?.innerHTML;
            });
            
            console.log(`\n${test.label}:`);
            console.log(`  ${explainerText}`);
        }
        
        // Take screenshot of the dropdown with updated surcharge
        await page.screenshot({ path: 'paint-surcharge-test.png' });
        console.log('\nScreenshot saved as paint-surcharge-test.png');
        
        // Test interaction with growth level
        console.log('\n=== TESTING INTERACTION WITH GROWTH LEVEL ===');
        
        // Set paint to poor condition
        await page.selectOption('#lastPaintedTime', 'over_24_months');
        await page.waitForTimeout(500);
        
        // Go to next step (Last Cleaned)
        const nextBtn = await page.$('#nextButton:visible');
        if (nextBtn) {
            await nextBtn.click();
            await page.waitForTimeout(500);
        }
        
        // Test how growth level changes with poor paint
        const growthTestValues = [
            { value: '0-2_months', label: 'Within 2 months (Poor paint)' },
            { value: '7-8_months', label: '7-8 months ago (Poor paint)' }
        ];
        
        for (const test of growthTestValues) {
            await page.selectOption('#lastCleanedTime', test.value);
            await page.waitForTimeout(500);
            
            const growthText = await page.evaluate(() => {
                return document.getElementById('growthExplainerText')?.innerHTML;
            });
            
            console.log(`\n${test.label}:`);
            console.log(`  ${growthText}`);
        }
        
    } else {
        console.log('\n⚠️ Not at the Paint Age step or elements not found');
    }
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();