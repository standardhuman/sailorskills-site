import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newContext().then(ctx => ctx.newPage());

console.log('Testing Recurring Cleaning button placement:\n');
await page.goto('http://localhost:3000/diving');
await page.waitForTimeout(1500);

// Click recurring cleaning
await page.click('div[data-service-key="recurring_cleaning"]');
console.log('1. Clicked Recurring Cleaning');
await page.waitForTimeout(1500);

// Check visible buttons
const visibleButtons = await page.$$eval('button:visible, .submit-button:visible', buttons => 
    buttons.filter(btn => {
        const styles = window.getComputedStyle(btn);
        return styles.display !== 'none' && styles.visibility !== 'hidden';
    }).map(btn => ({
        text: btn.textContent.trim(),
        id: btn.id || 'no-id',
        className: btn.className
    }))
);

console.log('Visible buttons after selecting service:');
visibleButtons.forEach(btn => {
    console.log(`  - "${btn.text}" (id: ${btn.id})`);
});

// Check what step is shown
const currentStep = await page.$eval('.form-step[style*="block"]', el => el.querySelector('h2')?.textContent);
console.log('\nCurrent step heading:', currentStep);

// Check if there's a proceed to checkout button visible
const checkoutBtnVisible = await page.$('#checkout-button:visible') !== null;
console.log('Proceed to Checkout button visible:', checkoutBtnVisible);

await page.screenshot({ path: 'recurring-after-selection.png' });
console.log('\nScreenshot saved as recurring-after-selection.png');

await browser.close();
