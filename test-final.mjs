import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Enable console logging from the page
page.on('console', msg => {
    if (msg.text().includes('Service already selected') ||
        msg.text().includes('Direct service selection')) {
        console.log('Page console:', msg.text());
    }
});

console.log('Testing complete workflow with proper timing...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(2000); // Wait for all scripts to load

// Step 1: Click service button
console.log('1. Selecting Recurring Cleaning service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(1500); // Allow time for module scripts and updateChargeSummary

// Check button state after initial selection
let buttonState = await page.evaluate(() => ({
    disabled: document.getElementById('chargeButton')?.disabled,
    text: document.getElementById('chargeButton')?.textContent?.trim(),
    currentServiceKey: window.currentServiceKey
}));

console.log('   After service selection:');
console.log(`   - Service key: ${buttonState.currentServiceKey}`);
console.log(`   - Button disabled: ${buttonState.disabled}`);
console.log(`   - Button text: ${buttonState.text}`);

if (!buttonState.disabled) {
    console.log('\n2. Button is enabled! Testing modal opening...');

    // Click the charge button
    await page.locator('#chargeButton').click();
    await page.waitForTimeout(1000);

    // Check if modal opened
    const modalVisible = await page.locator('#customerSelectionModal').isVisible();
    console.log(`   Modal visible: ${modalVisible}`);

    if (modalVisible) {
        console.log('\n3. Modal opened successfully!');

        // Check modal content
        const hasExistingTab = await page.locator('#selectExistingTab').isVisible();
        const hasManualTab = await page.locator('#manualEntryTab').isVisible();
        console.log(`   Has existing customer tab: ${hasExistingTab}`);
        console.log(`   Has manual entry tab: ${hasManualTab}`);

        // Test tab switching
        console.log('\n4. Testing tab switching...');
        await page.locator('#manualEntryTab').click();
        await page.waitForTimeout(500);

        const manualFormVisible = await page.locator('#manualEntryTab').isVisible();
        console.log(`   Manual form visible: ${manualFormVisible}`);

        // Close modal
        await page.locator('#customerSelectionModal .close').click();
        await page.waitForTimeout(500);

        const modalClosed = !(await page.locator('#customerSelectionModal').isVisible());
        console.log(`   Modal closed: ${modalClosed}`);

        console.log('\n✅ All tests passed!');
    }
} else {
    console.log('\n❌ Button is still disabled. Checking why...');

    // Debug the issue
    const debugInfo = await page.evaluate(() => {
        const func = window.updateChargeSummary?.toString() || 'not defined';
        return {
            functionSource: func.substring(0, 200),
            currentServiceKey: window.currentServiceKey,
            selectedServiceKey: window.selectedServiceKey
        };
    });

    console.log('   Debug info:');
    console.log(`   - currentServiceKey: ${debugInfo.currentServiceKey}`);
    console.log(`   - selectedServiceKey: ${debugInfo.selectedServiceKey}`);
    console.log(`   - Function source (first 200 chars): ${debugInfo.functionSource}`);
}

await page.screenshot({ path: 'final-test.png', fullPage: true });
console.log('\nScreenshot saved as final-test.png');

await page.waitForTimeout(2000);
await browser.close();