import { chromium } from 'playwright';

async function testAdminLinksSimple() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 200
    });

    try {
        const page = await browser.newPage();

        console.log('🚀 Testing Admin Page Links and Elements...\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        let testResults = [];

        // Test Navigation Links
        console.log('📍 Navigation Links:');
        const navLinks = [
            'a[href="https://www.sailorskills.com/"]',
            'a[href="https://www.sailorskills.com/training"]',
            'a[href="https://www.sailorskills.com/diving"]',
            'a[href="https://www.sailorskills.com/detailing"]',
            'a[href="https://www.sailorskills.com/deliveries"]'
        ];

        for (const selector of navLinks) {
            try {
                const link = await page.locator(selector).first();
                const exists = await link.count() > 0;
                const text = exists ? await link.textContent() : 'N/A';
                console.log(`  ${exists ? '✅' : '❌'} ${text?.trim() || selector}`);
                testResults.push({ test: `Nav: ${text}`, passed: exists });
            } catch (e) {
                console.log(`  ❌ Error checking ${selector}`);
                testResults.push({ test: `Nav: ${selector}`, passed: false });
            }
        }

        // Test Admin Tools
        console.log('\n🛠️ Admin Tools:');
        const adminTools = [
            { selector: 'a[href="/inventory"]', name: 'Inventory Management' },
            { selector: 'a[href="/diving"]', name: 'Diving Calculator' },
            { selector: 'a:has-text("Quote Viewer")', name: 'Quote Viewer' }
        ];

        for (const tool of adminTools) {
            try {
                const link = await page.locator(tool.selector).first();
                const exists = await link.count() > 0;
                const isVisible = exists ? await link.isVisible() : false;
                console.log(`  ${isVisible ? '✅' : '❌'} ${tool.name}`);
                testResults.push({ test: tool.name, passed: isVisible });

                // Test href for actual links (not Quote Viewer)
                if (exists && !tool.name.includes('Quote')) {
                    const href = await link.getAttribute('href');
                    console.log(`      → href: ${href}`);
                }
            } catch (e) {
                console.log(`  ❌ Error checking ${tool.name}`);
                testResults.push({ test: tool.name, passed: false });
            }
        }

        // Test Customer Section
        console.log('\n👥 Customer Section:');
        const customerElements = [
            { selector: '#customerSearch', name: 'Search Input' },
            { selector: 'button:has-text("Search")', name: 'Search Button' },
            { selector: 'button:has-text("Show Recent")', name: 'Show Recent Button' },
            { selector: 'button:has-text("New Customer")', name: 'New Customer Button' }
        ];

        for (const element of customerElements) {
            try {
                const el = await page.locator(element.selector).first();
                const exists = await el.count() > 0;
                const isVisible = exists ? await el.isVisible() : false;
                console.log(`  ${isVisible ? '✅' : '❌'} ${element.name}`);
                testResults.push({ test: element.name, passed: isVisible });
            } catch (e) {
                console.log(`  ❌ Error checking ${element.name}`);
                testResults.push({ test: element.name, passed: false });
            }
        }

        // Test Service Buttons
        console.log('\n🔧 Service Buttons:');
        const serviceButtonCount = await page.locator('.simple-service-btn').count();
        console.log(`  Total buttons found: ${serviceButtonCount}`);
        testResults.push({ test: 'Service buttons exist', passed: serviceButtonCount > 0 });

        const services = ['Recurring', 'One-Time', 'Underwater', 'Recovery', 'Propeller', 'Anodes'];
        for (const service of services) {
            const button = await page.locator(`.simple-service-btn:has-text("${service}")`).first();
            const exists = await button.count() > 0;
            console.log(`  ${exists ? '✅' : '❌'} ${service}`);
            testResults.push({ test: `Service: ${service}`, passed: exists });
        }

        // Test Charge Section
        console.log('\n💳 Charge Section:');
        const chargeElements = [
            { selector: '.charge-summary', name: 'Charge Summary Container' },
            { selector: '#chargeButton', name: 'Charge Customer Button' },
            { selector: 'button:has-text("Generate Quote")', name: 'Generate Quote Button' }
        ];

        for (const element of chargeElements) {
            try {
                const el = await page.locator(element.selector).first();
                const exists = await el.count() > 0;
                const isVisible = exists ? await el.isVisible() : false;
                console.log(`  ${isVisible ? '✅' : '❌'} ${element.name}`);
                testResults.push({ test: element.name, passed: isVisible });
            } catch (e) {
                console.log(`  ❌ Error checking ${element.name}`);
                testResults.push({ test: element.name, passed: false });
            }
        }

        // Summary
        console.log('\n📊 Test Summary:');
        const passed = testResults.filter(r => r.passed).length;
        const failed = testResults.filter(r => !r.passed).length;
        console.log(`  ✅ Passed: ${passed}`);
        console.log(`  ❌ Failed: ${failed}`);
        console.log(`  📈 Success Rate: ${Math.round(passed / testResults.length * 100)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed tests:');
            testResults.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.test}`);
            });
        }

        // Take screenshot
        await page.screenshot({
            path: 'docs/test-screenshots/admin-elements-test.png',
            fullPage: true
        });

        console.log('\n✅ Test completed!');

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        await browser.close();
    }
}

testAdminLinksSimple();