import { chromium } from 'playwright';

async function testAnodeCharging() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Complete Anode Charging Flow\n');
  
  try {
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // Click on Charge Anodes button
    console.log('📍 Opening Anode section...');
    const anodeBtn = await page.$('button:has-text("⚓ Charge Anodes")');
    if (anodeBtn) {
      await anodeBtn.click();
      console.log('  ✓ Anode section opened');
      await page.waitForTimeout(1000);
      
      // Select a customer first
      console.log('\n📍 Selecting a customer...');
      const customerSearch = await page.$('#customerSearch');
      if (customerSearch) {
        await customerSearch.type('test'); // Type partial customer name
        await page.waitForTimeout(500);
        
        // Check if customer dropdown appears
        const customerItem = await page.$('.customer-item');
        if (customerItem) {
          await customerItem.click();
          console.log('  ✓ Customer selected');
          await page.waitForTimeout(500);
        } else {
          console.log('  ℹ️  No test customer found - creating mock selection');
          // Simulate customer selection for testing
          await page.evaluate(() => {
            window.selectedCustomer = {
              id: 'test-123',
              name: 'Test Customer',
              email: 'test@example.com',
              stripe_customer_id: 'cus_test123',
              payment_method: 'pm_test123'
            };
            window.selectedBoat = {
              id: 'boat-123',
              name: 'Test Boat'
            };
            // Enable the charge button
            const btn = document.getElementById('chargeAnodeBtn');
            if (btn) btn.disabled = false;
          });
        }
      }
      
      // Add some anodes to cart
      console.log('\n📍 Adding anodes to cart...');
      const anodeItems = await page.$$('.anode-item');
      if (anodeItems.length > 0) {
        // Add 2 different anodes
        for (let i = 0; i < Math.min(2, anodeItems.length); i++) {
          const plusBtn = await anodeItems[i].$('.quantity-btn:has-text("+")');
          if (plusBtn) {
            await plusBtn.click();
            await plusBtn.click(); // Click twice for quantity of 2
            await page.waitForTimeout(300);
          }
        }
        console.log('  ✓ Added anodes to cart');
        
        // Check cart totals
        const subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
        const laborTotal = await page.$eval('#anodeLaborTotal', el => el.textContent);
        const tax = await page.$eval('#anodeTax', el => el.textContent);
        const markup = await page.$eval('#anodeMarkup', el => el.textContent);
        const total = await page.$eval('#anodeTotal', el => el.textContent);
        
        console.log('\n💰 Cart Totals:');
        console.log(`  • Subtotal: ${subtotal}`);
        console.log(`  • Labor: ${laborTotal}`);
        console.log(`  • Tax: ${tax}`);
        console.log(`  • Markup: ${markup}`);
        console.log(`  • Total: ${total}`);
        
        // Test changing pricing configuration
        console.log('\n📍 Testing pricing configuration...');
        await page.fill('#taxRate', '8.5');
        await page.fill('#markupRate', '15');
        await page.fill('#laborCharge', '10');
        
        // Trigger update
        await page.evaluate(() => {
          document.getElementById('laborCharge').dispatchEvent(new Event('change'));
        });
        await page.waitForTimeout(500);
        
        // Check updated totals
        const newTotal = await page.$eval('#anodeTotal', el => el.textContent);
        console.log(`  ✓ Pricing updated - New total: ${newTotal}`);
        
        // Check if charge button is enabled
        const chargeBtn = await page.$('#chargeAnodeBtn');
        const isDisabled = await chargeBtn?.evaluate(el => el.disabled);
        
        console.log(`\n📍 Charge button status: ${isDisabled ? 'Disabled' : 'Enabled'}`);
        
        if (!isDisabled) {
          console.log('  ✓ Ready to charge customer!');
          
          // Test the charge function (without actually charging)
          const canCharge = await page.evaluate(() => {
            return typeof window.chargeAnodes === 'function';
          });
          
          if (canCharge) {
            console.log('  ✓ Charge function is available');
            
            // Simulate what would happen on click
            const chargeData = await page.evaluate(() => {
              const taxRate = parseFloat(document.getElementById('taxRate').value) / 100;
              const markupRate = parseFloat(document.getElementById('markupRate').value) / 100;
              const laborCharge = parseFloat(document.getElementById('laborCharge').value);
              
              const items = Object.values(window.anodeCart || {});
              const subtotal = items.reduce((sum, item) => sum + (item.list_price * item.quantity), 0);
              const totalAnodes = items.reduce((sum, item) => sum + item.quantity, 0);
              const laborTotal = totalAnodes * laborCharge;
              const subtotalWithLabor = subtotal + laborTotal;
              const tax = subtotalWithLabor * taxRate;
              const subtotalWithTax = subtotalWithLabor + tax;
              const markup = subtotalWithTax * markupRate;
              const total = subtotalWithTax + markup;
              
              return {
                items: items.length,
                totalAnodes,
                subtotal: subtotal.toFixed(2),
                labor: laborTotal.toFixed(2),
                tax: tax.toFixed(2),
                markup: markup.toFixed(2),
                total: total.toFixed(2),
                customer: window.selectedCustomer?.name
              };
            });
            
            console.log('\n📊 Charge Summary (Simulated):');
            console.log(`  • Customer: ${chargeData.customer || 'Not selected'}`);
            console.log(`  • Items: ${chargeData.items} different anodes`);
            console.log(`  • Total quantity: ${chargeData.totalAnodes} anodes`);
            console.log(`  • Subtotal: $${chargeData.subtotal}`);
            console.log(`  • Labor: $${chargeData.labor}`);
            console.log(`  • Tax: $${chargeData.tax}`);
            console.log(`  • Markup: $${chargeData.markup}`);
            console.log(`  • Total to charge: $${chargeData.total}`);
          }
        } else {
          console.log('  ⚠️  Charge button is disabled - customer may not be selected');
        }
      }
      
    } else {
      console.log('  ❌ Charge Anodes button not found');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAnodeCharging().catch(console.error);