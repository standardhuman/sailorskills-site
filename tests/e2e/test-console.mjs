import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.on('console', msg => {
    console.log('[console]', msg.text());
});

page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
});

console.log('Loading page and watching console...
');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(5000);

await browser.close();
