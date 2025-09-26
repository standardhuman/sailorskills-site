import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture console messages
page.on('console', msg => {
    if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
    } else if (msg.text().includes('updateAnodeQuantity')) {
        console.log('📍 Console:', msg.text());
    }
});

// Capture page errors
page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
});

console.log('🔍 Debugging Anode Button Clicks');
console.log('=================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Zinc Anodes Only service
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    // Get first anode item
    const firstAnode = await page.$('.anode-item');
    if (firstAnode) {
        const anodeName = await firstAnode.$eval('.anode-name', el => el.textContent);
        console.log(`Testing with: ${anodeName}\n`);

        // Click + button and check console
        console.log('Clicking + button...');
        const plusBtn = await firstAnode.$('.anode-controls button:last-child');
        await plusBtn.click();
        await page.waitForTimeout(1000);

        // Check what happened
        const quantity = await firstAnode.$eval('.anode-controls .quantity', el => el.textContent);
        console.log(`Quantity after click: ${quantity}\n`);

        // Try executing directly in page context
        console.log('Testing direct function call:');
        const result = await page.evaluate(() => {
            if (typeof adminApp !== 'undefined' && adminApp.updateAnodeQuantity) {
                adminApp.updateAnodeQuantity('test-sku', 1, 10.99, 'Test Anode');
                return {
                    success: true,
                    selectedAnodes: adminApp.selectedAnodes
                };
            } else {
                return {
                    success: false,
                    error: 'adminApp or updateAnodeQuantity not found'
                };
            }
        });
        console.log('Direct call result:', JSON.stringify(result, null, 2));
    }
}

console.log('\n✨ Debug test complete!');
await browser.close();