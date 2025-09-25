import { chromium } from 'playwright';

async function testAdminImprovements() {
    const browser = await chromium.launch({ headless: false });

    try {
        console.log('🧪 Testing Admin Page Improvements\n');

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

        // Test 1: Enhanced Auto-Scroll
        console.log('1️⃣ Testing Enhanced Auto-Scroll:');

        // Get service buttons position
        const buttonsBox = await page.locator('.simple-service-buttons').boundingBox();
        const buttonBottom = buttonsBox ? buttonsBox.y + buttonsBox.height : 0;

        // Click underwater inspection to trigger scroll
        const inspectionBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Underwater Inspection' });
        await inspectionBtn.click();

        // Wait for scroll animation
        await page.waitForTimeout(1500);

        // Check if buttons are off screen
        const scrollPosition = await page.evaluate(() => window.pageYOffset);
        const viewportHeight = await page.evaluate(() => window.innerHeight);

        const buttonsOffScreen = scrollPosition > buttonBottom;
        console.log(`  Service buttons off screen: ${buttonsOffScreen ? '✅ Yes' : '❌ No'}`);
        console.log(`  Scroll position: ${scrollPosition}px (buttons end at ${buttonBottom}px)`);

        // Check if form is visible
        const wizardVisible = await page.locator('#wizardContainer').isVisible();
        console.log(`  Service form visible: ${wizardVisible ? '✅ Yes' : '❌ No'}`);

        // Go back
        const backBtn = await page.locator('button').filter({ hasText: 'Back' }).first();
        if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(500);
        }

        // Test 2: Anode Picker Improvements
        console.log('\n2️⃣ Testing Anode Picker:');

        // Click Anodes Only service
        const anodesBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Anodes Only' });
        await anodesBtn.click();
        await page.waitForTimeout(1500);

        // Check if material filters are visible
        const materialFilter = await page.locator('.material-filter').isVisible();
        console.log(`  Material filters visible: ${materialFilter ? '✅ Yes' : '❌ No'}`);

        // Check if shaft category shows subfilters
        const shaftBtn = await page.locator('.category-btn').filter({ hasText: 'Shaft' }).first();
        await shaftBtn.click();
        await page.waitForTimeout(300);

        const shaftSubfilter = await page.locator('#shaftSubfilter').isVisible();
        console.log(`  Shaft subfilters visible: ${shaftSubfilter ? '✅ Yes' : '❌ No'}`);

        // Check anode grid layout
        const anodeItems = await page.locator('.anode-item.compact').all();
        console.log(`  Anode items found: ${anodeItems.length}`);

        if (anodeItems.length > 0) {
            // Check if simplified names are working
            const firstAnodeName = await anodeItems[0].locator('.anode-name').textContent();
            const hasNoModel = !firstAnodeName.includes('X-') && !firstAnodeName.includes('Camp') && !firstAnodeName.includes('Martyr');
            console.log(`  Simplified names (no brand/model): ${hasNoModel ? '✅ Yes' : '❌ No'}`);
            console.log(`    Example: "${firstAnodeName}"`);

            // Check grid columns on mobile
            const gridEl = await page.locator('.anode-grid').first();
            const gridStyles = await gridEl.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.gridTemplateColumns;
            });
            const is2Columns = gridStyles.includes('1fr 1fr') || gridStyles.includes('repeat(2');
            console.log(`  2-column grid on mobile: ${is2Columns ? '✅ Yes' : '❌ No'}`);

            // Check compact sizing
            const itemHeight = await anodeItems[0].boundingBox();
            if (itemHeight) {
                console.log(`  Anode item height: ${itemHeight.height}px ${itemHeight.height < 80 ? '✅ Compact' : '⚠️ Could be smaller'}`);
            }

            // Count visible items in viewport
            const viewportHeight = 932;
            const gridBox = await gridEl.boundingBox();
            if (gridBox) {
                const visibleHeight = Math.min(gridBox.height, 350); // max-height is 350px
                const itemsPerRow = 2;
                const estimatedItemHeight = itemHeight ? itemHeight.height : 60;
                const rowsVisible = Math.floor(visibleHeight / estimatedItemHeight);
                const itemsVisible = rowsVisible * itemsPerRow;
                console.log(`  Items visible at once: ~${itemsVisible} ${itemsVisible >= 4 ? '✅' : '⚠️'}`);
            }
        }

        // Test material filter
        const zincBtn = await page.locator('.material-btn').filter({ hasText: 'Zinc' });
        if (await zincBtn.isVisible()) {
            await zincBtn.click();
            await page.waitForTimeout(300);
            const hasActiveClass = await zincBtn.evaluate(el => el.classList.contains('active'));
            console.log(`  Material filter works: ${hasActiveClass ? '✅ Yes' : '❌ No'}`);
        }

        // Test metric/standard filter
        const metricBtn = await page.locator('.subfilter-btn').filter({ hasText: 'Metric' });
        if (await metricBtn.isVisible()) {
            await metricBtn.click();
            await page.waitForTimeout(300);
            const hasActiveClass = await metricBtn.evaluate(el => el.classList.contains('active'));
            console.log(`  Metric filter works: ${hasActiveClass ? '✅ Yes' : '❌ No'}`);
        }

        // Take screenshot
        await page.screenshot({
            path: 'admin-improvements-mobile.png',
            fullPage: false
        });

        // Test on desktop
        console.log('\n💻 Testing on Desktop (1280x800):');
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(500);

        const desktopAnodeItems = await page.locator('.anode-item.compact').all();
        if (desktopAnodeItems.length > 0) {
            const gridEl = await page.locator('.anode-grid').first();
            const gridStyles = await gridEl.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.gridTemplateColumns;
            });
            console.log(`  Desktop grid layout: ${gridStyles.substring(0, 50)}...`);
        }

        await page.screenshot({
            path: 'admin-improvements-desktop.png',
            fullPage: false
        });

        await context.close();
        console.log('\n✨ Admin improvements test complete!');

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
    await testAdminImprovements();
    server.kill();
    process.exit(0);
}, 2000);