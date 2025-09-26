import { chromium } from 'playwright';

async function testUnifiedCharging() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Unified Charging Flow\n');
  
  try {
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // Select a customer first
    console.log('📍 Selecting a customer...');
    const customerSearch = await page.$('#customerSearch');
    if (customerSearch) {
      await customerSearch.type('test');
      await page.waitForTimeout(500);
      
      const customerItem = await page.$('.customer-item');
      if (customerItem) {
        await customerItem.click();
        console.log('  ✓ Customer selected');
        await page.waitForTimeout(500);
      } else {
        console.log('  ℹ️  No customer found - creating mock selection');
        await page.evaluate(() => {
          window.selectedCustomer = {
            id: 'test-123',
            name: 'Test Customer',
            email: 'test@example.com',
            stripe_customer_id: 'cus_test123',
            payment_method: {
              card: { last4: '4242' }
            }
          };
          window.selectedBoat = {
            id: 'boat-123',
            name: 'Test Boat'
          };
          // Update charge summary
          if (typeof updateChargeSummary === 'function') {
            updateChargeSummary();
          }
        });
      }
    }
    
    // Test 1: Regular service + anodes
    console.log('\n📍 Test 1: Regular Service + Anodes');
    console.log('  Selecting One-Time Cleaning service...');
    const cleaningBtn = await page.$('button:has-text("One-Time Cleaning")');
    if (cleaningBtn) {
      await cleaningBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Service selected');
      
      // Fill in boat details
      const boatLengthInput = await page.$('#wizardBoatLength');
      if (boatLengthInput) {
        await boatLengthInput.fill('35');
        console.log('  ✓ Entered boat length: 35 ft');
      }
      
      // Look for "Add Anodes" button
      const addAnodesBtn = await page.$('button:has-text("Add Anodes")');
      if (addAnodesBtn) {
        console.log('  ✓ Found "Add Anodes to Service" button');
        await addAnodesBtn.click();
        await page.waitForTimeout(1000);
        
        // Check if anode section appeared
        const anodeSection = await page.$('#anode-section');
        if (anodeSection && await anodeSection.isVisible()) {
          console.log('  ✓ Anode section opened');
          
          // Add some anodes
          const anodeItems = await page.$$('.anode-item');
          if (anodeItems.length > 0) {
            const plusBtn = await anodeItems[0].$('.quantity-btn:has-text("+")');
            if (plusBtn) {
              await plusBtn.click();
              await plusBtn.click();
              console.log('  ✓ Added 2 anodes to cart');
            }
          }
        }
      } else {
        console.log('  ❌ "Add Anodes" button not found');
      }
      
      // Check charge summary
      const chargeDetails = await page.$('#chargeDetails');
      if (chargeDetails) {
        const summaryText = await chargeDetails.innerText();
        console.log('\n📊 Charge Summary:');
        console.log(summaryText.split('\\n').map(line => '    ' + line).join('\\n'));
      }
    }
    
    // Test 2: Anodes Only service
    console.log('\n📍 Test 2: Anodes Only Service');
    
    // Go back to services
    const backBtn = await page.$('button:has-text("Back to Services")');
    if (backBtn) {
      await backBtn.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('  Selecting Anodes Only service...');
    const anodesOnlyBtn = await page.$('button:has-text("Anodes Only")');
    if (anodesOnlyBtn) {
      await anodesOnlyBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Anodes Only service selected');
      
      // Check if anode section is automatically shown
      const anodeSection = await page.$('#anode-section');
      if (anodeSection) {
        const isVisible = await anodeSection.isVisible();
        if (isVisible) {
          console.log('  ✓ Anode section automatically opened');
        } else {
          console.log('  ℹ️  Anode section not auto-opened, clicking button...');
          const selectAnodesBtn = await page.$('button:has-text("Select Anodes")');
          if (selectAnodesBtn) {
            await selectAnodesBtn.click();
            await page.waitForTimeout(1000);
            console.log('  ✓ Opened anode section manually');
          }
        }
      }
      
      // Check charge summary for $150 minimum
      const chargeDetails = await page.$('#chargeDetails');
      if (chargeDetails) {
        const summaryText = await chargeDetails.innerText();
        if (summaryText.includes('150')) {
          console.log('  ✓ $150 minimum service fee shown');
        }
        console.log('\n📊 Anodes Only Charge Summary:');
        console.log(summaryText.split('\\n').map(line => '    ' + line).join('\\n'));
      }
    } else {
      console.log('  ❌ Anodes Only service not found');
    }
    
    // Test 3: Check unified total calculation
    console.log('\n📍 Test 3: Unified Total Calculation');
    const editableAmount = await page.$('#editableAmount');
    if (editableAmount) {
      const total = await editableAmount.inputValue();
      console.log(`  ✓ Total charge amount: $${total}`);
      
      // Check if charge button is enabled
      const chargeButton = await page.$('#chargeButton');
      if (chargeButton) {
        const isDisabled = await chargeButton.isDisabled();
        console.log(`  ✓ Charge button status: ${isDisabled ? 'Disabled' : 'Enabled'}`);
      }
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testUnifiedCharging().catch(console.error);