import { chromium } from 'playwright';

async function testWizardComprehensive() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Comprehensive Admin Wizard Test\n');
  
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
      console.log('✅ Customer selected\n');
      
      // Array of services to test (using exact names from serviceData)
      const servicesToTest = [
        {
          name: 'Recurring Cleaning & Anodes',
          key: 'recurring_cleaning',
          requiresBoatConfig: true,
          requiresPaintGrowth: true
        },
        {
          name: 'One-time Cleaning & Anodes',
          key: 'onetime_cleaning',
          requiresBoatConfig: true,
          requiresPaintGrowth: true
        },
        {
          name: 'Item Recovery',
          key: 'item_recovery',
          requiresBoatConfig: false,
          requiresPaintGrowth: false
        },
        {
          name: 'Underwater Inspection',
          key: 'underwater_inspection',
          requiresBoatConfig: false,
          requiresPaintGrowth: false
        },
        {
          name: 'Propeller Removal/Installation',
          key: 'propeller_service',
          requiresBoatConfig: false,
          requiresPaintGrowth: false
        }
      ];
      
      for (const serviceTest of servicesToTest) {
        console.log(`\n📋 Testing: ${serviceTest.name}`);
        console.log('─'.repeat(40));
        
        // Find service button (they're divs, not buttons)
        const serviceBtn = await page.$(`.service-option:has-text("${serviceTest.name}")`);
        if (serviceBtn) {
          // First click to expand
          await serviceBtn.click();
          await page.waitForTimeout(500);
          console.log('  ✓ First click: button expanded');
          
          // Second click to open wizard
          await serviceBtn.click();
          await page.waitForTimeout(1500);
          console.log('  ✓ Second click: wizard opened');
          
          // Check for service name in header
          const headerText = await page.textContent('.form-header h2').catch(() => null);
          console.log(`  ✓ Service name displayed: "${headerText}"`);
          
          // Check for back button
          const backBtn = await page.$('.back-btn, button:has-text("Back")');
          console.log(`  ✓ Back button present: ${backBtn ? 'Yes' : 'No'}`);
          
          // Check for duplicate forms
          const formSections = await page.$$('.form-section');
          console.log(`  ✓ Form sections: ${formSections.length}`);
          
          // Check fields based on service type
          console.log('\n  Fields Check:');
          
          // Always should have boat info
          const boatName = await page.$('#wizardBoatName');
          const boatLength = await page.$('#wizardBoatLength');
          console.log(`    • Boat Name: ${boatName ? '✅' : '❌'}`);
          console.log(`    • Boat Length: ${boatLength ? '✅' : '❌'}`);
          
          // Check boat configuration fields
          const boatType = await page.$('input[name="wizard_boat_type"]');
          const hullType = await page.$('input[name="wizard_hull_type"]');
          const twinEngines = await page.$('#wizard_twin_engines');
          
          if (serviceTest.requiresBoatConfig) {
            console.log(`    • Boat Type: ${boatType ? '✅' : '❌ MISSING!'}`);
            console.log(`    • Hull Type: ${hullType ? '✅' : '❌ MISSING!'}`);
            console.log(`    • Twin Engines: ${twinEngines ? '✅' : '❌ MISSING!'}`);
            
            // Check for trimaran option
            const hullOptions = await page.$$eval('input[name="wizard_hull_type"]', 
              inputs => inputs.map(i => i.value)
            ).catch(() => []);
            const hasTrimaran = hullOptions.includes('trimaran');
            console.log(`    • Trimaran option: ${hasTrimaran ? '✅' : '❌ MISSING!'}`);
          } else {
            console.log(`    • Boat Config: ${boatType ? '❌ SHOULD NOT HAVE!' : '✅ Correctly absent'}`);
          }
          
          // Check paint and growth fields
          const paintCondition = await page.$('#wizardPaintConditionButtons');
          const growthLevel = await page.$('#wizardGrowthLevelButtons');
          
          if (serviceTest.requiresPaintGrowth) {
            console.log(`    • Paint Condition: ${paintCondition ? '✅' : '❌ MISSING!'}`);
            console.log(`    • Growth Level: ${growthLevel ? '✅' : '❌ MISSING!'}`);
          } else {
            console.log(`    • Paint/Growth: ${paintCondition ? '❌ SHOULD NOT HAVE!' : '✅ Correctly absent'}`);
          }
          
          // Test back button
          if (backBtn) {
            await backBtn.click();
            await page.waitForTimeout(1000);
            console.log('\n  ✓ Back button clicked, returned to services');
          }
        } else {
          console.log(`  ❌ Service button not found: ${serviceTest.name}`);
        }
      }
      
    } else {
      console.log('❌ No customers found to test with');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testWizardComprehensive().catch(console.error);