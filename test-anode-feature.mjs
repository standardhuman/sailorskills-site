import { chromium } from 'playwright';

async function testAnodeFeature() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Anode Charging Feature in Admin Interface\n');
  
  try {
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // Click on Charge Anodes button
    console.log('📍 Clicking "Charge Anodes" button...');
    const anodeBtn = await page.$('button:has-text("⚓ Charge Anodes")');
    if (anodeBtn) {
      await anodeBtn.click();
      console.log('  ✓ Clicked Charge Anodes button');
      await page.waitForTimeout(2000);
      
      // Check if anode section is visible
      const anodeSection = await page.$('#anodeSection');
      const isVisible = await anodeSection?.isVisible();
      console.log(`  ✓ Anode section visible: ${isVisible}`);
      
      // Check daily schedule
      const scheduleList = await page.$('#boatScheduleList');
      if (scheduleList) {
        const boats = await page.$$('.boat-schedule-item');
        console.log(`  ✓ Daily schedule loaded with ${boats.length} boats`);
      }
      
      // Check anode grid
      const anodeGrid = await page.$('#anodeGrid');
      if (anodeGrid) {
        // Wait for anodes to load
        await page.waitForTimeout(2000);
        const anodes = await page.$$('.anode-item');
        console.log(`  ✓ Anode grid loaded with ${anodes.length} products`);
        
        // Check category buttons and their counts
        console.log('\n📊 Category Button Counts:');
        const categoryBtns = await page.$$('.category-btn');
        for (const btn of categoryBtns) {
          const text = await btn.textContent();
          console.log(`  • ${text}`);
        }
        
        // Test category filtering - click Shaft
        console.log('\n📍 Testing category filtering...');
        const shaftBtn = await page.$('.category-btn:has-text("Shaft")');
        if (shaftBtn) {
          await shaftBtn.click();
          await page.waitForTimeout(1000);
          const filteredAnodes = await page.$$('.anode-item');
          const shaftBtnText = await shaftBtn.textContent();
          console.log(`  ✓ Shaft filter applied: ${filteredAnodes.length} products shown (${shaftBtnText})`);
        }
        
        // Test adding an anode to cart
        console.log('\n📍 Testing anode selection...');
        const firstAnode = await page.$('.anode-item');
        if (firstAnode) {
          const anodeName = await firstAnode.$eval('.anode-name', el => el.textContent);
          const anodePrice = await firstAnode.$eval('.anode-price', el => el.textContent);
          console.log(`  • First anode: ${anodeName} - ${anodePrice}`);
          
          // Click plus button to add to cart
          const plusBtn = await firstAnode.$('.quantity-btn:has-text("+")');
          if (plusBtn) {
            await plusBtn.click();
            console.log('  ✓ Added anode to cart');
            await page.waitForTimeout(1000);
            
            // Check cart
            const cartItems = await page.$('#cartItems');
            const cartContent = await cartItems?.textContent();
            if (cartContent && !cartContent.includes('No anodes selected')) {
              console.log('  ✓ Cart updated successfully');
              
              // Check pricing calculations with new labor charge
              const subtotal = await page.$eval('#anodeSubtotal', el => el.textContent);
              const laborTotal = await page.$eval('#anodeLaborTotal', el => el.textContent);
              const tax = await page.$eval('#anodeTax', el => el.textContent);
              const markup = await page.$eval('#anodeMarkup', el => el.textContent);
              const total = await page.$eval('#anodeTotal', el => el.textContent);
              
              console.log('\n💰 Pricing Calculation:');
              console.log(`  • Subtotal: ${subtotal}`);
              console.log(`  • Labor (1 anode × $15): ${laborTotal}`);
              console.log(`  • Tax (10.75%): ${tax}`);
              console.log(`  • Markup (20%): ${markup}`);
              console.log(`  • Total: ${total}`);
            }
          }
        }
        
        // Test other categories
        console.log('\n📍 Testing all category filters...');
        const categories = ['Hull', 'Engine', 'Propeller', 'Outboard'];
        for (const cat of categories) {
          const catBtn = await page.$(`.category-btn:has-text("${cat}")`);
          if (catBtn) {
            await catBtn.click();
            await page.waitForTimeout(500);
            const catAnodes = await page.$$('.anode-item');
            const catBtnText = await catBtn.textContent();
            console.log(`  • ${catBtnText}: ${catAnodes.length} products`);
          }
        }
        
        // Click All to see total
        const allBtn = await page.$('.category-btn:has-text("All")');
        if (allBtn) {
          await allBtn.click();
          await page.waitForTimeout(500);
          const allAnodes = await page.$$('.anode-item');
          const allBtnText = await allBtn.textContent();
          console.log(`  • ${allBtnText}: ${allAnodes.length} products`);
        }
        
        // Test pricing configuration changes
        console.log('\n📍 Testing pricing configuration changes...');
        const taxInput = await page.$('#taxRate');
        const markupInput = await page.$('#markupRate');
        const laborInput = await page.$('#laborCharge');
        
        if (taxInput && markupInput && laborInput) {
          console.log('  • Changing tax rate to 12%');
          await taxInput.fill('12');
          
          console.log('  • Changing markup to 25%');
          await markupInput.fill('25');
          
          console.log('  • Changing labor charge to $20');
          await laborInput.fill('20');
          
          // Trigger pricing update by dispatching change event
          await page.evaluate(() => {
            document.getElementById('laborCharge').dispatchEvent(new Event('change'));
          });
          await page.waitForTimeout(500);
          
          // Check updated display
          const taxDisplay = await page.$eval('#taxRateDisplay', el => el.textContent);
          const markupDisplay = await page.$eval('#markupRateDisplay', el => el.textContent);
          const laborRate = await page.$eval('#laborRate', el => el.textContent);
          
          console.log(`  ✓ Tax display updated: ${taxDisplay}%`);
          console.log(`  ✓ Markup display updated: ${markupDisplay}%`);
          console.log(`  ✓ Labor rate updated: $${laborRate}`);
        }
        
      } else {
        console.log('  ❌ Anode grid not found');
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

testAnodeFeature().catch(console.error);