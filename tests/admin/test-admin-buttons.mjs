import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture console messages
page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
});

// Capture page errors
page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
});

console.log('🔍 Testing Admin Service Buttons');
console.log('=================================\n');

await page.goto('http://localhost:3000/admin-new.html');
await page.waitForTimeout(2000);

// Check if buttons are present
const buttonCount = await page.locator('.simple-service-btn').count();
console.log(`\nService buttons found: ${buttonCount}`);

if (buttonCount > 0) {
    const buttons = await page.$$eval('.simple-service-btn', btns =>
        btns.map(btn => btn.textContent)
    );
    console.log('Button labels:', buttons);
} else {
    console.log('No buttons found!');

    // Check container
    const container = await page.$('#simpleServiceButtons');
    if (container) {
        const html = await container.innerHTML();
        console.log('Container HTML:', html || '(empty)');
    } else {
        console.log('Container not found!');
    }
}

// Check if serviceData is available
const hasServiceData = await page.evaluate(() => {
    return typeof window.serviceData !== 'undefined';
});
console.log('\nwindow.serviceData exists:', hasServiceData);

if (hasServiceData) {
    const serviceKeys = await page.evaluate(() => {
        return Object.keys(window.serviceData);
    });
    console.log('Service keys:', serviceKeys);
}

console.log('\n✨ Test complete!');
await page.screenshot({ path: 'admin-buttons-test.png' });
console.log('📸 Screenshot saved as admin-buttons-test.png');

await browser.close();