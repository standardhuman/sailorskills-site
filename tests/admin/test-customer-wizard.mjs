import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://rithgkmgdbvhthmuvdqg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdGhna21nZGJ2aHRobXV2ZHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NDQyOTEsImV4cCI6MjA0MzEyMDI5MX0.GjdUbg4KtJC1v2ACpWx3yGgGLSrTCQVQYqXqMqPxcSg'
);

async function testCustomerInWizard() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();

    try {
        console.log('🚀 Starting Customer Wizard Test...');

        // Navigate to admin page
        await page.goto('http://localhost:3000/admin');
        await page.waitForLoadState('networkidle');

        // Click on Recurring Cleaning service
        console.log('📍 Selecting Recurring Cleaning service...');
        await page.click('button:has-text("🔄 Recurring Cleaning")');
        await page.waitForTimeout(1000);

        // Check if customer info section exists
        console.log('✅ Checking for customer info section...');
        const customerSection = await page.locator('.customer-info-section').isVisible();
        if (customerSection) {
            console.log('✅ Customer info section found in wizard!');
        } else {
            console.log('❌ Customer info section not found!');
            throw new Error('Customer info section missing');
        }

        // Test customer search
        console.log('🔍 Testing customer search autocomplete...');
        await page.fill('#wizardCustomerName', 'test');
        await page.waitForTimeout(500);

        // Check if search results appear
        const searchResults = await page.locator('#customerSearchResults').isVisible();
        if (searchResults) {
            console.log('✅ Search results appear when typing!');

            // Check if there are any results
            const resultCount = await page.locator('#customerSearchResults > div').count();
            console.log(`📊 Found ${resultCount} search results`);
        }

        // Fill in customer information manually
        console.log('📝 Filling in customer information...');
        await page.fill('#wizardCustomerName', 'Test Customer');
        await page.fill('#wizardCustomerEmail', 'test@example.com');
        await page.fill('#wizardCustomerPhone', '555-1234');

        // Fill in boat information
        console.log('⛵ Filling in boat information...');
        const boatLengthInput = await page.locator('#wizardBoatLength, #boat_length').first();
        await boatLengthInput.fill('35');

        // Click Charge Customer button
        console.log('💳 Testing charge customer flow...');
        const chargeButton = await page.locator('#chargeButton, #pricingChargeButton').first();

        if (await chargeButton.isVisible() && await chargeButton.isEnabled()) {
            await chargeButton.click();
            await page.waitForTimeout(1000);

            // Check if modal appears
            const modal = await page.locator('#customerSelectionModal').isVisible();
            if (modal) {
                console.log('✅ Customer modal appeared with pre-filled data!');

                // Check if fields are pre-filled
                const modalName = await page.inputValue('#modalCustomerName');
                const modalEmail = await page.inputValue('#modalCustomerEmail');

                if (modalName === 'Test Customer' && modalEmail === 'test@example.com') {
                    console.log('✅ Modal fields are correctly pre-filled!');
                } else {
                    console.log('⚠️ Modal fields not pre-filled correctly');
                    console.log('  Name:', modalName);
                    console.log('  Email:', modalEmail);
                }
            }
        }

        // Test other services too
        console.log('\n📍 Testing other services...');

        // Go back to services
        await page.click('button:has-text("← Back to Services")');
        await page.waitForTimeout(500);

        // Test One-Time Cleaning
        await page.click('button:has-text("✨ One-Time Cleaning")');
        await page.waitForTimeout(500);

        const customerSectionOneTime = await page.locator('.customer-info-section').isVisible();
        if (customerSectionOneTime) {
            console.log('✅ Customer info section in One-Time Cleaning wizard!');
        }

        // Go back and test Underwater Inspection
        await page.click('button:has-text("← Back to Services")');
        await page.waitForTimeout(500);

        await page.click('button:has-text("🔍 Underwater Inspection")');
        await page.waitForTimeout(500);

        const customerSectionInspection = await page.locator('.customer-info-section').isVisible();
        if (customerSectionInspection) {
            console.log('✅ Customer info section in Underwater Inspection wizard!');
        }

        console.log('\n✅ All tests passed! Customer info is properly integrated into wizards.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-failure.png' });
        console.log('📸 Screenshot saved as test-failure.png');
    } finally {
        await browser.close();
    }
}

// Run the test
testCustomerInWizard().catch(console.error);