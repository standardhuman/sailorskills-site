import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing growth level slider and surcharge...\n');

// Navigate to admin page
await page.goto('http://localhost:3000/admin.html');
await page.waitForTimeout(1000);

// Click on Recurring Cleaning service
console.log('1. Selecting Recurring Cleaning service...');
const serviceBtn = await page.locator('.simple-service-btn:has-text("Recurring Cleaning")').first();
await serviceBtn.click();
await page.waitForTimeout(2000);

// Test the wizard growth slider
console.log('2. Testing wizard growth slider...');
const wizardSliders = await page.locator('.growth-slider').all();
console.log(`   Found ${wizardSliders.length} growth slider(s)`);

if (wizardSliders.length > 0) {
    // Find visible slider
    let visibleSlider = null;
    for (const slider of wizardSliders) {
        if (await slider.isVisible()) {
            visibleSlider = slider;
            const sliderId = await slider.getAttribute('id');
            console.log(`   Using visible slider: ${sliderId}`);
            break;
        }
    }
    
    if (visibleSlider) {
        // Test different growth levels
        console.log('\n3. Testing growth level changes:');
        
        // Set to minimal (0)
        await visibleSlider.evaluate(el => el.value = '0');
        await visibleSlider.dispatchEvent('input');
        await page.waitForTimeout(500);
        let valueDisplay = await page.locator('.growth-slider-value').first().textContent();
        console.log(`   Minimal (0): Display shows "${valueDisplay}"`);
        
        // Set to moderate (1)
        await visibleSlider.evaluate(el => el.value = '1');
        await visibleSlider.dispatchEvent('input');
        await page.waitForTimeout(500);
        valueDisplay = await page.locator('.growth-slider-value').first().textContent();
        console.log(`   Moderate (1): Display shows "${valueDisplay}"`);
        
        // Set to heavy (2)
        await visibleSlider.evaluate(el => el.value = '2');
        await visibleSlider.dispatchEvent('input');
        await page.waitForTimeout(500);
        valueDisplay = await page.locator('.growth-slider-value').first().textContent();
        console.log(`   Heavy (2): Display shows "${valueDisplay}"`);
        
        // Set to severe (3) - should trigger 200% surcharge
        await visibleSlider.evaluate(el => el.value = '3');
        await visibleSlider.dispatchEvent('input');
        await page.waitForTimeout(1000);
        valueDisplay = await page.locator('.growth-slider-value').first().textContent();
        console.log(`   Severe (3): Display shows "${valueDisplay}"`);
        
        // Check for price updates
        console.log('\n4. Checking pricing with severe growth:');
        const priceElements = await page.locator('text=/\\$[0-9]/').all();
        if (priceElements.length > 0) {
            for (const elem of priceElements) {
                const text = await elem.textContent();
                if (text.includes('$')) {
                    console.log(`   Price found: ${text}`);
                }
            }
        }
        
        // Check surcharge display
        const surchargeElements = await page.locator('text=/200%|surcharge/i').all();
        if (surchargeElements.length > 0) {
            console.log('   ✓ Found surcharge indication');
        }
    }
}

// Test paint condition button styling
console.log('\n5. Testing paint condition button styling:');
const paintButton = await page.locator('.paint-good').first();
if (await paintButton.isVisible()) {
    await paintButton.click();
    await page.waitForTimeout(500);
    
    const styles = await paintButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            hasSelectedClass: el.classList.contains('selected')
        };
    });
    
    console.log(`   Button selected: ${styles.hasSelectedClass}`);
    console.log(`   Text color: ${styles.color}`);
    console.log(`   Background: ${styles.backgroundColor}`);
}

console.log('\n✅ Test completed!');

await page.screenshot({ path: 'growth-slider-test.png', fullPage: true });
console.log('Screenshot saved as growth-slider-test.png');

await page.waitForTimeout(2000);
await browser.close();
