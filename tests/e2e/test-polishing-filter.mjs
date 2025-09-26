import { chromium } from 'playwright';

async function testPolishingFilter() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('🧪 Testing Polishing Strip Filter\n');

        // Test on iPhone 16 Pro Max
        const context = await browser.newContext({
            viewport: { width: 430, height: 932 },
            deviceScaleFactor: 3,
            hasTouch: true,
            isMobile: true
        });

        const page = await context.newPage();

        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        console.log('📱 Testing on iPhone 16 Pro Max (430x932)\n');

        // Wait for service buttons to load
        await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

        // Click Anodes Only service to open anode picker
        const anodesBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Anodes Only' });
        await anodesBtn.click();

        // Wait for anode grid to load
        await page.waitForTimeout(1500);
        await page.waitForSelector('.anode-item', { timeout: 5000 });

        // Check all anodes for polishing strips
        const anodeItems = await page.locator('.anode-item').all();
        console.log(`Total anodes displayed: ${anodeItems.length}`);

        let polishingStripsFound = 0;
        const polishingStripNames = [];

        for (const item of anodeItems) {
            const nameElement = await item.locator('.anode-name').first();
            const name = await nameElement.textContent();

            if (name.toLowerCase().includes('polishing') || name.toLowerCase().includes('strip')) {
                polishingStripsFound++;
                polishingStripNames.push(name);
            }
        }

        console.log(`\nPolishing strips found: ${polishingStripsFound}`);
        if (polishingStripsFound > 0) {
            console.log('❌ Polishing strips still visible:');
            polishingStripNames.forEach(name => {
                console.log(`  - "${name}"`);
            });
        } else {
            console.log('✅ No polishing strips found');
        }

        // Test search to make sure filter still works with search
        const searchInput = await page.locator('#anodeSearch');
        await searchInput.fill('shaft');
        await page.waitForTimeout(500);

        const searchResults = await page.locator('.anode-item:visible').all();
        console.log(`\nSearch results for "shaft": ${searchResults.length} items`);

        let polishingInSearch = 0;
        for (const item of searchResults) {
            const nameElement = await item.locator('.anode-name').first();
            const name = await nameElement.textContent();

            if (name.toLowerCase().includes('polishing') || name.toLowerCase().includes('strip')) {
                polishingInSearch++;
                console.log(`  ❌ Found in search: "${name}"`);
            }
        }

        if (polishingInSearch === 0) {
            console.log('  ✅ No polishing strips in search results');
        }

        // Check shaft category specifically
        await searchInput.clear();
        const shaftBtn = await page.locator('.category-btn').filter({ hasText: 'Shaft' }).first();
        await shaftBtn.click();
        await page.waitForTimeout(500);

        const shaftAnodes = await page.locator('.anode-item:visible').all();
        console.log(`\nShaft category: ${shaftAnodes.length} items`);

        let polishingInShaft = 0;
        for (const item of shaftAnodes) {
            const nameElement = await item.locator('.anode-name').first();
            const name = await nameElement.textContent();

            if (name.toLowerCase().includes('polishing') || name.toLowerCase().includes('strip')) {
                polishingInShaft++;
                console.log(`  ❌ Found in shaft category: "${name}"`);
            }
        }

        if (polishingInShaft === 0) {
            console.log('  ✅ No polishing strips in shaft category');
        }

        // Take screenshot
        await page.screenshot({
            path: 'polishing-filter-test.png',
            fullPage: false
        });

        await context.close();
        console.log('\n✨ Polishing strip filter test complete!');

    } catch (error) {
        console.error('❌ Test Error:', error);
    } finally {
        await browser.close();
    }
}

// Start server and run test
import { spawn } from 'child_process';

const server = spawn('python3', ['-m', 'http.server', '8082'], {
    detached: false,
    stdio: 'ignore'
});

setTimeout(async () => {
    await testPolishingFilter();
    server.kill();
    process.exit(0);
}, 2000);