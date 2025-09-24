import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Checking Anode Selection System');
console.log('===================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Test 1: Check for "Anodes only" service
console.log('📍 Test 1: Looking for "Anodes only" service button');
const anodesOnlyBtn = await page.$('button:has-text("Anodes")');
if (anodesOnlyBtn) {
    const buttonText = await anodesOnlyBtn.textContent();
    console.log(`  ✅ Found service button: "${buttonText}"`);

    // Click it
    await anodesOnlyBtn.click();
    await page.waitForTimeout(1500);

    // Check what opened
    const wizardContent = await page.$('#wizardContent');
    if (wizardContent) {
        const content = await wizardContent.textContent();
        if (content.includes('Select Anodes')) {
            console.log('  ✅ Anode selector opened directly');
        } else {
            console.log('  ℹ️  Wizard opened, looking for Add Anodes button...');

            const addAnodesBtn = await page.$('button:has-text("Add Anodes")');
            if (addAnodesBtn) {
                console.log('  ✅ "Add Anodes" button found in wizard');
            }
        }
    }

    // Go back to services
    const backBtn = await page.$('button:has-text("Back to Services")');
    if (backBtn) {
        await backBtn.click();
        await page.waitForTimeout(500);
    }
} else {
    console.log('  ❌ "Anodes only" service not found');
}

// Test 2: Check Add Anodes button in a regular service
console.log('\n📍 Test 2: Testing "Add Anodes" button in service wizard');
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    const addAnodesBtn = await page.$('button:has-text("Add Anodes")');
    if (addAnodesBtn) {
        console.log('  ✅ "Add Anodes to Service" button found');

        // Click it
        await addAnodesBtn.click();
        await page.waitForTimeout(1500);

        // Verify anode selector opened
        const anodeGrid = await page.$('#anodeGrid');
        const anodeSearch = await page.$('#anodeSearch');
        const categoryBtns = await page.$$('.category-btn');

        console.log('\n  Anode Selector Components:');
        console.log(`    ${anodeSearch ? '✅' : '❌'} Search input`);
        console.log(`    ${categoryBtns.length > 0 ? '✅' : '❌'} Category filters (${categoryBtns.length} found)`);
        console.log(`    ${anodeGrid ? '✅' : '❌'} Anode grid`);

        // Check if anodes loaded
        if (anodeGrid) {
            const anodeItems = await page.$$('.anode-item');
            console.log(`    ${anodeItems.length > 0 ? '✅' : '❌'} Anode items loaded (${anodeItems.length} items)`);

            if (anodeItems.length > 0) {
                // Try to select an anode
                const firstAddBtn = await page.$('.anode-controls button:last-child');
                if (firstAddBtn) {
                    await firstAddBtn.click();
                    await page.waitForTimeout(500);

                    const selectedCount = await page.$eval('#selectedCount', el => el.textContent);
                    console.log(`    ✅ Can select anodes (${selectedCount} selected)`);
                }
            } else {
                // Check for error message
                const errorMsg = await anodeGrid.textContent();
                if (errorMsg.includes('Failed')) {
                    console.log(`    ⚠️  Error loading catalog: ${errorMsg}`);
                }
            }
        }

        // Try going back
        const backToServiceBtn = await page.$('button:has-text("Back to Service")');
        if (backToServiceBtn) {
            await backToServiceBtn.click();
            await page.waitForTimeout(500);
            console.log('    ✅ Can return to service wizard');
        }
    } else {
        console.log('  ❌ "Add Anodes" button not found in wizard');
    }
}

// Test 3: Check if anode catalog files are accessible
console.log('\n📍 Test 3: Checking anode catalog accessibility');
try {
    const response = await page.evaluate(async () => {
        try {
            const res = await fetch('/full-boatzincs-catalog.json');
            return {
                ok: res.ok,
                status: res.status,
                file: 'full-boatzincs-catalog.json'
            };
        } catch (e) {
            try {
                const res = await fetch('/anode-catalog.json');
                return {
                    ok: res.ok,
                    status: res.status,
                    file: 'anode-catalog.json'
                };
            } catch (e2) {
                return { ok: false, error: e2.message };
            }
        }
    });

    if (response.ok) {
        console.log(`  ✅ Catalog accessible: ${response.file}`);
    } else {
        console.log(`  ❌ Catalog not accessible: ${response.error || `Status ${response.status}`}`);
    }
} catch (error) {
    console.log(`  ❌ Error checking catalog: ${error.message}`);
}

console.log('\n✨ Anode system check complete!');

// Take a screenshot
await page.screenshot({ path: 'anode-system-check.png', fullPage: true });
console.log('📸 Screenshot saved as anode-system-check.png');

await browser.close();