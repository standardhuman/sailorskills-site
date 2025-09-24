import { chromium } from 'playwright';

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
const sliderExists = await slider.count() > 0;

if (sliderExists) {
    console.log('✓ Growth level slider found');
    
    // Test slider functionality
    await slider.fill('3'); // Set to severe
    await page.waitForTimeout(500);
    
    const sliderValue = await page.locator('#growthSliderValue').first();
    const valueText = await sliderValue.textContent();
    console.log(`✓ Slider value shows: ${valueText}`);
    
    const hiddenInput = await page.locator('#actualGrowthLevel').first();
    const hiddenValue = await hiddenInput.inputValue();
    console.log(`✓ Hidden input value: ${hiddenValue}`);
} else {
    console.log('✗ Growth level slider not found - checking main form');
}

// Test 2: Select a service and check paint condition buttons
console.log('\n2. Testing paint condition button styling...');

// Click on a service button
const serviceBtn = await page.locator('button:has-text("Recurring Cleaning")').first();
const serviceBtnExists = await serviceBtn.count() > 0;

if (serviceBtnExists) {
    await serviceBtn.click();
    await page.waitForTimeout(1000);
    
    // Check paint condition buttons
    const paintButtons = await page.locator('.option-button[data-value="good"]').all();
    if (paintButtons.length > 0) {
        const paintButton = paintButtons[0];
        await paintButton.click();
        await page.waitForTimeout(500);
        
        // Check styling
        const isSelected = await paintButton.evaluate(el => el.classList.contains('selected'));
        const computedStyle = await paintButton.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
                color: style.color,
                backgroundColor: style.backgroundColor
            };
        });
        
        console.log(`✓ Paint button selected: ${isSelected}`);
        console.log(`✓ Button styling - Color: ${computedStyle.color}, Background: ${computedStyle.backgroundColor}`);
    }
}

// Test 3: Check wizard growth slider
console.log('\n3. Testing wizard growth slider...');
const wizardSliders = await page.locator('input.growth-slider').all();
console.log(`Found ${wizardSliders.length} growth slider(s)`);

if (wizardSliders.length > 0) {
    const wizardSlider = wizardSliders[0];
    console.log('✓ Wizard growth slider found');
    
    // Set to severe (value 3)
    await wizardSlider.fill('3');
    await page.waitForTimeout(500);
    
    const valueDisplays = await page.locator('.growth-slider-value').all();
    if (valueDisplays.length > 0) {
        const wizardValue = await valueDisplays[0].textContent();
        console.log(`✓ Slider shows: ${wizardValue}`);
    }
}

// Test 4: Check pricing calculation
console.log('\n4. Testing pricing display...');

// Look for price elements
const priceElements = await page.locator('text=/\\$[0-9]+/').all();
if (priceElements.length > 0) {
    const priceText = await priceElements[0].textContent();
    console.log(`✓ Found price display: ${priceText}`);
}

console.log('\n✅ Admin page tests completed!');

await page.screenshot({ path: 'admin-test-screenshot.png' });
console.log('Screenshot saved as admin-test-screenshot.png');

await browser.close();
