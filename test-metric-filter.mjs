import { chromium } from 'playwright';

async function testMetricFilter() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('🧪 Testing Standard/Metric Filter\n');

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

        // Wait for service buttons
        await page.waitForSelector('.simple-service-btn', { timeout: 5000 });

        // Click Anodes Only service
        const anodesBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Anodes Only' });
        await anodesBtn.click();

        // Wait for anode picker to load
        await page.waitForTimeout(1500);
        await page.waitForSelector('.anode-item', { timeout: 5000 });

        // Click Shaft category
        const shaftBtn = await page.locator('.category-btn').filter({ hasText: 'Shaft' }).first();
        await shaftBtn.click();
        await page.waitForTimeout(500);

        // Count initial shaft anodes
        const allShaftAnodes = await page.locator('.anode-item:visible').all();
        console.log(`Total shaft anodes (no filter): ${allShaftAnodes.length}`);

        // Test Standard filter
        console.log('\n🔧 Testing STANDARD filter:');
        const standardBtn = await page.locator('.subfilter-btn').filter({ hasText: 'Standard' });
        await standardBtn.click();
        await page.waitForTimeout(500);

        const standardAnodes = await page.locator('.anode-item:visible').all();
        console.log(`  Anodes visible with Standard filter: ${standardAnodes.length}`);

        // Check some standard anodes
        if (standardAnodes.length > 0) {
            console.log('  Sample Standard anodes:');
            for (let i = 0; i < Math.min(3, standardAnodes.length); i++) {
                const nameEl = await standardAnodes[i].locator('.anode-name').first();
                const sizeEl = await standardAnodes[i].locator('.anode-size').first();
                const name = await nameEl.textContent();
                const size = await sizeEl.textContent();
                const hasInch = size.includes('"') || size.includes('inch');
                const hasMm = size.includes('mm');
                console.log(`    - "${name}" - Size: "${size}" ${hasInch ? '✅ Inch' : hasMm ? '❌ Has mm' : '⚠️ No unit'}`);
            }
        }

        // Test Metric filter
        console.log('\n📏 Testing METRIC filter:');
        const metricBtn = await page.locator('.subfilter-btn').filter({ hasText: 'Metric' });
        await metricBtn.click();
        await page.waitForTimeout(500);

        const metricAnodes = await page.locator('.anode-item:visible').all();
        console.log(`  Anodes visible with Metric filter: ${metricAnodes.length}`);

        // Check some metric anodes
        if (metricAnodes.length > 0) {
            console.log('  Sample Metric anodes:');
            for (let i = 0; i < Math.min(3, metricAnodes.length); i++) {
                const nameEl = await metricAnodes[i].locator('.anode-name').first();
                const sizeEl = await metricAnodes[i].locator('.anode-size').first();
                const name = await nameEl.textContent();
                const size = await sizeEl.textContent();
                const hasMm = size.includes('mm') || size.includes('metric');
                const hasInch = size.includes('"') && !size.includes('mm');
                console.log(`    - "${name}" - Size: "${size}" ${hasMm ? '✅ Metric' : hasInch ? '❌ Has inch' : '⚠️ No unit'}`);
            }
        }

        // Clear filter (click All)
        console.log('\n🔄 Testing ALL filter (clear):');
        const allBtn = await page.locator('.subfilter-btn').filter({ hasText: 'All' });
        await allBtn.click();
        await page.waitForTimeout(500);

        const allAnodesAfter = await page.locator('.anode-item:visible').all();
        console.log(`  Anodes visible with All filter: ${allAnodesAfter.length}`);

        // Summary
        console.log('\n📊 Filter Summary:');
        console.log(`  Total shaft anodes: ${allShaftAnodes.length}`);
        console.log(`  Standard only: ${standardAnodes.length}`);
        console.log(`  Metric only: ${metricAnodes.length}`);
        console.log(`  Standard + Metric: ${standardAnodes.length + metricAnodes.length}`);

        const filterWorking = (standardAnodes.length + metricAnodes.length) <= allShaftAnodes.length &&
                            standardAnodes.length < allShaftAnodes.length &&
                            metricAnodes.length < allShaftAnodes.length;

        console.log(`\n  Filter working correctly: ${filterWorking ? '✅ YES' : '❌ NO'}`);

        if (!filterWorking) {
            console.log('  ⚠️ Filter may not be filtering anodes properly');
        }

        // Take screenshot
        await page.screenshot({
            path: 'metric-filter-test.png',
            fullPage: false
        });

        await context.close();
        console.log('\n✨ Standard/Metric filter test complete!');

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
    await testMetricFilter();
    server.kill();
    process.exit(0);
}, 2000);