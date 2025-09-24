import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Anode System Fixes');
console.log('==============================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Test 1: Anodes Only Service with Category Filtering
console.log('📍 Test 1: Anodes Only Service');
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    // Count total anodes
    const totalAnodes = await page.$$('.anode-item');
    console.log(`  ✅ Total anodes displayed: ${totalAnodes.length}`);

    // Test Shaft category
    const shaftBtn = await page.$('button:has-text("Shaft")');
    if (shaftBtn) {
        await shaftBtn.click();
        await page.waitForTimeout(1000);
        const shaftAnodes = await page.$$('.anode-item');
        console.log(`  ✅ Shaft anodes: ${shaftAnodes.length}`);
    }

    // Test Propeller category
    const propBtn = await page.$('button:has-text("Propeller")');
    if (propBtn) {
        await propBtn.click();
        await page.waitForTimeout(1000);
        const propAnodes = await page.$$('.anode-item');
        console.log(`  ✅ Propeller anodes: ${propAnodes.length}`);
    }

    // Test Hull category
    const hullBtn = await page.$('button:has-text("Hull")');
    if (hullBtn) {
        await hullBtn.click();
        await page.waitForTimeout(1000);
        const hullAnodes = await page.$$('.anode-item');
        console.log(`  ✅ Hull anodes: ${hullAnodes.length}`);
    }

    // Test Engine/Outboard category
    const engineBtn = await page.$('button:has-text("Engine")');
    if (engineBtn) {
        await engineBtn.click();
        await page.waitForTimeout(1000);
        const engineAnodes = await page.$$('.anode-item');
        console.log(`  ✅ Engine/Outboard anodes: ${engineAnodes.length}`);
    }

    // Go back to services
    const backBtn = await page.$('button:has-text("Back to Services")');
    if (backBtn) {
        await backBtn.click();
        await page.waitForTimeout(500);
    }
}

// Test 2: Add Anodes button in Cleaning Service
console.log('\n📍 Test 2: Add Anodes in Cleaning Service');
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    const addAnodesBtn = await page.$('button:has-text("Add Anodes")');
    if (addAnodesBtn) {
        console.log('  ✅ Add Anodes button found');

        await addAnodesBtn.click();
        await page.waitForTimeout(2000);

        // Check if anode selector opened
        const anodeGrid = await page.$('#anodeGrid');
        if (anodeGrid) {
            const anodeItems = await page.$$('.anode-item');
            console.log(`  ✅ Anode selector opened with ${anodeItems.length} items`);

            // Select an anode
            if (anodeItems.length > 0) {
                const plusBtn = await page.$('.anode-controls button:last-child');
                if (plusBtn) {
                    await plusBtn.click();
                    await page.waitForTimeout(500);
                    const count = await page.$eval('#selectedCount', el => el.textContent);
                    console.log(`  ✅ Selected ${count} anode(s)`);
                }
            }

            // Go back to wizard
            const backBtn = await page.$('button:has-text("Back to Service")');
            if (backBtn) {
                await backBtn.click();
                await page.waitForTimeout(1000);
                console.log('  ✅ Returned to service wizard');

                // Verify we're back in the cleaning wizard
                const boatLengthInput = await page.$('#adminBoatLength');
                if (boatLengthInput) {
                    console.log('  ✅ Service wizard restored correctly');
                }
            }
        }
    } else {
        console.log('  ❌ Add Anodes button not found');
    }
}

console.log('\n✨ Anode fixes test complete!');
await page.screenshot({ path: 'anode-fixes-test.png', fullPage: true });
console.log('📸 Screenshot saved as anode-fixes-test.png');

await browser.close();