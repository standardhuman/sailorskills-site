import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Debugging Quote Flow');
console.log('========================\n');

await page.goto('http://localhost:3000/admin-new.html');
await page.waitForTimeout(1500);

// Click service
console.log('Clicking Recurring Cleaning...');
await page.click('button:has-text("Recurring Cleaning")');
await page.waitForTimeout(2000);

// Check what's visible
const wizardVisible = await page.isVisible('#wizardContainer');
console.log('Wizard container visible:', wizardVisible);

// Check for input fields
const inputs = await page.$$eval('input:visible', elements =>
    elements.map(el => ({
        type: el.type,
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        value: el.value
    }))
);

console.log('\nVisible input fields:');
inputs.forEach(input => {
    console.log(`  - ${input.type} [id="${input.id}", name="${input.name}", placeholder="${input.placeholder}"]`);
});

// Check for wizard content
const wizardContent = await page.$eval('#wizardContent', el => el.innerHTML.substring(0, 500));
console.log('\nWizard content (first 500 chars):');
console.log(wizardContent);

console.log('\n✨ Debug complete!');
await page.screenshot({ path: 'quote-debug.png', fullPage: true });
console.log('📸 Screenshot saved as quote-debug.png');

await page.waitForTimeout(3000);
await browser.close();