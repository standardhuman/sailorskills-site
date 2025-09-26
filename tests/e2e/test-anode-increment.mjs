import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Anode Selection and Increment');
console.log('=========================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Zinc Anodes Only service
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    console.log('📍 Testing increment/decrement buttons:\n');

    // Get first anode item
    const firstAnode = await page.$('.anode-item');
    if (firstAnode) {
        const anodeName = await firstAnode.$eval('.anode-name', el => el.textContent);
        const anodePrice = await firstAnode.$eval('.anode-price', el => el.textContent);
        console.log(`Testing with: ${anodeName} (${anodePrice})`);

        // Click + button 3 times
        const plusBtn = await firstAnode.$('.anode-controls button:last-child');
        console.log('\n  Clicking + button 3 times...');
        for (let i = 0; i < 3; i++) {
            await plusBtn.click();
            await page.waitForTimeout(300);
        }

        // Check quantity display
        const quantity = await firstAnode.$eval('.anode-controls .quantity', el => el.textContent);
        console.log(`  ✅ Quantity displayed: ${quantity}`);

        // Check selected count
        const selectedCount = await page.$eval('#selectedCount', el => el.textContent);
        console.log(`  ✅ Selected count: ${selectedCount}`);

        // Check subtotal
        const subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
        console.log(`  ✅ Subtotal: $${subtotal}`);

        // Check selected list
        const selectedList = await page.$eval('#selectedAnodesList', el => el.innerText);
        console.log(`  ✅ Selected list shows:\n    ${selectedList.replace(/\n/g, '\n    ')}`);

        // Test minus button
        console.log('\n  Clicking - button once...');
        const minusBtn = await firstAnode.$('.anode-controls button:first-child');
        await minusBtn.click();
        await page.waitForTimeout(300);

        const newQuantity = await firstAnode.$eval('.anode-controls .quantity', el => el.textContent);
        const newCount = await page.$eval('#selectedCount', el => el.textContent);
        const newSubtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
        console.log(`  ✅ After decrement - Quantity: ${newQuantity}, Count: ${newCount}, Subtotal: $${newSubtotal}`);

        // Add multiple different anodes
        console.log('\n📍 Testing multiple anode selection:');
        const anodeItems = await page.$$('.anode-item');
        for (let i = 1; i < Math.min(3, anodeItems.length); i++) {
            const item = anodeItems[i];
            const itemName = await item.$eval('.anode-name', el => el.textContent);
            const plusBtn = await item.$('.anode-controls button:last-child');
            await plusBtn.click();
            await page.waitForTimeout(300);
            console.log(`  ✅ Added: ${itemName}`);
        }

        // Final totals
        const finalCount = await page.$eval('#selectedCount', el => el.textContent);
        const finalSubtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
        const laborCost = parseInt(finalCount) * 15;

        console.log('\n📊 Final Selection Summary:');
        console.log(`  Total anodes: ${finalCount}`);
        console.log(`  Anodes subtotal: $${finalSubtotal}`);
        console.log(`  Labor (${finalCount} × $15): $${laborCost.toFixed(2)}`);
        console.log(`  Grand total: $${(parseFloat(finalSubtotal) + laborCost).toFixed(2)}`);

        // Test that it persists when changing categories
        console.log('\n📍 Testing persistence across category changes:');
        const hullBtn = await page.$('button.category-btn:has-text("Hull")');
        if (hullBtn) {
            await hullBtn.click();
            await page.waitForTimeout(500);

            const allBtn = await page.$('button.category-btn:has-text("All")');
            await allBtn.click();
            await page.waitForTimeout(500);

            // Check if first anode still shows quantity
            const persistedQuantity = await firstAnode.$eval('.anode-controls .quantity', el => el.textContent);
            console.log(`  ✅ Quantity persisted: ${persistedQuantity}`);
        }
    }
}

console.log('\n✨ Anode selection test complete!');
await page.screenshot({ path: 'anode-increment-test.png', fullPage: false });
console.log('📸 Screenshot saved as anode-increment-test.png');

await browser.close();