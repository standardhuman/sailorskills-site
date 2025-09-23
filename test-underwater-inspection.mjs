import { chromium } from 'playwright';

async function testUnderwaterInspection() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Underwater Inspection Service\n');
  
  try {
    // Test 1: Public diving page
    console.log('📍 Test 1: Public /diving page');
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(2000);
    
    // Click on Underwater Inspection
    const inspectionBtn = await page.$('.service-option:has-text("Underwater Inspection")');
    if (inspectionBtn) {
      // First click to expand
      await inspectionBtn.click();
      await page.waitForTimeout(500);
      console.log('  ✓ First click: button expanded');
      
      // Second click to proceed
      await inspectionBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Second click: proceeding to form');
      
      // Should be on boat length step
      const boatLengthStep = await page.$('#step-1');
      const isBoatLengthVisible = await boatLengthStep?.isVisible();
      console.log(`  ✓ Boat length step visible: ${isBoatLengthVisible}`);
      
      // Check current step value
      const currentStep = await page.evaluate(() => window.currentStep);
      console.log(`  ✓ Current step value: ${currentStep}`);
      
      // If not visible, try to make it visible
      if (!isBoatLengthVisible) {
        await page.evaluate(() => {
          const step1 = document.getElementById('step-1');
          if (step1) {
            step1.style.display = 'block';
            step1.classList.add('active');
          }
        });
        await page.waitForTimeout(500);
      }
      
      // Fill boat length
      await page.fill('#boatLength', '40');
      console.log('  ✓ Filled boat length: 40ft');
      
      // Click Next
      await page.click('#nextButton');
      await page.waitForTimeout(1000);
      
      // Should be on hull type step (step 3)
      const hullTypeStep = await page.$('#step-3');
      const isHullTypeVisible = await hullTypeStep?.isVisible();
      console.log(`  ✓ Hull type step visible: ${isHullTypeVisible}`);
      
      // Select catamaran
      await page.click('input[name="hull_type"][value="catamaran"]');
      console.log('  ✓ Selected catamaran hull type');
      
      // Click to view estimate
      await page.click('#nextButton');
      await page.waitForTimeout(1000);
      
      // Check the results
      const totalCost = await page.textContent('#totalCostDisplay');
      console.log(`  ✓ Total cost displayed: ${totalCost}`);
    } else {
      console.log('  ❌ Underwater Inspection button not found');
    }
    
    // Test 2: Admin interface
    console.log('\n📍 Test 2: Admin interface at /admin');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    // Search for a customer
    await page.fill('#customerSearch', 'brian');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    
    // Select first customer if available
    const customers = await page.$$('.customer-item');
    if (customers.length > 0) {
      await customers[0].click();
      console.log('  ✓ Customer selected');
      
      // Click on Underwater Inspection
      const adminInspectionBtn = await page.$(`.service-option:has-text("Underwater Inspection")`);
      if (adminInspectionBtn) {
        // First click to expand
        await adminInspectionBtn.click();
        await page.waitForTimeout(500);
        console.log('  ✓ First click: button expanded');
        
        // Second click to open form
        await adminInspectionBtn.click();
        await page.waitForTimeout(1500);
        console.log('  ✓ Second click: form opened');
        
        // Check what sections are shown
        const formSections = await page.$$('.form-section h3');
        console.log('  ✓ Form sections:');
        for (const section of formSections) {
          const text = await section.textContent();
          console.log(`    - ${text}`);
        }
        
        // Verify only boat info and hull config are shown
        const boatTypePresent = await page.$('input[name="wizard_boat_type"]');
        const paintConditionPresent = await page.$('#wizardPaintConditionButtons');
        const growthLevelPresent = await page.$('#wizardGrowthLevelButtons');
        
        console.log('\n  Field check:');
        console.log(`    • Boat type (sailboat/powerboat): ${boatTypePresent ? 'Present ❌' : 'Not present ✅'}`);
        console.log(`    • Paint condition: ${paintConditionPresent ? 'Present ❌' : 'Not present ✅'}`);
        console.log(`    • Growth level: ${growthLevelPresent ? 'Present ❌' : 'Not present ✅'}`);
        
        // Check hull type is present
        const hullTypePresent = await page.$('input[name="wizard_hull_type"]');
        console.log(`    • Hull type: ${hullTypePresent ? 'Present ✅' : 'Not present ❌'}`);
      } else {
        console.log('  ❌ Underwater Inspection button not found');
      }
    } else {
      console.log('  ❌ No customers found');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testUnderwaterInspection().catch(console.error);