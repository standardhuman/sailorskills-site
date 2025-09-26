import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('🔍 Checking 404 Errors on Vercel');
console.log('=====================================\n');

const url = 'https://cost-calculator-km9i0l3es-brians-projects-bc2d3592.vercel.app';

// Track failed requests
const failedRequests = [];

page.on('requestfailed', request => {
    failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText
    });
});

page.on('response', response => {
    if (response.status() >= 400) {
        console.log(`❌ ${response.status()}: ${response.url()}`);
    }
});

// Test admin page
console.log('Loading admin page and monitoring network...\n');
await page.goto(`${url}/admin`, { waitUntil: 'networkidle' });

console.log('\nFailed Requests:');
failedRequests.forEach(req => {
    console.log(`  - ${req.url}`);
    console.log(`    Error: ${req.failure}`);
});

// Check if script.js is loading
const scriptResponse = await page.evaluate(async () => {
    try {
        const response = await fetch('/script.js');
        return {
            status: response.status,
            type: response.headers.get('content-type')
        };
    } catch (e) {
        return { error: e.message };
    }
});

console.log('\n/script.js status:', scriptResponse);

// Check if admin.js is loading
const adminResponse = await page.evaluate(async () => {
    try {
        const response = await fetch('/admin.js');
        return {
            status: response.status,
            type: response.headers.get('content-type')
        };
    } catch (e) {
        return { error: e.message };
    }
});

console.log('/admin.js status:', adminResponse);

// Check window.serviceData
const serviceData = await page.evaluate(() => {
    return typeof window.serviceData !== 'undefined';
});

console.log('\nwindow.serviceData exists:', serviceData);

// Check window.adminApp
const adminApp = await page.evaluate(() => {
    return typeof window.adminApp !== 'undefined';
});

console.log('window.adminApp exists:', adminApp);

await browser.close();