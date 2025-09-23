import { chromium } from 'playwright';

async function testAdminQuick() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Quick Admin Test\n');
  
  try {
    // Navigate to admin interface
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('✅ Admin page loaded');
    
    // Check console for errors and logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      } else if (msg.type() === 'log') {
        console.log('📝 Console log:', msg.text());
      }
    });
    
    // Enable services without customer selection for testing
    await page.evaluate(() => {
      window.selectedCustomer = { id: 'test', name: 'Test Customer' };
      const serviceButtons = document.getElementById('serviceButtons');
      if (serviceButtons) {
        serviceButtons.classList.remove('hidden');
        serviceButtons.style.display = 'block';
      }
      const serviceSelector = document.getElementById('serviceSelector');
      if (serviceSelector) {
        serviceSelector.style.display = 'block';
      }
      if (window.populateServiceButtons) {
        window.populateServiceButtons();
      }
    });
    
    await page.waitForTimeout(1000);
    console.log('✅ Services enabled\n');
    
    // Try clicking Recurring Cleaning
    const recurringBtn = await page.$(`.service-option:has-text("Recurring Cleaning & Anodes")`);
    if (recurringBtn) {
      console.log('📋 Testing Recurring Cleaning & Anodes');
      
      // First click
      await recurringBtn.click();
      await page.waitForTimeout(500);
      console.log('  ✓ First click completed');
      
      // Check if expanded
      const isExpanded = await recurringBtn.evaluate(el => el.classList.contains('expanded'));
      console.log(`  ✓ Button expanded: ${isExpanded}`);
      
      // Second click
      await recurringBtn.click();
      await page.waitForTimeout(1500);
      console.log('  ✓ Second click completed');
      
      // Check if wizard opened
      const wizardVisible = await page.$eval('#wizardContainer', el => el.style.display !== 'none').catch(() => false);
      console.log(`  ✓ Wizard visible: ${wizardVisible}`);
      
      // Check for form content
      const formSections = await page.$$('.form-section');
      console.log(`  ✓ Form sections: ${formSections.length}`);
      
      // Check for service name
      const serviceName = await page.textContent('.form-header h2').catch(() => null);
      console.log(`  ✓ Service name: "${serviceName || 'Not found'}"`);
      
      // Check for back button
      const backBtn = await page.$('.back-btn');
      console.log(`  ✓ Back button: ${backBtn ? 'Present' : 'Missing'}`);
      
    } else {
      console.log('❌ Recurring Cleaning button not found');
    }
    
    console.log('\n✅ Test completed!');
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAdminQuick().catch(console.error);