import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing Anode Selection - Final');
console.log('===================================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Zinc Anodes Only service
const anodesBtn = await page.$('button:has-text("Zinc Anodes")');
if (anodesBtn) {
    await anodesBtn.click();
    await page.waitForTimeout(2000);

    console.log('📍 Testing increment buttons:\n');

    // Click + button on first anode
    await page.click('.anode-item:first-child .anode-controls button:last-child');
    await page.waitForTimeout(500);

    let quantity = await page.$eval('.anode-item:first-child .quantity', el => el.textContent);
    let count = await page.$eval('#selectedCount', el => el.textContent);
    let subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
    console.log(`After 1 click: Qty=${quantity}, Count=${count}, Subtotal=$${subtotal}`);

    // Click + again
    await page.click('.anode-item:first-child .anode-controls button:last-child');
    await page.waitForTimeout(500);

    quantity = await page.$eval('.anode-item:first-child .quantity', el => el.textContent);
    count = await page.$eval('#selectedCount', el => el.textContent);
    subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
    console.log(`After 2 clicks: Qty=${quantity}, Count=${count}, Subtotal=$${subtotal}`);

    // Click + one more time
    await page.click('.anode-item:first-child .anode-controls button:last-child');
    await page.waitForTimeout(500);

    quantity = await page.$eval('.anode-item:first-child .quantity', el => el.textContent);
    count = await page.$eval('#selectedCount', el => el.textContent);
    subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
    console.log(`After 3 clicks: Qty=${quantity}, Count=${count}, Subtotal=$${subtotal}`);

    // Check selected list
    const selectedList = await page.$eval('#selectedAnodesList', el => el.innerText);
    console.log(`\nSelected items:\n${selectedList}`);

    // Test minus button
    console.log('\n📍 Testing decrement button:');
    await page.click('.anode-item:first-child .anode-controls button:first-child');
    await page.waitForTimeout(500);

    quantity = await page.$eval('.anode-item:first-child .quantity', el => el.textContent);
    count = await page.$eval('#selectedCount', el => el.textContent);
    subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
    console.log(`After decrement: Qty=${quantity}, Count=${count}, Subtotal=$${subtotal}`);

    // Add another anode type
    console.log('\n📍 Adding second anode type:');
    await page.click('.anode-item:nth-child(2) .anode-controls button:last-child');
    await page.waitForTimeout(500);
    await page.click('.anode-item:nth-child(2) .anode-controls button:last-child');
    await page.waitForTimeout(500);

    count = await page.$eval('#selectedCount', el => el.textContent);
    subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
    const laborCost = parseInt(count) * 15;
    const total = parseFloat(subtotal) + laborCost;

    console.log(`\n📊 Final Summary:`);
    console.log(`  Total anodes: ${count}`);
    console.log(`  Anodes cost: $${subtotal}`);
    console.log(`  Labor (${count} × $15): $${laborCost.toFixed(2)}`);
    console.log(`  Grand total: $${total.toFixed(2)}`);

    // Check if it shows in selected list
    const finalList = await page.$eval('#selectedAnodesList', el => el.innerText);
    console.log(`\nFinal selected list:\n${finalList}`);
}

console.log('\n✨ Test complete!');
await page.screenshot({ path: 'anode-final-test.png', fullPage: false });
console.log('📸 Screenshot saved as anode-final-test.png');

await browser.close();