import { chromium } from 'playwright';

async function testRecurringForm() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Recurring Cleaning Form for Redundancy\n');
  
  try {
    // Navigate to admin interface
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('✅ Admin page loaded');
    
    // Search for a customer
    await page.fill('#customerSearch', 'brian');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    
    // Select first customer
    const customers = await page.$$('.customer-item');
    if (customers.length > 0) {
      await customers[0].click();
      console.log('✅ Customer selected\n');
      
      // Find Recurring Cleaning service
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
        
        // Take screenshot of the form
        await page.screenshot({ path: 'recurring-form.png', fullPage: true });
        console.log('📸 Screenshot saved as recurring-form.png\n');
        
        // Check all form sections
        console.log('📋 Analyzing Form Sections:');
        console.log('─'.repeat(40));
        
        // Check for form sections
        const formSections = await page.$$('.form-section');
        console.log(`\nTotal form sections found: ${formSections.length}\n`);
        
        for (let i = 0; i < formSections.length; i++) {
          const section = formSections[i];
          const heading = await section.$eval('h3', el => el.textContent).catch(() => 'No heading');
          console.log(`Section ${i + 1}: ${heading}`);
          
          // List all inputs in this section
          const inputs = await section.$$('input[type="text"], input[type="radio"], input[type="checkbox"]');
          const labels = await section.$$eval('label', labels => labels.map(l => l.textContent.trim()));
          
          console.log(`  Fields in this section:`);
          for (const label of labels) {
            console.log(`    • ${label}`);
          }
          console.log();
        }
        
        // Check for duplicate boat length inputs
        const boatLengthInputs = await page.$$('[id*="boatLength"], [id*="boat_length"], input[placeholder*="35"]');
        console.log(`\n🔍 Boat Length Inputs Found: ${boatLengthInputs.length}`);
        for (const input of boatLengthInputs) {
          const id = await input.getAttribute('id');
          const placeholder = await input.getAttribute('placeholder');
          const isVisible = await input.isVisible();
          console.log(`  - ID: ${id || 'no-id'}, Placeholder: ${placeholder || 'none'}, Visible: ${isVisible}`);
        }
        
        // Check for duplicate boat name inputs
        const boatNameInputs = await page.$$('[id*="boatName"], [id*="boat_name"]');
        console.log(`\n🔍 Boat Name Inputs Found: ${boatNameInputs.length}`);
        for (const input of boatNameInputs) {
          const id = await input.getAttribute('id');
          const isVisible = await input.isVisible();
          console.log(`  - ID: ${id || 'no-id'}, Visible: ${isVisible}`);
        }
        
        // Check for any boat config sections
        const boatConfigSections = await page.$$('#boatConfigSection, .boat-config-section, [class*="boat-config"]');
        console.log(`\n🔍 Boat Config Sections Found: ${boatConfigSections.length}`);
        for (const section of boatConfigSections) {
          const id = await section.getAttribute('id');
          const className = await section.getAttribute('class');
          const isVisible = await section.isVisible();
          console.log(`  - ID: ${id || 'no-id'}, Class: ${className || 'none'}, Visible: ${isVisible}`);
        }
        
        // Check for duplicate paint/growth sections
        const paintSections = await page.$$('[id*="paint"], [id*="Paint"]');
        console.log(`\n🔍 Paint-related Elements: ${paintSections.length}`);
        
        const growthSections = await page.$$('[id*="growth"], [id*="Growth"]');
        console.log(`🔍 Growth-related Elements: ${growthSections.length}`);
        
      } else {
        console.log('❌ Recurring Cleaning button not found');
      }
    } else {
      console.log('❌ No customers found');
    }
    
    console.log('\n✅ Analysis complete!');
    console.log('\nKeeping browser open for 10 seconds for visual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testRecurringForm().catch(console.error);