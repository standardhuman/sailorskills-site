import { chromium } from 'playwright';

async function testFormDirectly() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Form Directly Without Customers\n');
  
  try {
    // Navigate to admin interface
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('✅ Admin page loaded');
    
    // Manually trigger a service selection without searching for customers
    // We'll inject a mock customer selection and service click
    await page.evaluate(() => {
      // Mock customer selection
      window.selectedCustomer = {
        id: 'test',
        name: 'Test Customer',
        email: 'test@example.com'
      };
      
      // Enable service buttons
      const serviceButtons = document.getElementById('serviceButtons');
      if (serviceButtons) {
        serviceButtons.classList.remove('hidden');
        serviceButtons.style.display = 'block';
      }
      
      // Make service selector visible
      const serviceSelector = document.getElementById('serviceSelector');
      if (serviceSelector) {
        serviceSelector.style.display = 'block';
      }
      
      // Populate service buttons if function exists
      if (window.populateServiceButtons) {
        window.populateServiceButtons();
      }
    });
    
    await page.waitForTimeout(1000);
    console.log('✅ Mocked customer selection and enabled services\n');
    
    // Test Recurring Cleaning service
    console.log('📋 Testing Recurring Cleaning & Anodes');
    console.log('─'.repeat(40));
    
    const recurringBtn = await page.$(`.service-option:has-text("Recurring Cleaning & Anodes")`);
    if (recurringBtn) {
      // First click to expand
      await recurringBtn.click();
      await page.waitForTimeout(500);
      console.log('✓ First click: button expanded');
      
      // Second click to open form
      await recurringBtn.click();
      await page.waitForTimeout(1500);
      console.log('✓ Second click: form opened\n');
      
      // Check for form sections
      const formSections = await page.$$('.form-section');
      console.log(`Form sections found: ${formSections.length}\n`);
      
      for (let i = 0; i < formSections.length; i++) {
        const section = formSections[i];
        const heading = await section.$eval('h3', el => el.textContent).catch(() => 'No heading');
        console.log(`Section ${i + 1}: ${heading}`);
        
        // Count inputs in this section
        const textInputs = await section.$$('input[type="text"]');
        const radioInputs = await section.$$('input[type="radio"]');
        const checkboxInputs = await section.$$('input[type="checkbox"]');
        const buttonGroups = await section.$$('.option-button-group');
        
        console.log(`  • Text inputs: ${textInputs.length}`);
        console.log(`  • Radio inputs: ${radioInputs.length}`);
        console.log(`  • Checkboxes: ${checkboxInputs.length}`);
        console.log(`  • Button groups: ${buttonGroups.length}`);
        console.log();
      }
      
      // Check for duplicate IDs
      console.log('🔍 Checking for duplicate elements:');
      const duplicateCheck = await page.evaluate(() => {
        const allIds = [];
        const duplicates = [];
        
        document.querySelectorAll('[id]').forEach(el => {
          const id = el.id;
          if (id && id.includes('wizard')) {
            if (allIds.includes(id)) {
              duplicates.push(id);
            } else {
              allIds.push(id);
            }
          }
        });
        
        return { allIds, duplicates };
      });
      
      console.log(`Total wizard-related IDs: ${duplicateCheck.allIds.length}`);
      if (duplicateCheck.duplicates.length > 0) {
        console.log(`❌ Duplicate IDs found: ${duplicateCheck.duplicates.join(', ')}`);
      } else {
        console.log(`✅ No duplicate IDs found`);
      }
      
      // Check specific elements
      console.log('\n🔍 Specific element check:');
      const boatNameInputs = await page.$$('#wizardBoatName, #boatName');
      console.log(`  • Boat name inputs: ${boatNameInputs.length}`);
      
      const boatLengthInputs = await page.$$('#wizardBoatLength, #boatLength');
      console.log(`  • Boat length inputs: ${boatLengthInputs.length}`);
      
      const paintButtons = await page.$$('#wizardPaintConditionButtons');
      console.log(`  • Paint condition button groups: ${paintButtons.length}`);
      
      const growthButtons = await page.$$('#wizardGrowthLevelButtons');
      console.log(`  • Growth level button groups: ${growthButtons.length}`);
      
      // Check for back button
      const backBtn = await page.$('.back-btn, button:has-text("Back")');
      console.log(`  • Back button present: ${backBtn ? 'Yes ✅' : 'No ❌'}`);
      
      // Check for service name
      const serviceName = await page.textContent('.form-header h2').catch(() => null);
      console.log(`  • Service name displayed: "${serviceName || 'Not found ❌'}"`);
      
      // Take screenshot
      await page.screenshot({ path: 'form-structure-fixed.png', fullPage: true });
      console.log('\n📸 Screenshot saved as form-structure-fixed.png');
      
    } else {
      console.log('❌ Recurring Cleaning button not found');
    }
    
    console.log('\n✅ Test completed!');
    console.log('\nKeeping browser open for 5 seconds for visual inspection...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFormDirectly().catch(console.error);