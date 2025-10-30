import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:8000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Testing double-click with detailed debugging...\n');
    
    // Get initial state
    const initialState = await page.evaluate(() => {
        return {
            currentStep: window.currentStep,
            selectedServiceKey: window.selectedServiceKey,
            activeStepId: document.querySelector('.form-step.active')?.id,
            nextButtonText: document.getElementById('nextButton')?.textContent,
            nextButtonDisabled: document.getElementById('nextButton')?.disabled
        };
    });
    
    console.log('=== INITIAL STATE ===');
    console.log('Current step index:', initialState.currentStep);
    console.log('Active step ID:', initialState.activeStepId);
    console.log('Selected service:', initialState.selectedServiceKey);
    console.log('Next button text:', initialState.nextButtonText);
    console.log('Next button disabled:', initialState.nextButtonDisabled);
    
    // First click on Item Recovery
    console.log('\n=== FIRST CLICK on Item Recovery ===');
    await page.click('[data-service-key="item_recovery"]');
    await page.waitForTimeout(500);
    
    const afterFirstClick = await page.evaluate(() => {
        return {
            currentStep: window.currentStep,
            selectedServiceKey: window.selectedServiceKey,
            activeStepId: document.querySelector('.form-step.active')?.id,
            nextButtonText: document.getElementById('nextButton')?.textContent,
            nextButtonDisabled: document.getElementById('nextButton')?.disabled,
            buttonSelected: document.querySelector('[data-service-key="item_recovery"]')?.classList.contains('selected')
        };
    });
    
    console.log('Current step index:', afterFirstClick.currentStep);
    console.log('Active step ID:', afterFirstClick.activeStepId);
    console.log('Selected service:', afterFirstClick.selectedServiceKey);
    console.log('Next button text:', afterFirstClick.nextButtonText);
    console.log('Next button disabled:', afterFirstClick.nextButtonDisabled);
    console.log('Button has selected class:', afterFirstClick.buttonSelected);
    
    // Second click on same button
    console.log('\n=== SECOND CLICK on Item Recovery (same button) ===');
    await page.click('[data-service-key="item_recovery"]');
    await page.waitForTimeout(1500);
    
    const afterSecondClick = await page.evaluate(() => {
        const activeStep = document.querySelector('.form-step.active');
        const allSteps = Array.from(document.querySelectorAll('.form-step'));
        const visibleSteps = allSteps.filter(step => step.style.display !== 'none');
        
        return {
            currentStep: window.currentStep,
            selectedServiceKey: window.selectedServiceKey,
            activeStepId: activeStep?.id,
            activeStepContent: activeStep?.textContent?.substring(0, 100),
            nextButtonText: document.getElementById('nextButton')?.textContent,
            nextButtonDisabled: document.getElementById('nextButton')?.disabled,
            totalSteps: allSteps.length,
            visibleStepsCount: visibleSteps.length,
            visibleStepIds: visibleSteps.map(s => s.id)
        };
    });
    
    console.log('Current step index:', afterSecondClick.currentStep);
    console.log('Active step ID:', afterSecondClick.activeStepId);
    console.log('Selected service:', afterSecondClick.selectedServiceKey);
    console.log('Next button text:', afterSecondClick.nextButtonText);
    console.log('Next button disabled:', afterSecondClick.nextButtonDisabled);
    console.log('Total steps:', afterSecondClick.totalSteps);
    console.log('Visible steps:', afterSecondClick.visibleStepsCount);
    console.log('Visible step IDs:', afterSecondClick.visibleStepIds);
    console.log('Active step content preview:', afterSecondClick.activeStepContent);
    
    // Check if we're at the results step
    const isAtResults = afterSecondClick.activeStepId === 'step-8' || 
                       afterSecondClick.nextButtonText === 'Start Over';
    
    if (isAtResults) {
        console.log('\n✅ SUCCESS: Advanced to results/estimate step!');
    } else {
        console.log('\n❌ FAILED: Did not advance properly');
    }
    
    await page.screenshot({ path: 'double-click-debug.png' });
    console.log('\nScreenshot saved as double-click-debug.png');
    
    console.log('\nTest complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    
    await browser.close();
})();