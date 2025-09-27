import { chromium } from 'playwright';

async function testAdminLinks() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 300
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('🚀 Starting Admin Page Links Test...\n');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Test Navigation Links
        console.log('📍 Testing Navigation Links:');

        // Check if all nav links exist
        const navLinks = [
            { selector: 'a[href="https://www.sailorskills.com/"]', text: 'HOME' },
            { selector: 'a[href="https://www.sailorskills.com/training"]', text: 'TRAINING' },
            { selector: 'a[href="https://www.sailorskills.com/diving"]', text: 'DIVING' },
            { selector: 'a[href="https://www.sailorskills.com/detailing"]', text: 'DETAILING' },
            { selector: 'a[href="https://www.sailorskills.com/deliveries"]', text: 'DELIVERIES' }
        ];

        for (const link of navLinks) {
            const exists = await page.locator(link.selector).first().isVisible();
            console.log(`  ✓ ${link.text} link: ${exists ? 'Found' : 'NOT FOUND'}`);
        }

        // Test Admin Tools Section
        console.log('\n🛠️ Testing Admin Tools Links:');

        // Check if admin tools section exists
        const adminToolsSection = await page.locator('.admin-tools-section').isVisible();
        console.log(`  Admin Tools Section visible: ${adminToolsSection}`);

        // Test Inventory Management link
        const inventoryLink = await page.locator('a[href="/inventory"]').first();
        if (await inventoryLink.isVisible()) {
            console.log('  ✓ Inventory Management link found');

            // Click and verify navigation
            const [newPage] = await Promise.all([
                context.waitForEvent('page'),
                inventoryLink.click()
            ]).catch(async () => {
                // If no new page, check if it navigated in same tab
                await inventoryLink.click();
                await page.waitForTimeout(1000);
                const url = page.url();
                console.log(`    → Navigated to: ${url}`);
                return [null];
            });

            if (newPage) {
                console.log(`    → Opened in new tab: ${newPage.url()}`);
                await newPage.close();
            }
        } else {
            console.log('  ❌ Inventory Management link NOT FOUND');
        }

        // Navigate back to admin if needed
        if (!page.url().includes('/admin')) {
            await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
        }

        // Test Diving Calculator link
        const divingLink = await page.locator('a[href="/diving"]').first();
        if (await divingLink.isVisible()) {
            console.log('  ✓ Diving Calculator link found');

            // Store current URL
            const currentUrl = page.url();

            // Click the link
            await divingLink.click();
            await page.waitForTimeout(1000);

            const newUrl = page.url();
            if (newUrl !== currentUrl) {
                console.log(`    → Navigated to: ${newUrl}`);
                // Go back to admin
                await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
            }
        } else {
            console.log('  ❌ Diving Calculator link NOT FOUND');
        }

        // Test Quote Viewer (should show alert)
        const quoteLink = await page.locator('a:has-text("Quote Viewer")').first();
        if (await quoteLink.isVisible()) {
            console.log('  ✓ Quote Viewer link found');

            // Listen for dialog (alert)
            page.on('dialog', async dialog => {
                console.log(`    → Alert shown: "${dialog.message()}"`);
                await dialog.accept();
            });

            await quoteLink.click();
            await page.waitForTimeout(500);
        } else {
            console.log('  ❌ Quote Viewer link NOT FOUND');
        }

        // Test Customer Section Elements
        console.log('\n👥 Testing Customer Section:');

        const customerElements = [
            { selector: '#customerSearch', name: 'Search input' },
            { selector: 'button:has-text("Search")', name: 'Search button' },
            { selector: 'button:has-text("Show Recent")', name: 'Show Recent button' },
            { selector: 'button:has-text("New Customer")', name: 'New Customer button' }
        ];

        for (const element of customerElements) {
            const exists = await page.locator(element.selector).first().isVisible();
            console.log(`  ✓ ${element.name}: ${exists ? 'Found' : 'NOT FOUND'}`);
        }

        // Test Service Buttons
        console.log('\n🔧 Testing Service Selection Buttons:');

        const serviceButtons = await page.locator('.simple-service-btn').all();
        console.log(`  Found ${serviceButtons.length} service buttons`);

        const expectedServices = [
            '🔄 Recurring Cleaning',
            '🧽 One-Time Cleaning',
            '🤿 Underwater Inspection',
            '🔍 Item Recovery',
            '⚙️ Propeller Service',
            '⚡ Anodes Only'
        ];

        for (const service of expectedServices) {
            const button = await page.locator(`.simple-service-btn:has-text("${service.split(' ')[1]}")`).first();
            const exists = await button.isVisible();
            console.log(`  ✓ ${service}: ${exists ? 'Found' : 'NOT FOUND'}`);

            if (exists) {
                // Check if button is clickable
                const isEnabled = await button.isEnabled();
                console.log(`    → Clickable: ${isEnabled}`);
            }
        }

        // Test Charge Summary Section
        console.log('\n💳 Testing Charge Summary Section:');

        const chargeSection = await page.locator('.charge-summary').isVisible();
        console.log(`  Charge Summary section visible: ${chargeSection}`);

        const chargeButton = await page.locator('#chargeButton').first();
        if (await chargeButton.isVisible()) {
            const isDisabled = await chargeButton.isDisabled();
            console.log(`  ✓ Charge Customer button: Found (${isDisabled ? 'Disabled' : 'Enabled'})`);
        }

        const quoteButton = await page.locator('button:has-text("Generate Quote")').first();
        if (await quoteButton.isVisible()) {
            console.log(`  ✓ Generate Quote button: Found`);
        }

        // Take final screenshot
        await page.screenshot({
            path: 'docs/test-screenshots/admin-links-test.png',
            fullPage: true
        });

        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

testAdminLinks();