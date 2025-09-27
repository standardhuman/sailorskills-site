import { chromium } from 'playwright';

async function testSimple() {
    const browser = await chromium.launch({
        headless: false,
        devtools: true
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Log any page errors
        page.on('pageerror', error => {
            console.error('PAGE ERROR:', error.message);
            console.error('Stack:', error.stack);
        });

        // Capture console messages
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Console error:', msg.text());
            }
        });

        console.log('Opening admin page...');
        await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });

        console.log('Waiting for 5 seconds...');
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        await browser.close();
        console.log('Test completed');
    }
}

testSimple();