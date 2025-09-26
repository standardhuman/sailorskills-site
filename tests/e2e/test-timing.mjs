import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing when real updateChargeSummary loads...\n');

await page.goto('http://localhost:3000/admin');

// Check function status at different intervals
for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500);

    const status = await page.evaluate(() => {
        const func = window.updateChargeSummary?.toString() || 'not defined';
        const isStub = func.includes('stub called');
        return {
            isStub,
            length: func.length
        };
    });

    console.log(`After ${(i + 1) * 0.5}s: ${status.isStub ? 'Still stub' : 'Real function loaded!'} (${status.length} chars)`);

    if (!status.isStub) {
        console.log('\nReal function loaded!');
        break;
    }
}

// Now test the workflow
console.log('\n2. Selecting service...');
await page.locator('button:has-text("Recurring Cleaning")').first().click();
await page.waitForTimeout(1000);

const buttonState = await page.evaluate(() => ({
    disabled: document.getElementById('chargeButton')?.disabled,
    currentServiceKey: window.currentServiceKey
}));

console.log(`   Service key: ${buttonState.currentServiceKey}`);
console.log(`   Button disabled: ${buttonState.disabled}`);

// If button is still disabled, manually call updateChargeSummary
if (buttonState.disabled) {
    console.log('\n3. Manually calling updateChargeSummary...');
    await page.evaluate(() => {
        if (window.updateChargeSummary) {
            window.updateChargeSummary();
        }
    });

    await page.waitForTimeout(500);

    const afterUpdate = await page.evaluate(() => ({
        disabled: document.getElementById('chargeButton')?.disabled
    }));

    console.log(`   Button disabled after manual call: ${afterUpdate.disabled}`);
}

await browser.close();