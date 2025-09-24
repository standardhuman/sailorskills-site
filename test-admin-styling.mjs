import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log("Testing admin page styling and functionality...");

// Navigate to admin page
await page.goto("http://localhost:3000/admin");
await page.waitForTimeout(2000);

// Check page structure
const pageStructure = await page.evaluate(() => {
    const adminBadge = document.querySelector('.admin-badge');
    const heroHeader = document.querySelector('.hero-header');
    const container = document.querySelector('.container');
    const serviceButtons = document.querySelector('#simpleServiceButtons');

    return {
        // Check admin badge
        adminBadgeExists: !!adminBadge,
        adminBadgeText: adminBadge?.textContent,
        adminBadgePosition: adminBadge ? window.getComputedStyle(adminBadge).position : null,
        adminBadgeTop: adminBadge ? window.getComputedStyle(adminBadge).top : null,
        adminBadgeRight: adminBadge ? window.getComputedStyle(adminBadge).right : null,

        // Check hero header
        heroTitle: document.querySelector('.hero-title')?.textContent,
        heroBrand: document.querySelector('.hero-brand')?.textContent,
        heroSubtitle: document.querySelector('.hero-subtitle')?.textContent,

        // Check container width
        containerMaxWidth: container ? window.getComputedStyle(container).maxWidth : null,

        // Check service buttons
        serviceButtonsExist: !!serviceButtons,
        serviceButtonCount: serviceButtons ? serviceButtons.children.length : 0,

        // Check admin app initialization
        adminAppExists: typeof window.adminApp !== 'undefined',
        serviceDataExists: typeof window.serviceData !== 'undefined'
    };
});

console.log("\n📋 Page Structure Check:");
console.log("------------------------");
console.log("✅ Admin Badge:", pageStructure.adminBadgeExists ?
    `Found - "${pageStructure.adminBadgeText}" at position: ${pageStructure.adminBadgePosition} (top: ${pageStructure.adminBadgeTop}, right: ${pageStructure.adminBadgeRight})` :
    "❌ Not found");
console.log("✅ Hero Title:", pageStructure.heroTitle || "❌ Not found");
console.log("✅ Hero Brand:", pageStructure.heroBrand || "❌ Not found");
console.log("✅ Hero Subtitle:", pageStructure.heroSubtitle || "❌ Not found");
console.log("✅ Container Width:", pageStructure.containerMaxWidth || "❌ Not set");
console.log("✅ Service Buttons:", pageStructure.serviceButtonsExist ?
    `Found - ${pageStructure.serviceButtonCount} buttons` :
    "❌ Not found");
console.log("✅ Admin App:", pageStructure.adminAppExists ? "Initialized" : "❌ Not initialized");
console.log("✅ Service Data:", pageStructure.serviceDataExists ? "Loaded" : "❌ Not loaded");

// Check service button details
const serviceButtonDetails = await page.evaluate(() => {
    const buttons = document.querySelectorAll('#simpleServiceButtons .simple-service-btn');
    return Array.from(buttons).map(btn => ({
        text: btn.textContent,
        backgroundColor: window.getComputedStyle(btn).backgroundColor,
        hasClickHandler: typeof btn.onclick === 'function'
    }));
});

console.log("\n🎯 Service Buttons:");
console.log("-------------------");
serviceButtonDetails.forEach(btn => {
    console.log(`  • ${btn.text} - Background: ${btn.backgroundColor} - Click handler: ${btn.hasClickHandler ? '✅' : '❌'}`);
});

// Test clicking a service button
console.log("\n🖱️ Testing Service Selection:");
console.log("------------------------------");

// Click on the anodes service button
const anodesButton = await page.$('button:has-text("Zinc Anodes Only")');
if (anodesButton) {
    await anodesButton.click();
    await page.waitForTimeout(1000);

    const afterClick = await page.evaluate(() => {
        const chargeDetails = document.getElementById('chargeDetails')?.textContent;
        const chargeButton = document.getElementById('chargeButton');

        return {
            currentServiceKey: window.adminApp?.currentServiceKey,
            chargeDetails: chargeDetails,
            chargeButtonDisabled: chargeButton?.disabled,
            chargeButtonText: chargeButton?.textContent
        };
    });

    console.log("After clicking Zinc Anodes:");
    console.log("  • Service key:", afterClick.currentServiceKey || "Not set");
    console.log("  • Charge details:", afterClick.chargeDetails?.substring(0, 50) + "..." || "Not updated");
    console.log("  • Charge button:", afterClick.chargeButtonDisabled ? "❌ Still disabled" : "✅ Enabled");
    console.log("  • Button text:", afterClick.chargeButtonText);
}

// Test customer search functionality
console.log("\n👤 Testing Customer Search:");
console.log("---------------------------");

const searchInput = await page.$('#customerSearch');
if (searchInput) {
    await searchInput.type('test');

    const searchButton = await page.$('button:has-text("Search")');
    if (searchButton) {
        await searchButton.click();
        await page.waitForTimeout(1000);

        const customerListVisible = await page.evaluate(() => {
            const list = document.getElementById('customerList');
            return list && list.style.display !== 'none';
        });

        console.log("  • Customer list visible after search:", customerListVisible ? "✅ Yes" : "❌ No");
    }
}

console.log("\n✨ Admin page styling test complete!");

await page.screenshot({ path: 'admin-page-test.png' });
console.log("📸 Screenshot saved as admin-page-test.png");

await browser.close();