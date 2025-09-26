import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture console messages
page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Module script error') || text.includes('Error stack')) {
        console.log('[CONSOLE]', text);
    }
});

console.log('Looking for module script errors...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(3000);

await browser.close();
EOF && node test-catch-error.mjs