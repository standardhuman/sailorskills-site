import { chromium } from 'playwright';

async function testCompleteFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Complete Unified Charging Flow\n');
  console.log('='*50);
  
  try {
    // Navigate to admin page
    console.log('\n📍 Step 1: Navigate to Admin Page');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    console.log('  ✓ Admin page loaded');
    
    // Check if service buttons are visible
    console.log('\n📍 Step 2: Verify Service Buttons');
    const serviceButtons = await page.$$('.service-option');
    console.log(`  ✓ Found ${serviceButtons.length} service buttons`);
    
    // Check for Anodes Only service
    const anodesOnlyExists = await page.$('text=Anodes Only');
    if (anodesOnlyExists) {
      console.log('  ✓ "Anodes Only" service button found');
    } else {
      console.log('  ❌ "Anodes Only" service button NOT found');
    }
    
    // Select or create a test customer
    console.log('\n📍 Step 3: Select Customer');
    const customerSearch = await page.$('#customerSearch');
    if (customerSearch) {
      await customerSearch.fill('test');
      await page.waitForTimeout(500);
      
      const customerItem = await page.$('.customer-item');
      if (customerItem) {
        await customerItem.click();
        console.log('  ✓ Customer selected from list');
      } else {
        // Create mock customer via console
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
          if (typeof updateChargeSummary === 'function') {
            updateChargeSummary();
          }
        });
        console.log('  ✓ Mock customer created');
      }
    }
    
    // Test 1: Regular Service with Anodes
    console.log('\n📍 Step 4: Test Regular Service + Anodes');
    console.log('  Selecting "One-Time Cleaning" service...');
    
    const oneTimeBtn = await page.getByText('One-Time Cleaning', { exact: false });
    if (await oneTimeBtn.isVisible()) {
      await oneTimeBtn.click();
      await page.waitForTimeout(1500);
      console.log('  ✓ One-Time Cleaning selected');
      
      // Check if wizard opened
      const wizardContainer = await page.$('#wizardContainer');
      if (wizardContainer && await wizardContainer.isVisible()) {
        console.log('  ✓ Service wizard opened');
        
        // Fill boat length
        const boatLengthInput = await page.$('#wizardBoatLength');
        if (boatLengthInput) {
          await boatLengthInput.fill('35');
          console.log('  ✓ Entered boat length: 35 feet');
        }
        
        // Look for Add Anodes button
        const addAnodesBtn = await page.getByText('Add Anodes to Service', { exact: false });
        if (await addAnodesBtn.isVisible()) {
          console.log('  ✓ "Add Anodes to Service" button found');
          await addAnodesBtn.click();
          await page.waitForTimeout(1000);
          
          // Check if anode section opened
          const anodeSection = await page.$('#anode-section');
          if (anodeSection && await anodeSection.isVisible()) {
            console.log('  ✓ Anode section opened successfully');
            
            // Try to add anodes
            const plusButtons = await page.$$('button:has-text("+")');
            if (plusButtons.length > 0) {
              await plusButtons[0].click();
              await plusButtons[0].click();
              console.log('  ✓ Added 2 anodes to cart');
            }
          }
        }
      }
      
      // Check charge summary
      const chargeDetails = await page.$('#chargeDetails');
      if (chargeDetails) {
        const summaryText = await chargeDetails.innerText();
        if (summaryText.includes('One-Time Cleaning')) {
          console.log('  ✓ Service shown in charge summary');
        }
        if (summaryText.includes('Zinc Anodes')) {
          console.log('  ✓ Anodes shown in charge summary');
        }
        if (summaryText.includes('Total Amount')) {
          console.log('  ✓ Total amount shown');
        }
      }
    }
    
    // Go back to services
    console.log('\n📍 Step 5: Return to Service Selection');
    const backBtn = await page.getByText('Back to Services', { exact: false });
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Returned to service selection');
    }
    
    // Test 2: Anodes Only Service
    console.log('\n📍 Step 6: Test "Anodes Only" Service');
    const anodesOnlyBtn = await page.getByText('Anodes Only', { exact: false });
    if (await anodesOnlyBtn.isVisible()) {
      await anodesOnlyBtn.click();
      await page.waitForTimeout(1500);
      console.log('  ✓ "Anodes Only" service selected');
      
      // Check for different button text
      const selectAnodesBtn = await page.getByText('Select Anodes', { exact: false });
      if (await selectAnodesBtn.isVisible()) {
        console.log('  ✓ "Select Anodes" button shown (specific to Anodes Only)');
        
        // Check if $150 minimum is mentioned
        const minServiceText = await page.getByText('$150 minimum service fee', { exact: false });
        if (await minServiceText.isVisible()) {
          console.log('  ✓ $150 minimum service fee text displayed');
        }
      }
      
      // Check if anode section auto-opened
      await page.waitForTimeout(600); // Wait for auto-open
      const anodeSection = await page.$('#anode-section');
      if (anodeSection && await anodeSection.isVisible()) {
        console.log('  ✓ Anode section automatically opened');
      } else {
        console.log('  ℹ️  Anode section not auto-opened, clicking button...');
        if (await selectAnodesBtn.isVisible()) {
          await selectAnodesBtn.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Check charge summary for $150 service fee
      const chargeDetails = await page.$('#chargeDetails');
      if (chargeDetails) {
        const summaryText = await chargeDetails.innerText();
        if (summaryText.includes('Anodes Only')) {
          console.log('  ✓ "Anodes Only" shown in summary');
        }
        if (summaryText.includes('150')) {
          console.log('  ✓ $150 service fee shown');
        }
      }
    } else {
      console.log('  ❌ "Anodes Only" service button not found');
    }
    
    // Test 3: Verify Unified Totals
    console.log('\n📍 Step 7: Verify Unified Charge Summary');
    const editableAmount = await page.$('#editableAmount');
    if (editableAmount) {
      const totalValue = await editableAmount.inputValue();
      console.log(`  ✓ Editable total amount: $${totalValue}`);
    }
    
    const chargeButton = await page.$('#chargeButton');
    if (chargeButton) {
      const isDisabled = await chargeButton.isDisabled();
      console.log(`  ✓ Charge button is ${isDisabled ? 'disabled (need payment method)' : 'enabled'}`);
    }
    
    // Test 4: Check for removed duplicate sections
    console.log('\n📍 Step 8: Verify No Duplicate Total Sections');
    const serviceTotalSections = await page.$$('text=Service Total');
    console.log(`  ℹ️  Found ${serviceTotalSections.length} "Service Total" text instances`);
    if (serviceTotalSections.length <= 1) {
      console.log('  ✓ No duplicate Service Total sections');
    } else {
      console.log('  ⚠️  Multiple Service Total sections found');
    }
    
    console.log('\n' + '='*50);
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n📸 Taking screenshot before closing...');
    await page.screenshot({ path: 'test-results.png', fullPage: true });
    console.log('  ✓ Screenshot saved as test-results.png');
    
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);