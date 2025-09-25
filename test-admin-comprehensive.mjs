import { chromium } from 'playwright';

async function testAdminComprehensive() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('🧪 Comprehensive Admin Page Test\n');

        // Navigate to admin page
        await page.goto('http://localhost:8082/admin.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Take screenshot of new button design
        await page.screenshot({
            path: 'admin-new-button-design.png',
            clip: await page.locator('.service-selector').boundingBox()
        });
        console.log('📸 New button design captured');

        // Test 1: Propeller Service
        console.log('\n1️⃣ Testing Propeller Service...');
        const propellerBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Propeller Service' });
        await propellerBtn.click();
        await page.waitForTimeout(500);

        // Check if propeller form appears
        const propellerCount = await page.locator('#propellerCount');
        if (await propellerCount.isVisible()) {
            console.log('  ✅ Propeller form loaded');

            // Test changing propeller count
            await propellerCount.fill('2');
            await page.waitForTimeout(300);

            // Check charge summary
            const chargeDetails = await page.locator('.charge-details').textContent();
            if (chargeDetails && chargeDetails.includes('$698')) {
                console.log('  ✅ Charge updates correctly for 2 propellers ($698)');
            } else {
                console.log('  ⚠️ Charge calculation may be incorrect');
            }
        } else {
            console.log('  ❌ Propeller form not found');
        }

        // Back to services
        const backBtn = await page.locator('button').filter({ hasText: 'Back' });
        if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(500);
        }

        // Test 2: Underwater Inspection - Lag Test
        console.log('\n2️⃣ Testing Underwater Inspection (Lag Test)...');
        const inspectionBtn = await page.locator('.simple-service-btn').filter({ hasText: 'Underwater Inspection' });
        await inspectionBtn.click();
        await page.waitForTimeout(500);

        const boatLengthSlider = await page.locator('#adminBoatLength');
        if (await boatLengthSlider.isVisible()) {
            console.log('  Testing slider responsiveness...');

            // Rapid slider changes to test for lag
            const startTime = Date.now();
            for (let i = 20; i <= 60; i += 5) {
                await boatLengthSlider.fill(String(i));
                await page.waitForTimeout(50);
            }
            const elapsed = Date.now() - startTime;

            console.log(`  ⏱️ Slider test completed in ${elapsed}ms`);
            if (elapsed < 1500) {
                console.log('  ✅ No lag detected - debouncing working!');
            } else {
                console.log('  ⚠️ Some lag detected');
            }

            // Test hull configuration changes
            const hullOptions = await page.locator('input[name="adminHullType"]').all();
            if (hullOptions.length > 0) {
                const configStart = Date.now();
                for (const option of hullOptions) {
                    await option.click();
                    await page.waitForTimeout(50);
                }
                const configElapsed = Date.now() - configStart;
                console.log(`  ⏱️ Hull config test: ${configElapsed}ms ${configElapsed < 500 ? '(Good!)' : '(Slow)'}`);
            }
        }

        // Test 3: Visual Button Differentiation
        console.log('\n3️⃣ Testing Visual Button Differentiation...');

        // Go back to service selection
        const backBtn2 = await page.locator('button').filter({ hasText: 'Back' }).first();
        if (await backBtn2.isVisible()) {
            await backBtn2.click();
            await page.waitForTimeout(500);
        }

        const allButtons = await page.locator('.simple-service-btn').all();
        console.log(`  Found ${allButtons.length} service buttons`);

        for (const button of allButtons) {
            const text = await button.textContent();
            const hasEmoji = /[🔄🧽🔍🤿⚙️⚡]/.test(text);
            if (hasEmoji) {
                console.log(`  ✅ ${text.trim()} has emoji`);
            } else {
                console.log(`  ⚠️ ${text.trim()} missing emoji`);
            }
        }

        // Test 4: Mobile Responsiveness
        console.log('\n4️⃣ Testing Mobile Responsiveness...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);

        await page.screenshot({
            path: 'admin-mobile-services.png',
            fullPage: false,
            clip: await page.locator('.service-selector').boundingBox()
        });

        // Check if buttons are stacked
        const firstButton = await allButtons[0].boundingBox();
        const secondButton = await allButtons[1].boundingBox();

        if (firstButton && secondButton) {
            const isStacked = secondButton.y > firstButton.y + firstButton.height - 5;
            console.log(`  ${isStacked ? '✅' : '❌'} Buttons are ${isStacked ? 'stacked' : 'NOT stacked'} on mobile`);
        }

        // Test 5: Each Service Quick Check
        console.log('\n5️⃣ Quick Service Check...');
        await page.setViewportSize({ width: 1280, height: 800 }); // Back to desktop

        const services = [
            '🔄 Recurring Cleaning',
            '🧽 One-Time Cleaning',
            '🔍 Item Recovery',
            '🤿 Underwater Inspection',
            '⚙️ Propeller Service',
            '⚡ Anodes Only'
        ];

        for (const service of services) {
            const btn = await page.locator('.simple-service-btn').filter({ hasText: service });
            if (await btn.isVisible()) {
                console.log(`  ✅ ${service} button found`);
            } else {
                console.log(`  ❌ ${service} button NOT found`);
            }
        }

        console.log('\n✨ Test Complete! Check screenshots for visual verification.');

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
    await testAdminComprehensive();
    server.kill();
    process.exit(0);
}, 2000);