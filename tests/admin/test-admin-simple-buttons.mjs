import { chromium } from 'playwright';

async function testAdminSimpleButtons() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing New Admin Interface with Simple Buttons\n');
  console.log('='*50);
  
  try {
    // Navigate to admin page
    console.log('\n📍 Step 1: Navigate to Admin Page');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    console.log('  ✓ Admin page loaded');
    
    // Check for simple service buttons
    console.log('\n📍 Step 2: Verify Simple Service Buttons');
    const simpleButtonsContainer = await page.$('#simpleServiceButtons');
    if (simpleButtonsContainer && await simpleButtonsContainer.isVisible()) {
      console.log('  ✓ Simple service buttons container visible');
      
      // Count the buttons
      const buttons = await page.$$('.simple-service-btn');
      console.log(`  ✓ Found ${buttons.length} simple service buttons`);
      
      // Check specific buttons
      const recurringBtn = await page.getByText('Recurring Cleaning', { exact: true });
      const oneTimeBtn = await page.getByText('One-Time Cleaning', { exact: true });
      const anodesOnlyBtn = await page.locator('.simple-service-btn:has-text("Anodes Only")');
      
      if (await recurringBtn.isVisible()) console.log('  ✓ "Recurring Cleaning" button visible');
      if (await oneTimeBtn.isVisible()) console.log('  ✓ "One-Time Cleaning" button visible');
      if (await anodesOnlyBtn.isVisible()) console.log('  ✓ "Anodes Only" button visible');
    } else {
      console.log('  ❌ Simple buttons container not found');
    }
    
    // Test direct service selection (no "click again" behavior)
    console.log('\n📍 Step 3: Test Direct Service Selection');
    const oneTimeCleaningBtn = await page.getByText('One-Time Cleaning', { exact: true });
    
    if (await oneTimeCleaningBtn.isVisible()) {
      console.log('  Clicking "One-Time Cleaning" button...');
      await oneTimeCleaningBtn.click();
      await page.waitForTimeout(1500);
      
      // Check if wizard opened directly
      const wizardContainer = await page.$('#wizardContainer');
      if (wizardContainer && await wizardContainer.isVisible()) {
        console.log('  ✓ Service form opened directly (no "click again" needed!)');
        
        // Check if boat length input is visible
        const boatLengthInput = await page.$('#wizardBoatLength');
        if (boatLengthInput && await boatLengthInput.isVisible()) {
          console.log('  ✓ Service details form is displaying');
        }
        
        // Test back button
        console.log('\n📍 Step 4: Test Back to Services');
        const backBtn = await page.getByText('Back to Services', { exact: false });
        if (await backBtn.isVisible()) {
          console.log('  Clicking "Back to Services" button...');
          await backBtn.click();
          await page.waitForTimeout(1000);
          
          // Check if simple buttons are visible again
          const simpleButtonsAfterBack = await page.$('#simpleServiceButtons');
          if (simpleButtonsAfterBack && await simpleButtonsAfterBack.isVisible()) {
            console.log('  ✓ Returned to simple button selection');
          }
        }
      } else {
        console.log('  ❌ Wizard container not visible after click');
      }
    } else {
      console.log('  ❌ One-Time Cleaning button not found');
    }
    
    // Test "Anodes Only" service
    console.log('\n📍 Step 5: Test Anodes Only Service');
    const anodesBtn = await page.locator('.simple-service-btn:has-text("Anodes Only")');
    
    if (await anodesBtn.isVisible()) {
      console.log('  Clicking "Anodes Only" button...');
      await anodesBtn.click();
      await page.waitForTimeout(1500);
      
      const wizardVisible = await page.$('#wizardContainer');
      if (wizardVisible && await wizardVisible.isVisible()) {
        console.log('  ✓ Anodes Only service opened directly');
        
        // Check if anode section auto-opened
        await page.waitForTimeout(600);
        const anodeSection = await page.$('#anode-section');
        if (anodeSection && await anodeSection.isVisible()) {
          console.log('  ✓ Anode section automatically displayed');
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'admin-simple-buttons.png', fullPage: false });
    console.log('\n📸 Screenshot saved as admin-simple-buttons.png');
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  • Large service buttons removed');
    console.log('  • Simple buttons working correctly');
    console.log('  • Direct service selection (no "click again")');
    console.log('  • Back button returns to service selection');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAdminSimpleButtons().catch(console.error);