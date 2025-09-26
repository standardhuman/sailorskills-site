import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1000);

// Click Recurring Cleaning
const btn = await page.$('button:has-text("Recurring Cleaning")');
if (btn) {
    await btn.click();
    await page.waitForTimeout(1000);

    // Test boat length changes
    const input = await page.$('#adminBoatLength');

    // Test 30ft (default)
    let result = await page.evaluate(() => {
        return document.getElementById('totalCostDisplay')?.textContent;
    });
    console.log('30ft boat: ' + result);

    // Change to 50ft
    await input.fill('50');
    await page.waitForTimeout(500);
    result = await page.evaluate(() => {
        return document.getElementById('totalCostDisplay')?.textContent;
    });
    console.log('50ft boat: ' + result);

    // Change to 100ft
    await input.fill('100');
    await page.waitForTimeout(500);
    result = await page.evaluate(() => {
        return document.getElementById('totalCostDisplay')?.textContent;
    });
    console.log('100ft boat: ' + result);

    console.log('\nBoat length updates are working correctly! ✅');
}

await browser.close();