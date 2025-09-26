import { chromium } from 'playwright';

async function testAdminWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Admin Workflow - No Dropdowns, No Redundant Inputs\n');
  
  try {
    // Navigate to admin interface
    await page.goto('http://localhost:3000/admin.html');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded');
    
    // Test 1: Check that there are NO dropdowns (select elements) visible
    console.log('\n📋 Test 1: Checking for dropdowns...');
    const visibleSelects = await page.$$eval('select:visible', selects => 
      selects.filter(s => window.getComputedStyle(s).display !== 'none').length
    );
    
    if (visibleSelects > 0) {
      console.error(`❌ Found ${visibleSelects} visible dropdown(s)! Should be 0`);
      const selectInfo = await page.$$eval('select', selects => 
        selects.filter(s => window.getComputedStyle(s).display !== 'none')
          .map(s => ({ id: s.id, name: s.name }))
      );
      console.log('   Visible dropdowns:', selectInfo);
    } else {
      console.log('✅ No visible dropdowns found (good!)');
    }
    
    // Test 2: Check for boat length inputs
    console.log('\n📋 Test 2: Checking boat length inputs...');
    const boatLengthInputs = await page.$$('[id*="boatLength"], [id*="boat_length"]');
    console.log(`   Found ${boatLengthInputs.length} boat length related inputs`);
    
    for (const input of boatLengthInputs) {
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      const isVisible = await input.isVisible();
      console.log(`   - ${id}: type=${type}, visible=${isVisible}`);
    }
    
    // Test 3: Create a new customer
    console.log('\n📋 Test 3: Creating new customer...');
    await page.click('button:has-text("+ New Customer")');
    await page.waitForSelector('#newCustomerModal', { state: 'visible' });
    
    // Fill in customer details
    await page.fill('#newCustomerName', 'Test Customer');
    await page.fill('#newCustomerEmail', `test${Date.now()}@example.com`);
    await page.fill('#newCustomerPhone', '555-0123');
    await page.fill('#newCustomerBoatName', 'Test Yacht');
    await page.fill('#newCustomerBoatLength', '42');
    await page.fill('#newCustomerBoatMake', 'Beneteau');
    await page.fill('#newCustomerBoatModel', 'Oceanis 45');
    
    // Check boat type and hull material are text inputs (not dropdowns)
    const boatTypeInput = await page.$('#newCustomerBoatType');
    const boatTypeTag = await boatTypeInput.evaluate(el => el.tagName);
    console.log(`   Boat Type element: ${boatTypeTag} (should be INPUT)`);
    
    const hullMaterialInput = await page.$('#newCustomerHullMaterial');
    const hullMaterialTag = await hullMaterialInput.evaluate(el => el.tagName);
    console.log(`   Hull Material element: ${hullMaterialTag} (should be INPUT)`);
    
    if (boatTypeTag === 'INPUT') {
      await page.fill('#newCustomerBoatType', 'Sailboat');
      console.log('✅ Boat Type is a text input');
    } else {
      console.error('❌ Boat Type is NOT a text input!');
    }
    
    if (hullMaterialTag === 'INPUT') {
      await page.fill('#newCustomerHullMaterial', 'Fiberglass');
      console.log('✅ Hull Material is a text input');
    } else {
      console.error('❌ Hull Material is NOT a text input!');
    }
    
    // Close modal without saving
    await page.click('#newCustomerModal .close');
    await page.waitForSelector('#newCustomerModal', { state: 'hidden' });
    console.log('✅ Customer modal closed');
    
    // Test 4: Test service selection and wizard
    console.log('\n📋 Test 4: Testing service wizard...');
    
    // Search for a customer first
    await page.fill('#customerSearch', 'brian');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    
    const customerItems = await page.$$('.customer-item');
    if (customerItems.length > 0) {
      await customerItems[0].click();
      console.log('✅ Customer selected');
      
      // Double-click on Recurring Cleaning to start wizard
      const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
      if (cleaningBtn) {
        await cleaningBtn.dblclick();
        console.log('✅ Double-clicked Recurring Cleaning');
        
        // Wait for wizard
        await page.waitForTimeout(1000);
        
        // Check if wizard has text inputs (not dropdowns)
        const wizardContainer = await page.$('#wizardContainer');
        if (wizardContainer && await wizardContainer.isVisible()) {
          console.log('✅ Wizard is visible');
          
          // Check boat length in wizard
          const wizardBoatLength = await page.$('#wizardBoatLength');
          if (wizardBoatLength) {
            const tag = await wizardBoatLength.evaluate(el => el.tagName);
            const type = await wizardBoatLength.getAttribute('type');
            console.log(`   Wizard Boat Length: ${tag} type=${type} (should be INPUT type=text)`);
            
            if (tag === 'INPUT' && type === 'text') {
              console.log('✅ Wizard boat length is a text input');
            } else {
              console.error('❌ Wizard boat length is not a text input!');
            }
          }
          
          // Click Next to go to paint condition step
          await page.click('#wizardNext');
          await page.waitForTimeout(500);
          
          // Check paint condition input
          const paintCondition = await page.$('#wizardPaintCondition');
          if (paintCondition) {
            const tag = await paintCondition.evaluate(el => el.tagName);
            console.log(`   Paint Condition: ${tag} (should be INPUT)`);
            
            if (tag === 'INPUT') {
              await page.fill('#wizardPaintCondition', 'Fair');
              console.log('✅ Paint condition is a text input');
            } else {
              console.error('❌ Paint condition is NOT a text input!');
            }
          }
          
          // Click Next to go to growth level step
          await page.click('#wizardNext');
          await page.waitForTimeout(500);
          
          // Check growth level input
          const growthLevel = await page.$('#wizardGrowthLevel');
          if (growthLevel) {
            const tag = await growthLevel.evaluate(el => el.tagName);
            console.log(`   Growth Level: ${tag} (should be INPUT)`);
            
            if (tag === 'INPUT') {
              await page.fill('#wizardGrowthLevel', 'Moderate');
              console.log('✅ Growth level is a text input');
            } else {
              console.error('❌ Growth level is NOT a text input!');
            }
          }
        }
      }
    } else {
      console.log('⚠️ No customers found to test with');
    }
    
    // Test 5: Check main form inputs
    console.log('\n📋 Test 5: Checking main form inputs...');
    
    // Check if old boat config section is hidden
    const boatConfigSection = await page.$('#boatConfigSection');
    if (boatConfigSection) {
      const isVisible = await boatConfigSection.isVisible();
      console.log(`   Boat Config Section visible: ${isVisible} (should be false)`);
      
      if (!isVisible) {
        console.log('✅ Boat config section is hidden');
      } else {
        console.error('❌ Boat config section is still visible!');
      }
    }
    
    // Check actual paint condition and growth level in main form
    const actualPaintCondition = await page.$('#actualPaintCondition');
    if (actualPaintCondition) {
      const tag = await actualPaintCondition.evaluate(el => el.tagName);
      console.log(`   Main Paint Condition: ${tag} (should be INPUT)`);
      if (tag === 'INPUT') {
        console.log('✅ Main paint condition is a text input');
      } else {
        console.error('❌ Main paint condition is NOT a text input!');
      }
    }
    
    const actualGrowthLevel = await page.$('#actualGrowthLevel');
    if (actualGrowthLevel) {
      const tag = await actualGrowthLevel.evaluate(el => el.tagName);
      console.log(`   Main Growth Level: ${tag} (should be INPUT)`);
      if (tag === 'INPUT') {
        console.log('✅ Main growth level is a text input');
      } else {
        console.error('❌ Main growth level is NOT a text input!');
      }
    }
    
    console.log('\n✅ All workflow tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000); // Keep open for visual inspection
    await browser.close();
  }
}

// Run the test
testAdminWorkflow().catch(console.error);