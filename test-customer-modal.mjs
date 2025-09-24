import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing customer selection modal workflow...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Step 1: Select a service
console.log('1. Selecting Recurring Cleaning service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(2000);

// Step 2: Configure the service
console.log('2. Configuring service...');
// Click Fair paint condition
await page.locator('.paint-fair').first().click();
await page.waitForTimeout(300);

// Set growth slider to high value
const slider = await page.locator('.growth-slider').first();
await slider.evaluate(el => {
    el.value = '80';
    el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(500);

// Step 3: Check that Charge Summary updated without customer
console.log('3. Checking Charge Summary (no customer selected)...');
const summaryText = await page.locator('.charge-summary').textContent();
console.log(`   Summary shows: ${summaryText.substring(0, 100)}...`);

// Step 4: Check if Charge Customer button is enabled
console.log('4. Checking if Charge Customer button is enabled...');
const chargeBtn = await page.locator('#chargeButton');
const isDisabled = await chargeBtn.isDisabled();
console.log(`   Button is ${isDisabled ? 'disabled' : 'enabled'}`);

// Step 5: Click Charge Customer without selecting a customer
console.log('5. Clicking Charge Customer without customer selected...');
await chargeBtn.click();
await page.waitForTimeout(1000);

// Step 6: Check if modal opened
console.log('6. Checking if customer selection modal opened...');
const modalVisible = await page.locator('#customerSelectionModal').isVisible();
console.log(`   Modal is ${modalVisible ? 'visible' : 'not visible'}`);

if (modalVisible) {
    // Step 7: Check modal tabs
    console.log('7. Testing modal tabs...');

    // Check existing customer tab is active
    const existingTabActive = await page.locator('#selectExistingTab').evaluate(el =>
        el.classList.contains('active')
    );
    console.log(`   Existing customer tab is ${existingTabActive ? 'active' : 'not active'}`);

    // Switch to manual entry tab
    await page.locator('#manualEntryTab').click();
    await page.waitForTimeout(500);

    const manualFormVisible = await page.locator('#manualEntryTab').isVisible();
    console.log(`   Manual entry form is ${manualFormVisible ? 'visible' : 'not visible'}`);

    // Switch back to existing customers
    await page.locator('#selectExistingTab').click();
    await page.waitForTimeout(500);

    // Step 8: Test customer search
    console.log('8. Testing customer search...');
    const searchInput = await page.locator('#modalCustomerSearch');
    if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        console.log('   Search field accepts input');
    }

    // Step 9: Close modal
    console.log('9. Testing modal close...');
    await page.locator('.modal .close').first().click();
    await page.waitForTimeout(500);

    const modalHidden = !(await page.locator('#customerSelectionModal').isVisible());
    console.log(`   Modal is ${modalHidden ? 'closed' : 'still open'}`);
}

await page.screenshot({ path: 'customer-modal-test.png', fullPage: true });
console.log('\nScreenshot saved as customer-modal-test.png');

console.log('\n✅ Test completed!');
await page.waitForTimeout(2000);
await browser.close();