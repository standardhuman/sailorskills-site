import { chromium } from 'playwright';

async function testChargeFlow() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    try {
        const context = await browser.newContext({
            // Disable cache
            bypassCSP: true,
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        // Disable cache for this page
        await page.route('**/*', route => {
            route.continue({
                headers: {
                    ...route.request().headers(),
                    'Cache-Control': 'no-cache'
                }
            });
        });

        // Enable console logging
        page.on('console', msg => {
            console.log('Browser console:', msg.text());
        });

        // Log any page errors
        page.on('pageerror', error => {
            console.error('Page error:', error.message);
        });

        console.log('🧪 Testing Admin Charge Flow...\n');

        // Navigate to admin page
        console.log('📍 Navigating to admin page...');
        await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Test 1: Customer search functionality
        console.log('\n1️⃣ Testing customer search...');
        const searchInput = await page.locator('#customerSearchInput');
        if (await searchInput.isVisible()) {
            console.log('✅ Customer search input found');
            await searchInput.fill('test');
            await page.waitForTimeout(1000);

            // Check if results appear
            const customerResults = await page.locator('.customer-item');
            const resultCount = await customerResults.count();
            console.log(`Found ${resultCount} customer results`);
        } else {
            console.log('❌ Customer search input not found!');
        }

        // Test 2: Select a service
        console.log('\n2️⃣ Testing service selection...');
        const serviceButton = await page.locator('.service-option').first();
        if (await serviceButton.isVisible()) {
            await serviceButton.click();
            console.log('✅ Selected first service');
            await page.waitForTimeout(1000);
        } else {
            console.log('❌ No service buttons found!');
        }

        // Test 3: Check charge summary visibility
        console.log('\n3️⃣ Checking charge summary...');
        const chargeSummary = await page.locator('#charge-summary');
        if (await chargeSummary.isVisible()) {
            console.log('✅ Charge summary is visible');

            // Check for customer status
            const customerStatus = await page.locator('#selectedCustomerDisplay');
            if (await customerStatus.isVisible()) {
                const customerText = await customerStatus.textContent();
                console.log('Customer status:', customerText);
            }

            // Check for total cost
            const totalCost = await page.locator('#totalCostDisplay');
            if (await totalCost.isVisible()) {
                const costText = await totalCost.textContent();
                console.log('Total cost:', costText);
            }
        } else {
            console.log('❌ Charge summary not visible!');
        }

        // Test 4: Test Charge Customer button
        console.log('\n4️⃣ Testing Charge Customer button...');
        const chargeButton = await page.locator('button:has-text("Charge Customer")').first();
        if (await chargeButton.isVisible()) {
            console.log('Charge button found, checking if enabled...');
            const isDisabled = await chargeButton.isDisabled();
            console.log('Charge button disabled?', isDisabled);

            if (!isDisabled) {
                console.log('Clicking Charge Customer button...');
                await chargeButton.click();
                await page.waitForTimeout(2000);

                // Check if modal opens or action occurs
                const modal = await page.locator('#customerSelectionModal');
                if (await modal.isVisible()) {
                    console.log('✅ Customer selection modal opened');
                } else {
                    console.log('⚠️ No modal appeared after clicking charge');
                }
            }
        } else {
            console.log('❌ Charge Customer button not found!');
        }

        // Test 5: Test Generate Quote button
        console.log('\n5️⃣ Testing Generate Quote button...');
        const quoteButton = await page.locator('button:has-text("Generate Quote")');
        if (await quoteButton.isVisible()) {
            console.log('Quote button found, checking if enabled...');
            const isDisabled = await quoteButton.isDisabled();
            console.log('Quote button disabled?', isDisabled);

            if (!isDisabled) {
                console.log('Clicking Generate Quote button...');

                // Listen for new page/tab
                const [newPage] = await Promise.all([
                    context.waitForEvent('page'),
                    quoteButton.click()
                ]);

                if (newPage) {
                    console.log('✅ New tab opened for quote');
                    await newPage.close();
                } else {
                    console.log('⚠️ No new tab opened');
                }
            }
        } else {
            console.log('❌ Generate Quote button not found!');
        }

        // Take screenshot
        await page.screenshot({
            path: 'docs/test-screenshots/charge-flow-test.png',
            fullPage: true
        });

        console.log('\n📸 Screenshot saved to docs/test-screenshots/charge-flow-test.png');

    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

testChargeFlow();