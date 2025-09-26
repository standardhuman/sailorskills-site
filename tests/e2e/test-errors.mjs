import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture all console messages
const consoleMessages = [];
page.on('console', msg => {
    consoleMessages.push({
        type: msg.type(),
        text: msg.text()
    });
});

// Capture page errors
const pageErrors = [];
page.on('pageerror', error => {
    pageErrors.push(error.toString());
});

console.log('Checking for JavaScript errors...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(3000);

console.log('Console messages:');
consoleMessages.forEach(msg => {
    if (msg.type === 'error' || msg.text.includes('error') || msg.text.includes('Error')) {
        console.log(`  [${msg.type.toUpperCase()}] ${msg.text}`);
    }
});

console.log('\nPage errors:');
pageErrors.forEach(error => {
    console.log(`  ${error}`);
});

// Check if module script executed
const moduleStatus = await page.evaluate(() => {
    return {
        hasRealFunction: !window.updateChargeSummary?.toString().includes('stub'),
        moduleScriptExecuted: window.MODULE_SCRIPT_EXECUTED || false
    };
});

console.log('\nModule script status:');
console.log(`  Real function loaded: ${moduleStatus.hasRealFunction}`);
console.log(`  Module marker present: ${moduleStatus.moduleScriptExecuted}`);

await browser.close();