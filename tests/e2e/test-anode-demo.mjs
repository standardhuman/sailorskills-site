import { chromium } from 'playwright';

async function demonstrateAnodeWizard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🎯 DEMONSTRATING ANODE WIZARD FUNCTIONALITY\n');
  console.log('='*60);
  
  // Listen for important console messages
  page.on('console', msg => {
    if (msg.text().includes('Loading anode catalog') || 
        msg.text().includes('Loaded') || 
        msg.text().includes('toggleAnodeSection')) {
      console.log('  📢 Console:', msg.text());
    }
  });
  
  try {
    // Step 1: Load admin page
    console.log('\n📍 Step 1: Loading Admin Page');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    console.log('  ✓ Admin page loaded at http://localhost:3000/admin');
    
    // Step 2: Select a service
    console.log('\n📍 Step 2: Selecting One-Time Cleaning Service');
    // Try to find and click the simple service button
    const serviceButtons = await page.$$('#simpleServiceButtons button');
    console.log(`  ℹ️  Found ${serviceButtons.length} service buttons`);
    
    if (serviceButtons.length > 0) {
      // Click the first service button (One-Time Cleaning)
      await serviceButtons[0].click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Clicked first service button');
      
      // Check if wizard loaded
      const wizardContent = await page.$('#wizardContent');
      if (wizardContent) {
        const content = await wizardContent.textContent();
        if (content) {
          console.log('  ✓ Wizard content loaded');
          
          // Step 3: Look for the Anode button
          console.log('\n📍 Step 3: Looking for "Add Anodes to Service" Button');
          
          // Try multiple selectors
          let anodeButton = await page.$('button:has-text("Add Anodes to Service")');
          if (!anodeButton) {
            anodeButton = await page.$('button:has-text("Select Anodes")');
          }
          
          if (anodeButton) {
            const buttonText = await anodeButton.textContent();
            console.log(`  ✓ Found button: "${buttonText.trim()}"`);
            
            // Click it
            console.log('\n📍 Step 4: Clicking Anode Button');
            await anodeButton.evaluate(btn => btn.click());
            await page.waitForTimeout(2000);
            
            // Check if anode section opened
            const anodeSection = await page.$('#anodeSection');
            if (anodeSection) {
              const isVisible = await anodeSection.isVisible();
              const display = await anodeSection.evaluate(el => window.getComputedStyle(el).display);
              
              console.log(`  ℹ️  Anode section found`);
              console.log(`  ℹ️  Is visible: ${isVisible}`);
              console.log(`  ℹ️  Display style: ${display}`);
              
              if (isVisible || display !== 'none') {
                console.log('  ✅ ANODE SECTION IS NOW VISIBLE!');
                
                // Check for key elements
                console.log('\n📍 Step 5: Checking Anode Section Contents');
                
                const taxInput = await page.$('#taxRate');
                if (taxInput) {
                  const taxValue = await taxInput.inputValue();
                  console.log(`  ✓ Tax Rate input found: ${taxValue}%`);
                }
                
                const markupInput = await page.$('#markupRate');
                if (markupInput) {
                  const markupValue = await markupInput.inputValue();
                  console.log(`  ✓ Markup Rate input found: ${markupValue}%`);
                }
                
                const laborInput = await page.$('#laborCharge');
                if (laborInput) {
                  const laborValue = await laborInput.inputValue();
                  console.log(`  ✓ Labor Charge input found: $${laborValue}`);
                }
                
                const categoryButtons = await page.$$('.category-btn');
                console.log(`  ✓ Found ${categoryButtons.length} category filter buttons`);
                
                const anodeGrid = await page.$('#anodeGrid');
                if (anodeGrid) {
                  console.log('  ✓ Anode grid container found');
                  
                  // Wait for anodes to load
                  await page.waitForTimeout(2000);
                  
                  const anodeItems = await page.$$('.anode-item');
                  console.log(`  ✓ ${anodeItems.length} anodes loaded in catalog`);
                }
              } else {
                console.log('  ❌ Anode section not visible');
              }
            } else {
              console.log('  ❌ Anode section element not found');
            }
          } else {
            console.log('  ❌ "Add Anodes to Service" button not found');
            
            // Debug: show what buttons are available
            const allButtons = await page.$$eval('button', buttons => 
              buttons.map(b => b.textContent.trim()).filter(t => t.length > 0)
            );
            console.log('  Available buttons:', allButtons.join(', '));
          }
        }
      }
    } else {
      console.log('  ❌ No service buttons found');
    }
    
    // Take screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'anode-demo.png', fullPage: true });
    console.log('  ✓ Screenshot saved as anode-demo.png');
    
    console.log('\n' + '='*60);
    console.log('🏁 DEMONSTRATION COMPLETE');
    console.log('\nTo manually test:');
    console.log('1. Go to http://localhost:3000/admin');
    console.log('2. Click any service button (e.g., "One-Time Cleaning")');
    console.log('3. Click "Add Anodes to Service" button');
    console.log('4. The anode selection panel should appear below');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'anode-error.png', fullPage: true });
    console.log('Error screenshot saved as anode-error.png');
  } finally {
    console.log('\n⏱️  Keeping browser open for 10 seconds to observe...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

demonstrateAnodeWizard();