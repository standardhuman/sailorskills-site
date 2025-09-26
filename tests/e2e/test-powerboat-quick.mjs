import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1000);

// Click Recurring Cleaning
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    // Just check powerboat
    const powerboatCheckbox = await page.$('#adminPowerboat');
    await powerboatCheckbox?.click();
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
        const price = document.getElementById('totalCostDisplay')?.textContent;
        const details = document.getElementById('chargeDetails')?.innerText || '';
        return {
            price,
            details: details.substring(0, 500)
        };
    });

    console.log('Powerboat only test:');
    console.log('Price:', result.price, '(Expected: $168.75)');
    console.log('\nCharge details:');
    console.log(result.details);
}

await browser.close();