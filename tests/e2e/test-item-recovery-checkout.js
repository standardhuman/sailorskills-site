import { chromium } from 'playwright';

async function testItemRecoveryCheckout() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Testing item recovery checkout...');
        await page.goto('http://localhost:3000/diving');

        // Click on Item Recovery service
        await page.waitForSelector('#serviceButtons', { state: 'visible' });
        await page.click('button:has-text("Item Recovery")');
        console.log('✓ Selected Item Recovery service');

        // Click View Estimate
        await page.waitForSelector('#nextButton:has-text("View Estimate")', { state: 'visible' });
        await page.click('#nextButton');
        console.log('✓ Clicked View Estimate');

        // Wait for checkout button and click it
        await page.waitForSelector('button:has-text("Proceed to Checkout")', { state: 'visible' });
        await page.click('button:has-text("Proceed to Checkout")');
        console.log('✓ Clicked Proceed to Checkout');

        // Fill in the item recovery form
        await page.waitForSelector('#recovery-location', { state: 'visible' });
        await page.fill('#recovery-location', 'Test Marina, Dock A, Slip 15');
        await page.fill('#item-description', 'iPhone 14 Pro');
        await page.fill('#drop-date', '2025-01-24T10:30');
        console.log('✓ Filled item recovery details');

        // Fill in contact info
        await page.fill('#customer-name', 'Test User');
        await page.fill('#customer-email', 'test@example.com');
        await page.fill('#customer-phone', '555-1234');
        console.log('✓ Filled contact information');

        // Fill billing address
        await page.fill('#billing-address', '123 Test St');
        await page.fill('#billing-city', 'Test City');
        await page.selectOption('#billing-state', 'CA');
        await page.fill('#billing-zip', '12345');
        console.log('✓ Filled billing address');

        // Check agreement checkbox
        await page.check('#service-agreement');
        console.log('✓ Checked service agreement');

        // Check if Complete Order button is enabled
        await page.waitForTimeout(1000); // Wait for validation
        const isDisabled = await page.$eval('#submit-order', el => el.disabled);

        if (isDisabled) {
            console.log('✗ Complete Order button is still disabled');
            console.log('Checking which validation might be failing...');

            // Check if service interval section is visible
            const intervalVisible = await page.$eval('#service-interval-section', el => el.style.display !== 'none');
            console.log(`Service interval section visible: ${intervalVisible}`);

            // Check selectedServiceInterval in console
            const intervalValue = await page.evaluate(() => window.selectedServiceInterval);
            console.log(`selectedServiceInterval value: ${intervalValue}`);
        } else {
            console.log('✓ Complete Order button is enabled!');
        }

        await page.screenshot({ path: 'item-recovery-checkout.png', fullPage: true });
        console.log('Screenshot saved as item-recovery-checkout.png');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testItemRecoveryCheckout().catch(console.error);