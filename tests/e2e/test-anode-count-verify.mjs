import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Verifying Anode Counts in UI');
console.log('================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Zinc Anodes Only service to open anode picker
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    console.log('📊 Anode Counts by Category:\n');

    // Test ALL anodes first
    const allBtn = await page.$('button.category-btn:has-text("All")');
    if (allBtn) {
        await allBtn.click();
        await page.waitForTimeout(1000);
        const allAnodes = await page.$$('.anode-item');
        console.log(`ALL anodes: ${allAnodes.length}`);

        // Sample some anode names
        if (allAnodes.length > 0) {
            const firstAnodeName = await allAnodes[0].$eval('.anode-name', el => el.textContent);
            const lastAnodeName = await allAnodes[allAnodes.length - 1].$eval('.anode-name', el => el.textContent);
            console.log(`  First: ${firstAnodeName}`);
            console.log(`  Last: ${lastAnodeName}`);
        }
    }

    console.log('');

    // Test each category
    const categories = [
        { button: 'Shaft', name: 'Shaft' },
        { button: 'Propeller', name: 'Propeller' },
        { button: 'Hull', name: 'Hull' },
        { button: 'Engine', name: 'Engine/Outboard' }
    ];

    for (const cat of categories) {
        const catBtn = await page.$(`button.category-btn:has-text("${cat.button}")`);
        if (catBtn) {
            await catBtn.click();
            await page.waitForTimeout(1000);
            const catAnodes = await page.$$('.anode-item');
            console.log(`${cat.name}: ${catAnodes.length} anodes`);

            // Show first item in each category
            if (catAnodes.length > 0) {
                const firstName = await catAnodes[0].$eval('.anode-name', el => el.textContent);
                console.log(`  Sample: ${firstName}`);
            }
        }
    }

    // Test search functionality
    console.log('\n🔍 Search Test:');
    const searchInput = await page.$('#anodeSearch');
    if (searchInput) {
        // Clear and search for "X-3"
        await searchInput.fill('X-3');
        await page.waitForTimeout(1000);
        const searchResults = await page.$$('.anode-item');
        console.log(`Search "X-3": ${searchResults.length} results`);

        // List all results
        for (let i = 0; i < searchResults.length && i < 5; i++) {
            const name = await searchResults[i].$eval('.anode-name', el => el.textContent);
            const price = await searchResults[i].$eval('.anode-price', el => el.textContent);
            console.log(`  - ${name} (${price})`);
        }
    }

    // Check grid responsiveness
    console.log('\n📐 Grid Layout Check:');
    const anodeGrid = await page.$('#anodeGrid');
    if (anodeGrid) {
        const gridInfo = await anodeGrid.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                display: computed.display,
                columns: computed.gridTemplateColumns,
                height: el.scrollHeight,
                visibleHeight: el.clientHeight,
                scrollable: el.scrollHeight > el.clientHeight
            };
        });
        console.log(`  Display: ${gridInfo.display}`);
        console.log(`  Scrollable: ${gridInfo.scrollable ? 'Yes' : 'No'}`);
        console.log(`  Total height: ${gridInfo.height}px`);
        console.log(`  Visible height: ${gridInfo.visibleHeight}px`);
    }
}

console.log('\n✨ Verification complete!');
await page.screenshot({ path: 'anode-count-verify.png', fullPage: false });
console.log('📸 Screenshot saved as anode-count-verify.png');

await browser.close();