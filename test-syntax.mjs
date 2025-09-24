import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture all errors with stack traces
page.on('pageerror', error => {
    console.log('\nPage Error:', error.message);
    console.log('Stack:', error.stack);
});

console.log('Checking for syntax errors with stack traces...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(2000);

// Try to evaluate the module script block
const scriptInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
    return scripts.map((script, index) => {
        const content = script.innerHTML;
        const lines = content.split('\n');
        return {
            index,
            totalLines: lines.length,
            firstLine: lines[0]?.trim().substring(0, 50),
            hasTryCatch: content.includes('try {') && content.includes('} catch')
        };
    });
});

console.log('Module scripts found:', scriptInfo.length);
scriptInfo.forEach(info => {
    console.log(`  Script ${info.index}: ${info.totalLines} lines`);
    console.log(`    First line: ${info.firstLine}`);
    console.log(`    Has try-catch: ${info.hasTryCatch}`);
});

await browser.close();