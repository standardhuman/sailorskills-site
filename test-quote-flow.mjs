import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Complete Quote Flow');
console.log('=================================\n');

await page.goto('http://localhost:3000/admin-new.html');
await page.waitForTimeout(1500);

// Step 1: Click Recurring Cleaning service
console.log('1️⃣ Selecting Recurring Cleaning service...');
await page.click('button:has-text("Recurring Cleaning")');
await page.waitForTimeout(1000);

// Step 2: Configure service options
console.log('2️⃣ Configuring service options...');

// Enter boat length
await page.fill('#adminBoatLength', '35');

// Leave hull type as default (monohull)
// Check powerboat checkbox
await page.check('#adminPowerboat');

// Select paint condition - Good
const goodLabel = await page.$('label:has-text("Good")');
if (goodLabel) {
    await goodLabel.click();
}

// Set growth level to Light (value 1)
await page.evaluate(() => {
    const slider = document.querySelector('#adminGrowthLevel');
    if (slider) {
        slider.value = '1';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
});

await page.waitForTimeout(500);

// Step 3: Add some anodes
console.log('3️⃣ Adding anodes...');
try {
    await page.click('button:has-text("Add Anodes")');
    await page.waitForTimeout(1000);

    // Add 2 shaft anodes using fresh selectors each time
    await page.click('.anode-item:first-child .anode-controls button:last-child');
    await page.waitForTimeout(300);
    await page.click('.anode-item:first-child .anode-controls button:last-child');
    await page.waitForTimeout(300);

    // Click Done with Anodes
    await page.click('button:has-text("Done with Anodes")');
    await page.waitForTimeout(500);
} catch (e) {
    console.log('Note: Anode selection had issues, continuing...');
}

// Step 4: Get the total cost
const totalCost = await page.$eval('#totalCostDisplay', el => el.textContent);
console.log(`4️⃣ Total cost calculated: ${totalCost}`);

// Step 5: Click Generate Quote
console.log('5️⃣ Clicking Generate Quote...');
await page.click('button:has-text("Generate Quote")');
await page.waitForTimeout(1000);

// Step 6: Fill in customer information
const modalVisible = await page.isVisible('#quoteCustomerModal');
if (modalVisible) {
    console.log('6️⃣ Filling customer information...');

    await page.fill('#quoteCustName', 'John Smith');
    await page.fill('#quoteCustEmail', 'john@example.com');
    await page.fill('#quoteCustPhone', '(555) 123-4567');
    await page.fill('#quoteBoatName', 'Sea Breeze');
    await page.fill('#quoteBoatMake', 'Catalina 34');
    await page.fill('#quoteMarina', 'Harbor Marina');
    await page.fill('#quoteSlip', 'A-42');

    // Click Generate Quote button in modal (the one with btn-primary class)
    await page.click('.btn-primary:has-text("Generate Quote")');
    await page.waitForTimeout(3000); // Wait for quote generation

    // Check if success message appears
    const successVisible = await page.isVisible('.success-result');
    if (successVisible) {
        console.log('✅ Quote generated successfully!');

        // Get quote details
        const quoteNumber = await page.$eval('.quote-details p:first-child', el => el.textContent);
        console.log(`   ${quoteNumber}`);

        // Check if PDF download button is available
        const pdfBtnExists = await page.$('button:has-text("Download PDF")');
        if (pdfBtnExists) {
            console.log('   📄 PDF download button available');
        }
    } else {
        console.log('❌ Quote generation may have failed');
    }
} else {
    console.log('❌ Customer modal did not appear');
}

console.log('\n✨ Test complete!');
await page.screenshot({ path: 'quote-flow-test.png', fullPage: true });
console.log('📸 Screenshot saved as quote-flow-test.png');

// Keep browser open for 5 seconds to see the result
await page.waitForTimeout(5000);
await browser.close();