const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Testing admin page changes...');
    
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin.html');
    await page.waitForTimeout(2000);
    
    // Test 1: Check if growth slider exists
    console.log('\n1. Testing growth level slider...');
    const slider = await page.locator('#growthLevelSlider').first();
    if (await slider.isVisible()) {
        console.log('✓ Growth level slider is visible');
        
        // Test slider functionality
        await slider.fill('3'); // Set to severe
        await page.waitForTimeout(500);
        
        const sliderValue = await page.locator('#growthSliderValue').first().textContent();
        console.log(`✓ Slider value shows: ${sliderValue}`);
        
        const hiddenValue = await page.locator('#actualGrowthLevel').first().inputValue();
        console.log(`✓ Hidden input value: ${hiddenValue}`);
    } else {
        console.log('✗ Growth level slider not found');
    }
    
    // Test 2: Select a service and check paint condition buttons
    console.log('\n2. Testing paint condition button styling...');
    
    // Click on a service button
    const serviceBtn = await page.locator('button:has-text("Recurring Cleaning")').first();
    if (await serviceBtn.isVisible()) {
        await serviceBtn.click();
        await page.waitForTimeout(1000);
        
        // Check paint condition buttons
        const paintButton = await page.locator('.paint-good').first();
        if (await paintButton.isVisible()) {
            await paintButton.click();
            await page.waitForTimeout(500);
            
            // Check if button has selected class and white text
            const isSelected = await paintButton.evaluate(el => el.classList.contains('selected'));
            const textColor = await paintButton.evaluate(el => 
                window.getComputedStyle(el).color
            );
            
            console.log(`✓ Paint button selected: ${isSelected}`);
            console.log(`✓ Text color: ${textColor}`);
        }
    }
    
    // Test 3: Check wizard growth slider
    console.log('\n3. Testing wizard growth slider...');
    const wizardSlider = await page.locator('#wizardGrowthLevelSlider, #wizardGrowthLevelSliderMain').first();
    if (await wizardSlider.isVisible()) {
        console.log('✓ Wizard growth slider is visible');
        
        // Set to severe (value 3)
        await wizardSlider.fill('3');
        await page.waitForTimeout(500);
        
        const wizardValue = await page.locator('#wizardGrowthSliderValue, #wizardGrowthSliderValueMain').first().textContent();
        console.log(`✓ Wizard slider shows: ${wizardValue}`);
    }
    
    // Test 4: Check pricing with severe growth (200% surcharge)
    console.log('\n4. Testing severe growth surcharge...');
    
    // Set boat length
    const boatLengthInput = await page.locator('input[type="range"]').first();
    if (await boatLengthInput.isVisible()) {
        await boatLengthInput.fill('40');
        await page.waitForTimeout(500);
    }
    
    // Set growth to severe
    if (await wizardSlider.isVisible()) {
        await wizardSlider.fill('3'); // Severe
        await page.waitForTimeout(1000);
    }
    
    // Check if pricing updated
    const priceElement = await page.locator('[id*="price"], [class*="price"]').first();
    if (await priceElement.isVisible()) {
        const priceText = await priceElement.textContent();
        console.log(`✓ Price display: ${priceText}`);
    }
    
    console.log('\n✅ Admin page tests completed!');
    
    await page.screenshot({ path: 'admin-test-screenshot.png' });
    console.log('Screenshot saved as admin-test-screenshot.png');
    
    await browser.close();
})();
