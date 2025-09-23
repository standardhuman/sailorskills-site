import { chromium } from 'playwright';

async function testWizardForm() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Admin Wizard Form\n');
  
  try {
    // Navigate to admin interface
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('✅ Admin page loaded');
    
    // Search for a customer
    await page.fill('#customerSearch', 'brian');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    
    // Select first customer if available
    const customers = await page.$$('.customer-item');
    if (customers.length > 0) {
      await customers[0].click();
      console.log('✅ Customer selected');
      
      // Test 1: Recurring Cleaning Service
      console.log('\n📋 Test 1: Recurring Cleaning Service');
      const recurringBtn = await page.$('button:has-text("Recurring Cleaning")');
      if (recurringBtn) {
        // First click to expand
        await recurringBtn.click();
        await page.waitForTimeout(500);
        console.log('  - First click: button expanded');
        
        // Second click to open wizard
        await recurringBtn.click();
        await page.waitForTimeout(1000);
        console.log('  - Second click: opening wizard');
        
        // Check for duplicate forms
        const wizardContainers = await page.$$('#wizardContainer');
        console.log(`  - Found ${wizardContainers.length} wizard container(s)`);
        
        const formSections = await page.$$('.form-section');
        console.log(`  - Found ${formSections.length} form section(s)`);
        
        // Check if service name is displayed
        const serviceNameElements = await page.$$('text=/Recurring Cleaning/i');
        console.log(`  - Service name displayed: ${serviceNameElements.length > 0 ? 'Yes' : 'No'}`);
        
        // Check for back button
        const backButtons = await page.$$('button:has-text("Back")');
        console.log(`  - Back button present: ${backButtons.length > 0 ? 'Yes' : 'No'}`);
        
        // Check for required fields
        const boatName = await page.$('#wizardBoatName');
        const boatLength = await page.$('#wizardBoatLength');
        const boatType = await page.$('input[name="wizard_boat_type"]');
        const hullType = await page.$('input[name="wizard_hull_type"]');
        const paintCondition = await page.$('#wizardPaintConditionButtons');
        const growthLevel = await page.$('#wizardGrowthLevelButtons');
        
        console.log('  - Required fields present:');
        console.log(`    • Boat Name: ${boatName ? 'Yes' : 'No'}`);
        console.log(`    • Boat Length: ${boatLength ? 'Yes' : 'No'}`);
        console.log(`    • Boat Type: ${boatType ? 'Yes' : 'No'}`);
        console.log(`    • Hull Type: ${hullType ? 'Yes' : 'No'}`);
        console.log(`    • Paint Condition: ${paintCondition ? 'Yes' : 'No'}`);
        console.log(`    • Growth Level: ${growthLevel ? 'Yes' : 'No'}`);
        
        // Check hull type options
        const hullOptions = await page.$$eval('input[name="wizard_hull_type"]', 
          inputs => inputs.map(i => i.value)
        );
        console.log(`  - Hull type options: ${hullOptions.join(', ')}`);
        const hasTrimaran = hullOptions.includes('trimaran');
        console.log(`  - Has trimaran option: ${hasTrimaran ? 'Yes' : 'No (MISSING!)'}`);
      }
      
      // Wait before testing next service
      await page.waitForTimeout(2000);
      
      // Go back to service selection (if back button exists)
      const backBtn = await page.$('button:has-text("Back")');
      if (backBtn) {
        await backBtn.click();
        await page.waitForTimeout(1000);
        console.log('\n✅ Clicked back button');
      } else {
        // Reload page to reset
        await page.reload();
        await page.waitForTimeout(2000);
        await page.fill('#customerSearch', 'brian');
        await page.click('button:has-text("Search")');
        await page.waitForTimeout(2000);
        const customers = await page.$$('.customer-item');
        if (customers.length > 0) {
          await customers[0].click();
        }
      }
      
      // Test 2: Item Recovery Service (should not ask for paint/growth)
      console.log('\n📋 Test 2: Item Recovery Service');
      const itemRecoveryBtn = await page.$('button:has-text("Item Recovery")');
      if (itemRecoveryBtn) {
        await itemRecoveryBtn.click();
        await page.waitForTimeout(500);
        await itemRecoveryBtn.click();
        await page.waitForTimeout(1000);
        
        // Check what fields are present
        const paintCondition = await page.$('#wizardPaintConditionButtons');
        const growthLevel = await page.$('#wizardGrowthLevelButtons');
        const boatType = await page.$('input[name="wizard_boat_type"]');
        
        console.log('  - Fields present:');
        console.log(`    • Paint Condition: ${paintCondition ? 'Yes (SHOULD NOT BE!)' : 'No'}`);
        console.log(`    • Growth Level: ${growthLevel ? 'Yes (SHOULD NOT BE!)' : 'No'}`);
        console.log(`    • Boat Type: ${boatType ? 'Yes (SHOULD NOT BE!)' : 'No'}`);
      }
      
    } else {
      console.log('❌ No customers found to test with');
    }
    
    console.log('\n✅ Tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testWizardForm().catch(console.error);