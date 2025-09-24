import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Vercel Deployment');
console.log('=====================================\n');

const url = 'https://cost-calculator-km9i0l3es-brians-projects-bc2d3592.vercel.app';

// Test home page
console.log('1️⃣ Testing Home Page...');
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const homeTitle = await page.title();
console.log(`   Title: ${homeTitle}`);

// Check what's on the page
const h1Text = await page.$eval('h1', el => el.textContent).catch(() => 'No H1 found');
console.log(`   H1 Text: ${h1Text}`);

// Check for redirects
const currentURL = page.url();
console.log(`   Current URL: ${currentURL}`);

if (currentURL !== url + '/') {
    console.log(`   ⚠️  Redirected from home to: ${currentURL}`);
}

await page.screenshot({ path: 'vercel-home.png' });
console.log('   📸 Screenshot saved as vercel-home.png\n');

// Test admin page
console.log('2️⃣ Testing Admin Page...');
await page.goto(`${url}/admin`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const adminTitle = await page.title();
console.log(`   Title: ${adminTitle}`);

// Check for admin badge
const adminBadge = await page.$('.admin-badge');
if (adminBadge) {
    const badgeText = await adminBadge.textContent();
    console.log(`   ✅ Admin badge found: ${badgeText}`);
} else {
    console.log('   ❌ Admin badge not found');
}

// Check for service buttons
const serviceButtons = await page.$$('.simple-service-btn');
console.log(`   Service buttons found: ${serviceButtons.length}`);

if (serviceButtons.length > 0) {
    const buttonTexts = await page.$$eval('.simple-service-btn', buttons =>
        buttons.map(btn => btn.textContent)
    );
    console.log('   Button labels:');
    buttonTexts.forEach(text => console.log(`     - ${text}`));
}

// Check charge summary section
const chargeSummary = await page.$('.charge-summary');
if (chargeSummary) {
    console.log('   ✅ Charge summary section found');
} else {
    console.log('   ❌ Charge summary section not found');
}

await page.screenshot({ path: 'vercel-admin.png', fullPage: true });
console.log('   📸 Screenshot saved as vercel-admin.png\n');

// Test service selection
console.log('3️⃣ Testing Service Selection...');
if (serviceButtons.length > 0) {
    // Click first service button
    await page.click('.simple-service-btn:first-child');
    await page.waitForTimeout(2000);

    // Check if wizard appears
    const wizardContainer = await page.$('#wizardContainer');
    if (wizardContainer) {
        const isVisible = await wizardContainer.isVisible();
        console.log(`   Wizard container visible: ${isVisible}`);

        if (isVisible) {
            // Check for boat length input
            const boatLengthInput = await page.$('#adminBoatLength');
            if (boatLengthInput) {
                console.log('   ✅ Boat length input found');

                // Try entering a value
                await boatLengthInput.fill('35');
                console.log('   ✅ Entered boat length: 35');
            }

            // Check for total cost display
            const totalCost = await page.$eval('#totalCostDisplay', el => el.textContent)
                .catch(() => 'Not found');
            console.log(`   Total cost display: ${totalCost}`);
        }
    } else {
        console.log('   ❌ Wizard container not found');
    }

    await page.screenshot({ path: 'vercel-service-selected.png' });
    console.log('   📸 Screenshot saved as vercel-service-selected.png\n');
}

// Test quote generation button
console.log('4️⃣ Testing Quote Generation...');
const quoteButton = await page.$('button:has-text("Generate Quote")');
if (quoteButton) {
    console.log('   ✅ Quote generation button found');
    const isEnabled = await quoteButton.isEnabled();
    console.log(`   Button enabled: ${isEnabled}`);
} else {
    console.log('   ❌ Quote generation button not found');
}

// Check console errors
const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') {
        errors.push(msg.text());
    }
});

await page.reload();
await page.waitForTimeout(2000);

if (errors.length > 0) {
    console.log('\n⚠️  Console Errors Found:');
    errors.forEach(err => console.log(`   - ${err}`));
} else {
    console.log('\n✅ No console errors detected');
}

// Summary
console.log('\n📊 Deployment Summary:');
console.log('========================');
console.log(`✅ Site is accessible at: ${url}`);
console.log(`✅ Admin page loads at: ${url}/admin`);
console.log(`${serviceButtons.length > 0 ? '✅' : '❌'} Service buttons: ${serviceButtons.length} found`);
console.log(`${chargeSummary ? '✅' : '❌'} Charge summary section present`);
console.log(`${errors.length === 0 ? '✅' : '⚠️'} Console errors: ${errors.length} found`);

console.log('\n✨ Test complete!');
await browser.close();