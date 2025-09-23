import { chromium } from 'playwright';

async function testSurchargeRemoval() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Surcharge Removal for Non-Cleaning Services\n');
  
  try {
    // Test each non-cleaning service
    const nonCleaningServices = [
      'Underwater Inspection',
      'Item Recovery',
      'Propeller Removal/Installation'
    ];
    
    for (const serviceName of nonCleaningServices) {
      console.log(`\n📍 Testing ${serviceName}`);
      
      await page.goto('http://localhost:3000/diving');
      await page.waitForTimeout(1500);
      
      // Click on the service
      const serviceBtn = await page.$(`.service-option:has-text("${serviceName}")`);
      if (serviceBtn) {
        // First click to expand
        await serviceBtn.click();
        await page.waitForTimeout(500);
        
        // Second click to proceed
        await serviceBtn.click();
        await page.waitForTimeout(1000);
        
        // Handle navigation based on service
        if (serviceName === 'Underwater Inspection') {
          // Fill boat length
          await page.evaluate(() => {
            const input = document.getElementById('boatLength');
            if (input) {
              input.value = '40';
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          
          // Click Next
          await page.click('#nextButton');
          await page.waitForTimeout(1000);
          
          // Select hull type
          await page.evaluate(() => {
            const catamaran = document.querySelector('input[name="hull_type"][value="catamaran"]');
            if (catamaran) {
              catamaran.click();
            }
          });
          
          // View estimate
          await page.click('#nextButton');
          await page.waitForTimeout(1000);
        } else {
          // For Item Recovery and Propeller service, they should go straight to anodes or results
          // Check if we need to click next for anodes
          const nextBtn = await page.$('#nextButton');
          if (nextBtn) {
            const nextBtnText = await nextBtn.textContent();
            if (nextBtnText?.includes('View Estimate')) {
              await nextBtn.click();
              await page.waitForTimeout(1000);
            }
          }
        }
        
        // Get the cost breakdown
        const breakdown = await page.textContent('#costBreakdown');
        console.log('  Cost Breakdown:');
        
        // Check if paint or growth surcharges are mentioned
        const hasPaintSurcharge = breakdown?.toLowerCase().includes('paint');
        const hasGrowthSurcharge = breakdown?.toLowerCase().includes('growth');
        
        console.log(`    • Paint surcharge present: ${hasPaintSurcharge ? '❌ YES' : '✅ NO'}`);
        console.log(`    • Growth surcharge present: ${hasGrowthSurcharge ? '❌ YES' : '✅ NO'}`);
        
        if (hasPaintSurcharge || hasGrowthSurcharge) {
          console.log('    ⚠️  Surcharges found that should not be present!');
        } else {
          console.log('    ✅ No paint/growth surcharges - correct!');
        }
        
        // Display total cost
        const totalCost = await page.textContent('#totalCostDisplay');
        console.log(`    • Total: ${totalCost}`);
      } else {
        console.log(`  ❌ ${serviceName} button not found`);
      }
    }
    
    // Now test a cleaning service to verify surcharges ARE shown
    console.log('\n📍 Testing One-time Cleaning (should HAVE surcharges)');
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(1500);
    
    const cleaningBtn = await page.$(`.service-option:has-text("One-time Bottom Cleaning")`);
    if (cleaningBtn) {
      await cleaningBtn.click();
      await page.waitForTimeout(500);
      await cleaningBtn.click();
      await page.waitForTimeout(1000);
      
      // Fill boat length
      await page.evaluate(() => {
        const input = document.getElementById('boatLength');
        if (input) {
          input.value = '40';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      // Navigate through all steps quickly
      for (let i = 0; i < 7; i++) {
        await page.click('#nextButton');
        await page.waitForTimeout(500);
      }
      
      // Get the cost breakdown
      const breakdown = await page.textContent('#costBreakdown');
      console.log('  Cost Breakdown:');
      
      const hasPaintSurcharge = breakdown?.toLowerCase().includes('paint');
      const hasGrowthSurcharge = breakdown?.toLowerCase().includes('growth');
      
      console.log(`    • Paint surcharge present: ${hasPaintSurcharge ? '✅ YES' : '❌ NO'}`);
      console.log(`    • Growth surcharge present: ${hasGrowthSurcharge ? '✅ YES' : '❌ NO'}`);
      
      if (hasPaintSurcharge && hasGrowthSurcharge) {
        console.log('    ✅ Paint and growth surcharges present - correct for cleaning service!');
      } else {
        console.log('    ⚠️  Missing surcharges that should be present for cleaning service!');
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testSurchargeRemoval().catch(console.error);