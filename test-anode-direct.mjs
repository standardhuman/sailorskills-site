import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Direct Test of Anode Selection System');
console.log('========================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Test clicking Anodes Only service
console.log('📍 Clicking "Zinc Anodes Only" service...');
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    // Check what's visible
    const wizardContent = await page.$('#wizardContent');
    if (wizardContent) {
        const content = await wizardContent.textContent();
        console.log('\n📋 Wizard content preview:');
        console.log(content.substring(0, 200) + '...');

        // Look for specific elements
        const elements = {
            'Search input': await page.$('#anodeSearch'),
            'Category buttons': await page.$$('.category-btn'),
            'Anode grid': await page.$('#anodeGrid'),
            'Selected count': await page.$('#selectedCount'),
            'Back button': await page.$('button:has-text("Back to Services")')
        };

        console.log('\n🔎 Element check:');
        for (const [name, element] of Object.entries(elements)) {
            if (Array.isArray(element)) {
                console.log(`  ${element.length > 0 ? '✅' : '❌'} ${name}: ${element.length} found`);
            } else {
                console.log(`  ${element ? '✅' : '❌'} ${name}`);
            }
        }

        // Check if anodes loaded
        const anodeGrid = await page.$('#anodeGrid');
        if (anodeGrid) {
            const gridContent = await anodeGrid.textContent();
            if (gridContent.includes('Failed')) {
                console.log('\n⚠️  Anode loading error:', gridContent);
            } else {
                const anodeItems = await page.$$('.anode-item');
                console.log(`\n📦 Anodes loaded: ${anodeItems.length} items`);

                if (anodeItems.length > 0) {
                    // Try to add an anode
                    const plusBtn = await page.$('.anode-controls button:last-child');
                    if (plusBtn) {
                        await plusBtn.click();
                        await page.waitForTimeout(500);
                        const count = await page.$eval('#selectedCount', el => el.textContent);
                        console.log(`✅ Successfully selected ${count} anode(s)`);
                    }
                }
            }
        }
    }
}

console.log('\n✨ Direct test complete!');
await page.screenshot({ path: 'anode-direct-test.png', fullPage: true });
console.log('📸 Screenshot saved as anode-direct-test.png');

await browser.close();