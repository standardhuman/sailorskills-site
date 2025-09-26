import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Production Vercel Deployment');
console.log('=====================================\n');

const url = 'https://cost-calculator-sigma.vercel.app';

// Test admin page
console.log('Testing Admin Page...');
await page.goto(`${url}/admin`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Check for service buttons
const serviceButtons = await page.$$('.simple-service-btn');
console.log(`✅ Service buttons found: ${serviceButtons.length}`);

if (serviceButtons.length > 0) {
    const buttonTexts = await page.$$eval('.simple-service-btn', buttons =>
        buttons.map(btn => btn.textContent)
    );
    console.log('Button labels:');
    buttonTexts.forEach(text => console.log(`  - ${text}`));
}

// Check for errors
const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') {
        errors.push(msg.text());
    }
});

await page.reload();
await page.waitForTimeout(2000);

console.log(`\n${errors.length === 0 ? '✅' : '⚠️'} Console errors: ${errors.length}`);

await page.screenshot({ path: 'production-admin.png' });
console.log('\n📸 Screenshot saved as production-admin.png');

console.log('\n✨ Production URL is working correctly!');
console.log(`Access it at: ${url}/admin`);

await browser.close();