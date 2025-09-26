import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔧 Testing Add Anodes Button in Admin Wizards');
console.log('===========================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Test with different service types
const services = [
    'Recurring Cleaning',
    'Bottom Paint',
    'Item Recovery',
    'Basic Service'
];

for (const service of services) {
    console.log(`\n📍 Testing ${service}:`);

    // Click service button
    const serviceBtn = await page.$(`button:has-text("${service}")`);
    if (serviceBtn) {
        await serviceBtn.click();
        await page.waitForTimeout(1000);

        // Look for Add Anodes button
        const anodeBtn = await page.$('button:has-text("Add Anodes to Service")');
        if (anodeBtn) {
            console.log(`  ✅ Add Anodes button found`);

            // Click it to test functionality
            await anodeBtn.click();
            await page.waitForTimeout(1500);

            // Check if anode selector opened
            const anodeGrid = await page.$('#anodeGrid');
            if (anodeGrid) {
                console.log(`  ✅ Anode selector opened successfully`);

                // Try selecting an anode
                const firstAddBtn = await page.$('.anode-controls button:has-text("+")');
                if (firstAddBtn) {
                    await firstAddBtn.click();
                    await page.waitForTimeout(500);

                    const selectedCount = await page.$eval('#selectedCount', el => el.textContent);
                    console.log(`  ✅ Selected ${selectedCount} anode(s)`);
                }

                // Go back to service wizard
                const backBtn = await page.$('button:has-text("Back to Service")');
                if (backBtn) {
                    await backBtn.click();
                    await page.waitForTimeout(500);
                    console.log(`  ✅ Returned to service wizard`);
                }
            }
        } else {
            console.log(`  ❌ Add Anodes button not found`);
        }

        // Go back to service selection
        const backToServices = await page.$('button:has-text("Back to Services")');
        if (backToServices) {
            await backToServices.click();
            await page.waitForTimeout(500);
        }
    }
}

// Test charge summary with anodes
console.log('\n📊 Testing Charge Summary with Anodes:');
console.log('=====================================');

// Select a service and add anodes
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    const anodeBtn = await page.$('button:has-text("Add Anodes")');
    if (anodeBtn) {
        await anodeBtn.click();
        await page.waitForTimeout(1000);

        // Add multiple anodes
        const addButtons = await page.$$('.anode-controls button:has-text("+")');
        for (let i = 0; i < Math.min(3, addButtons.length); i++) {
            await addButtons[i].click();
            await page.waitForTimeout(200);
        }

        // Confirm selection
        const confirmBtn = await page.$('button:has-text("Add Selected Anodes")');
        if (confirmBtn) {
            await confirmBtn.click();
            await page.waitForTimeout(1000);

            // Check charge summary
            const chargeDetails = await page.$eval('#chargeDetails', el => el.innerText);
            console.log('\nCharge Summary includes:');
            if (chargeDetails.includes('Anodes')) {
                console.log('  ✅ Anode costs shown');
            }
            if (chargeDetails.includes('Anode Labor')) {
                console.log('  ✅ Labor costs shown');
            }
            if (chargeDetails.includes('Total Price')) {
                console.log('  ✅ Total price updated');
            }
        }
    }
}

console.log('\n✨ Add Anodes button test complete!');
await page.screenshot({ path: 'admin-anode-button.png', fullPage: true });
console.log('📸 Screenshot saved as admin-anode-button.png');

await browser.close();