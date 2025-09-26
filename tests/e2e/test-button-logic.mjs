import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing charge button enable logic in detail...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click service button
console.log('1. Clicking Recurring Cleaning:');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(500); // Allow setTimeout to complete

// Check state after click
const state = await page.evaluate(() => {
    return {
        currentServiceKey: window.currentServiceKey,
        selectedServiceKey: window.selectedServiceKey,
        buttonDisabled: document.getElementById('chargeButton')?.disabled,
        buttonText: document.getElementById('chargeButton')?.textContent,
        hasUpdateFunction: typeof window.updateChargeSummary === 'function'
    };
});

console.log('   State after click:');
console.log(`   - window.currentServiceKey: ${state.currentServiceKey}`);
console.log(`   - window.selectedServiceKey: ${state.selectedServiceKey}`);
console.log(`   - Button disabled: ${state.buttonDisabled}`);
console.log(`   - Button text: ${state.buttonText?.trim()}`);
console.log(`   - updateChargeSummary exists: ${state.hasUpdateFunction}`);

// Debug updateChargeSummary logic
console.log('\n2. Debugging updateChargeSummary logic:');
const debugInfo = await page.evaluate(() => {
    // Run updateChargeSummary and capture the result
    const button = document.getElementById('chargeButton');
    const beforeDisabled = button?.disabled;

    // Check what the function sees
    const serviceKey = window.currentServiceKey;

    // Call the function
    if (window.updateChargeSummary) {
        window.updateChargeSummary();
    }

    const afterDisabled = button?.disabled;

    return {
        beforeDisabled,
        afterDisabled,
        serviceKeyInFunction: serviceKey,
        buttonId: button?.id,
        buttonExists: !!button
    };
});

console.log('   Debug info:');
console.log(`   - Button disabled before: ${debugInfo.beforeDisabled}`);
console.log(`   - Button disabled after: ${debugInfo.afterDisabled}`);
console.log(`   - Service key seen: ${debugInfo.serviceKeyInFunction}`);
console.log(`   - Button exists: ${debugInfo.buttonExists}`);
console.log(`   - Button ID: ${debugInfo.buttonId}`);

// Try to see what's in the updateChargeSummary function
console.log('\n3. Checking updateChargeSummary logic:');
const funcCheck = await page.evaluate(() => {
    // Get the function source if possible
    const funcSource = window.updateChargeSummary.toString();
    // Check what line disables the button
    const disablesLine = funcSource.includes('chargeButton.disabled = !window.currentServiceKey');
    const hasCurrentServiceCheck = funcSource.includes('window.currentServiceKey');

    return {
        hasDisableLogic: disablesLine,
        checksCurrentService: hasCurrentServiceCheck,
        functionLength: funcSource.length
    };
});

console.log('   Function analysis:');
console.log(`   - Has correct disable logic: ${funcCheck.hasDisableLogic}`);
console.log(`   - Checks currentServiceKey: ${funcCheck.checksCurrentService}`);
console.log(`   - Function length: ${funcCheck.functionLength} chars`);

console.log('\n✅ Test completed!');
await page.waitForTimeout(2000);
await browser.close();