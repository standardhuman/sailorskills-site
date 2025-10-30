import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing double-click functionality...\n');
    
    // Test with Item Recovery (flat rate service)
    const itemRecoveryButton = await page.$('[data-service-key="item_recovery"]');
    
    // First click
    console.log('=== FIRST CLICK ===');
    await itemRecoveryButton.click();
    await page.waitForTimeout(1000);
    
    // Check state after first click
    const afterFirstClick = await page.evaluate(() => {
        const button = document.querySelector('[data-service-key="item_recovery"]');
        const selectedServiceKey = window.selectedServiceKey;
        const currentStep = document.querySelector('.form-step.active')?.id;
        const nextButtonText = document.getElementById('next-button')?.textContent;
        
        return {
            isSelected: button?.classList.contains('selected'),
            isExpanded: button?.classList.contains('expanded'),
            selectedServiceKey: selectedServiceKey,
            currentStep: currentStep,
            nextButtonText: nextButtonText
        };
    });
    
    console.log('Button selected:', afterFirstClick.isSelected);
    console.log('Button expanded:', afterFirstClick.isExpanded);
    console.log('Selected service key:', afterFirstClick.selectedServiceKey);
    console.log('Current step:', afterFirstClick.currentStep);
    console.log('Next button text:', afterFirstClick.nextButtonText);
    
    // Second click
    console.log('\n=== SECOND CLICK (same button) ===');
    await itemRecoveryButton.click();
    await page.waitForTimeout(1500);
    
    // Check state after second click
    const afterSecondClick = await page.evaluate(() => {
        const button = document.querySelector('[data-service-key="item_recovery"]');
        const selectedServiceKey = window.selectedServiceKey;
        const currentStep = document.querySelector('.form-step.active')?.id;
        const currentStepVisible = document.querySelector('.form-step.active')?.style.display;
        const serviceButtonsVisible = document.querySelector('.service-selection-grid')?.closest('.form-step')?.style.display;
        
        return {
            isSelected: button?.classList.contains('selected'),
            isExpanded: button?.classList.contains('expanded'),
            selectedServiceKey: selectedServiceKey,
            currentStep: currentStep,
            currentStepVisible: currentStepVisible,
            serviceButtonsVisible: serviceButtonsVisible
        };
    });
    
    console.log('Button selected:', afterSecondClick.isSelected);
    console.log('Button expanded:', afterSecondClick.isExpanded);
    console.log('Selected service key:', afterSecondClick.selectedServiceKey);
    console.log('Current step:', afterSecondClick.currentStep);
    console.log('Current step visible:', afterSecondClick.currentStepVisible);
    console.log('Service buttons visible:', afterSecondClick.serviceButtonsVisible);
    
    // Check if we advanced to the next screen
    const didAdvance = afterFirstClick.currentStep !== afterSecondClick.currentStep;
    console.log('\n✅ Did advance to next step:', didAdvance);
    
    if (!didAdvance) {
        console.log('\n⚠️ ISSUE: Second click did not advance to next step');
        
        // Debug: Check if nextButton exists and is clickable
        const debugInfo = await page.evaluate(() => {
            const nextBtn = document.getElementById('next-button') || document.getElementById('nextButton');
            const nextBtnInfo = nextBtn ? {
                id: nextBtn.id,
                exists: true,
                visible: nextBtn.style.display !== 'none',
                disabled: nextBtn.disabled,
                text: nextBtn.textContent,
                onclick: !!nextBtn.onclick
            } : { exists: false };
            
            // Also check the global variable
            return {
                nextButton: nextBtnInfo,
                globalNextButton: !!window.nextButton,
                globalNextButtonId: window.nextButton?.id
            };
        });
        
        console.log('\nDebug info:');
        console.log('Next button:', debugInfo.nextButton);
        console.log('Global nextButton variable exists:', debugInfo.globalNextButton);
        console.log('Global nextButton ID:', debugInfo.globalNextButtonId);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'double-click-test.png' });
    console.log('\nScreenshot saved as double-click-test.png');
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();