import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newContext().then(ctx => ctx.newPage());

console.log('Testing service button layout...');
await page.goto('http://localhost:3000/diving');
await page.waitForTimeout(2000);

// Get service names
const serviceNames = await page.$$eval('.service-name', elements => 
    elements.map(el => el.textContent)
);

console.log('Service buttons in order:');
serviceNames.forEach((name, i) => {
    console.log(`  ${i+1}. ${name}`);
});

// Check for full-width services
const fullWidthCount = await page.$$eval('.service-option.full-width-service', els => els.length);
const cleaningCount = await page.$$eval('.service-option.cleaning-service', els => els.length);

console.log(`\nFull-width services: ${fullWidthCount}`);
console.log(`Cleaning services: ${cleaningCount}`);

await page.screenshot({ path: 'diving-layout.png' });
console.log('\nScreenshot saved as diving-layout.png');

await browser.close();
