import { chromium } from 'playwright';

async function testAllAdminServices() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('🔍 Testing all admin services...\n');

        // Navigate to admin page
        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Test each service
        const services = [
            { name: 'Recurring Cleaning', key: 'recurring_cleaning' },
            { name: 'One-Time Cleaning', key: 'onetime_cleaning' },
            { name: 'Item Recovery', key: 'item_recovery' },
            { name: 'Underwater Inspection', key: 'underwater_inspection' },
            { name: 'Propeller Service', key: 'propeller_service' },
            { name: 'Anodes Only', key: 'anodes_only' }
        ];

        for (const service of services) {
            console.log(`\n📋 Testing ${service.name}...`);

            // Click service button
            const button = await page.locator('.simple-service-btn').filter({ hasText: service.name });
            await button.click();
            await page.waitForTimeout(500);

            // Check if charge summary appears
            const chargeDetails = await page.locator('.charge-details').first();
            const isVisible = await chargeDetails.isVisible();

            if (!isVisible) {
                console.log(`  ❌ Charge summary not visible for ${service.name}`);
            } else {
                // Get the charge amount
                const chargeText = await chargeDetails.textContent();
                console.log(`  ✅ Charge summary visible`);

                // Check for total amount
                if (chargeText && chargeText.includes('$')) {
                    const amount = chargeText.match(/\$[\d,]+\.?\d*/);
                    console.log(`  💰 Amount: ${amount ? amount[0] : 'Not found'}`);
                } else {
                    console.log(`  ⚠️ No price found in charge summary`);
                }
            }

            // Special tests for specific services
            if (service.key === 'underwater_inspection') {
                console.log('  🔧 Testing boat length slider performance...');
                const startTime = Date.now();

                // Try to find and interact with boat length input
                const boatLengthInput = await page.locator('input[type="range"]').first();
                if (await boatLengthInput.isVisible()) {
                    // Change boat length multiple times to test lag
                    for (let i = 0; i < 5; i++) {
                        await boatLengthInput.fill(String(30 + i * 5));
                        await page.waitForTimeout(100);
                    }
                    const elapsed = Date.now() - startTime;
                    console.log(`    ⏱️ Slider interaction took ${elapsed}ms ${elapsed > 2000 ? '(LAGGY!)' : '(OK)'}`);
                }

                // Test hull configuration changes
                const hullButtons = await page.locator('.radio-option, .condition-btn').all();
                if (hullButtons.length > 0) {
                    console.log('  🔧 Testing hull configuration changes...');
                    const configStartTime = Date.now();
                    for (let i = 0; i < Math.min(3, hullButtons.length); i++) {
                        await hullButtons[i].click();
                        await page.waitForTimeout(100);
                    }
                    const configElapsed = Date.now() - configStartTime;
                    console.log(`    ⏱️ Hull config changes took ${configElapsed}ms ${configElapsed > 1500 ? '(LAGGY!)' : '(OK)'}`);
                }
            }

            if (service.key === 'propeller_service') {
                console.log('  🔧 Checking propeller service fields...');

                // Check for propeller count selector
                const propCountInput = await page.locator('input[type="number"]').first();
                if (await propCountInput.isVisible()) {
                    await propCountInput.fill('2');
                    await page.waitForTimeout(300);

                    // Check if charge updates
                    const updatedCharge = await chargeDetails.textContent();
                    if (updatedCharge && updatedCharge.includes('$')) {
                        console.log('  ✅ Charge updates with propeller count');
                    } else {
                        console.log('  ❌ Charge does NOT update with propeller count');
                    }
                }
            }

            if (service.key === 'anodes_only') {
                console.log('  🔧 Testing anode selector...');

                // Click "Select Anodes" button if present
                const anodeButton = await page.locator('button').filter({ hasText: /select anodes/i }).first();
                if (await anodeButton.isVisible()) {
                    await anodeButton.click();
                    await page.waitForTimeout(500);

                    // Check if modal or anode selector appears
                    const anodeModal = await page.locator('.modal, .anode-grid').first();
                    if (await anodeModal.isVisible()) {
                        console.log('  ✅ Anode selector opens');

                        // Close modal if open
                        const closeButton = await page.locator('.close, button').filter({ hasText: /close|cancel/i }).first();
                        if (await closeButton.isVisible()) {
                            await closeButton.click();
                        }
                    } else {
                        console.log('  ❌ Anode selector does not open');
                    }
                }
            }

            // Take screenshot of each service
            await page.screenshot({
                path: `admin-service-${service.key}.png`,
                fullPage: false,
                clip: await page.locator('.container').boundingBox()
            });
        }

        console.log('\n\n📊 Test Summary Complete!');
        console.log('Check the screenshots for visual verification.');

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await browser.close();
    }
}

// Start server first
import { spawn } from 'child_process';

const server = spawn('python3', ['-m', 'http.server', '8082'], {
    detached: false,
    stdio: 'ignore'
});

// Wait for server to start
setTimeout(async () => {
    await testAllAdminServices();

    // Kill server
    server.kill();
    process.exit(0);
}, 2000);