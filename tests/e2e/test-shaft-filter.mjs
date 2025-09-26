import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Shaft Anode Standard/Metric Filter');
console.log('=============================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Zinc Anodes Only service
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    // Click Shaft category
    console.log('📍 Clicking Shaft category...');
    const shaftBtn = await page.$('button.category-btn:has-text("Shaft")');
    if (shaftBtn) {
        await shaftBtn.click();
        await page.waitForTimeout(1000);

        // Check if subfilter appeared
        const subfilter = await page.$('#shaftSubfilter');
        const isVisible = await subfilter?.isVisible();
        console.log(`  Subfilter visible: ${isVisible ? '✅' : '❌'}`);

        if (isVisible) {
            // Test All Shaft (default)
            const allShaftAnodes = await page.$$('.anode-item');
            console.log(`\n📊 All Shaft anodes: ${allShaftAnodes.length}`);

            // Click Standard filter
            const standardBtn = await page.$('button.subfilter-btn:has-text("Standard")');
            if (standardBtn) {
                await standardBtn.click();
                await page.waitForTimeout(1000);
                const standardAnodes = await page.$$('.anode-item');
                console.log(`📊 Standard (Imperial) anodes: ${standardAnodes.length}`);

                // Sample first standard anode
                if (standardAnodes.length > 0) {
                    const firstName = await standardAnodes[0].$eval('.anode-name', el => el.textContent);
                    console.log(`  Sample: ${firstName}`);
                }
            }

            // Click Metric filter
            const metricBtn = await page.$('button.subfilter-btn:has-text("Metric")');
            if (metricBtn) {
                await metricBtn.click();
                await page.waitForTimeout(1000);
                const metricAnodes = await page.$$('.anode-item');
                console.log(`📊 Metric anodes: ${metricAnodes.length}`);

                // Sample first metric anode
                if (metricAnodes.length > 0) {
                    const firstName = await metricAnodes[0].$eval('.anode-name', el => el.textContent);
                    console.log(`  Sample: ${firstName}`);
                }
            }

            // Test that other categories hide the subfilter
            console.log('\n📍 Testing subfilter hiding...');
            const hullBtn = await page.$('button.category-btn:has-text("Hull")');
            if (hullBtn) {
                await hullBtn.click();
                await page.waitForTimeout(500);
                const subfilterHidden = await subfilter.isHidden();
                console.log(`  Hull category - Subfilter hidden: ${subfilterHidden ? '✅' : '❌'}`);
            }

            // Back to Shaft to test again
            await shaftBtn.click();
            await page.waitForTimeout(500);
            const subfilterBackVisible = await subfilter.isVisible();
            console.log(`  Back to Shaft - Subfilter visible: ${subfilterBackVisible ? '✅' : '❌'}`);

            // Test search within filtered results
            console.log('\n🔍 Testing search with filter...');
            const searchInput = await page.$('#anodeSearch');
            if (searchInput) {
                // Click Metric filter first
                const metricBtn2 = await page.$('button.subfilter-btn:has-text("Metric")');
                if (metricBtn2) {
                    await metricBtn2.click();
                    await page.waitForTimeout(500);

                    // Search for "30mm"
                    await searchInput.fill('30mm');
                    await page.waitForTimeout(1000);
                    const searchResults = await page.$$('.anode-item');
                    console.log(`  Search "30mm" in Metric: ${searchResults.length} results`);

                    // Clear search
                    await searchInput.fill('');
                    await page.waitForTimeout(500);
                }
            }
        }
    }
}

console.log('\n✨ Shaft filter test complete!');
await page.screenshot({ path: 'shaft-filter-test.png', fullPage: false });
console.log('📸 Screenshot saved as shaft-filter-test.png');

await browser.close();