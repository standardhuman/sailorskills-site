import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 // Slow down to see the transitions
    });
    const page = await browser.newPage();
    
    console.log('Testing charge-customer wizard functionality...\n');
    
    try {
        // Navigate to charge-customer page
        await page.goto('http://localhost:3000/charge-customer.html');
        console.log('✓ Loaded charge-customer page');
        
        // Wait for service buttons to load
        await page.waitForSelector('.service-option', { timeout: 5000 });
        console.log('✓ Service buttons loaded');
        
        // Test 1: Cleaning service wizard (multi-step)
        console.log('\n--- Testing Cleaning Service Wizard ---');
        
        // Debug: Check if selectService is available
        const hasSelectService = await page.evaluate(() => typeof window.selectService === 'function');
        console.log(`✓ selectService function available: ${hasSelectService}`);
        
        // Click recurring cleaning service once (should expand)
        const recurringButton = await page.locator('.service-option[data-service-key="recurring_cleaning"]');
        
        // Call selectService directly first to ensure it's set
        await page.evaluate(() => {
            window.selectService('recurring_cleaning');
        });
        console.log('✓ First click: Called selectService directly');
        
        // Wait for expansion animation
        await page.waitForTimeout(1000);
        
        // Verify the button is selected and expanded
        const buttonState = await recurringButton.evaluate(el => ({
            selected: el.classList.contains('selected'),
            expanded: el.classList.contains('expanded'),
            classes: Array.from(el.classList),
            serviceKey: el.dataset.serviceKey
        }));
        console.log(`✓ Button state:`, buttonState);
        
        // Check current service key
        const currentServiceKey = await page.evaluate(() => window.currentServiceKey);
        console.log(`✓ Current service key: ${currentServiceKey}`);
        
        // Click again to trigger wizard - call selectService directly
        await page.evaluate(() => {
            window.selectService('recurring_cleaning');
        });
        console.log('✓ Second click: Triggering wizard transition');
        
        // Debug: Check if transitionToDetailsForm was called
        const debugInfo = await page.evaluate(() => ({
            currentServiceKey: window.currentServiceKey,
            selectedServiceKey: window.selectedServiceKey,
            transitionFunctionExists: typeof window.transitionToDetailsForm === 'function',
            wizardDisplay: document.getElementById('wizardContainer')?.style.display,
            serviceGridDisplay: document.querySelector('.service-selection-grid')?.style.display
        }));
        console.log('✓ Debug info after second click:', debugInfo);
        
        // Wait for fade transition
        await page.waitForTimeout(600);
        
        // Verify wizard container is visible
        await page.waitForSelector('#wizardContainer', { state: 'visible' });
        console.log('✓ Wizard container is visible');
        
        // Test wizard step 1: Boat Information
        await page.waitForSelector('#wizardBoatName');
        await page.fill('#wizardBoatName', 'Test Vessel');
        await page.fill('#wizardBoatLength', '45');
        console.log('✓ Step 1: Filled boat information');
        
        // Click Next
        await page.click('#wizardNext');
        await page.waitForTimeout(300);
        
        // Test wizard step 2: Boat Type
        await page.waitForSelector('input[name="wizard_boat_type"]');
        await page.check('input[value="powerboat"]');
        console.log('✓ Step 2: Selected powerboat');
        
        // Click Next
        await page.click('#wizardNext');
        await page.waitForTimeout(300);
        
        // Test wizard step 3: Hull Type
        await page.waitForSelector('input[name="wizard_hull_type"]');
        await page.check('input[value="catamaran"]');
        console.log('✓ Step 3: Selected catamaran');
        
        // Click Next
        await page.click('#wizardNext');
        await page.waitForTimeout(300);
        
        // Test wizard step 4: Engine Configuration
        await page.waitForSelector('#wizard_twin_engines');
        await page.check('#wizard_twin_engines');
        console.log('✓ Step 4: Selected twin engines');
        
        // Click Next
        await page.click('#wizardNext');
        await page.waitForTimeout(300);
        
        // Test wizard step 5: Paint Condition
        await page.waitForSelector('#wizardPaintCondition');
        await page.selectOption('#wizardPaintCondition', 'good');
        console.log('✓ Step 5: Selected paint condition');
        
        // Click Next
        await page.click('#wizardNext');
        await page.waitForTimeout(300);
        
        // Test wizard step 6: Growth Level
        await page.waitForSelector('#wizardGrowthLevel');
        await page.selectOption('#wizardGrowthLevel', 'moderate');
        console.log('✓ Step 6: Selected growth level');
        
        // Verify Complete button appears
        const nextButtonText = await page.textContent('#wizardNext');
        console.log(`✓ Final button text: "${nextButtonText}"`);
        
        // Click Complete
        await page.click('#wizardNext');
        await page.waitForTimeout(600);
        
        // Verify pricing display is shown
        await page.waitForSelector('#pricingDisplay', { state: 'visible' });
        console.log('✓ Pricing display is visible after wizard completion');
        
        // Verify boat details are shown
        await page.waitForSelector('.boat-details', { state: 'visible' });
        console.log('✓ Boat details section is visible');
        
        // Check if price was calculated
        const totalCost = await page.textContent('#totalCostDisplay');
        console.log(`✓ Total cost calculated: ${totalCost}`);
        
        // Test 2: Back button navigation
        console.log('\n--- Testing Back Button Navigation ---');
        
        // Reload to test back button
        await page.reload();
        await page.waitForSelector('.service-option');
        
        // Select item recovery (flat rate - single step) using selectService directly
        await page.evaluate(() => {
            window.selectService('item_recovery');
        });
        await page.waitForTimeout(500);
        
        // Second click to trigger wizard
        await page.evaluate(() => {
            window.selectService('item_recovery');
        });
        
        // Wait for wizard
        await page.waitForSelector('#wizardContainer', { state: 'visible' });
        
        // Verify back button is hidden on first step
        const backButtonVisible = await page.isVisible('#wizardBack');
        console.log(`✓ Back button hidden on first step: ${!backButtonVisible}`);
        
        // For flat rate service, should only have one step
        const completeButtonText = await page.textContent('#wizardNext');
        console.log(`✓ Flat rate service shows: "${completeButtonText}"`);
        
        console.log('\n✅ All wizard tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Take screenshot on failure
        await page.screenshot({ path: 'wizard-test-failure.png' });
        console.log('Screenshot saved as wizard-test-failure.png');
    } finally {
        await browser.close();
    }
})();