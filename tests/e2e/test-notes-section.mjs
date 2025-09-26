import { chromium } from 'playwright';

async function testNotesSection() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Notes Section in Checkout\n');
  
  try {
    // Test with a cleaning service
    console.log('📍 Testing with One-time Cleaning Service');
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(3000);
    
    // Select One-time Cleaning - try different selectors
    let cleaningBtn = await page.$('.service-option:has-text("One-time Bottom Cleaning")');
    if (!cleaningBtn) {
      cleaningBtn = await page.$('.service-option:has-text("One-time Cleaning")');
    }
    if (!cleaningBtn) {
      cleaningBtn = await page.$('text=/One-time.*Cleaning/i');
    }
    
    if (cleaningBtn) {
      // First click to expand
      await cleaningBtn.click();
      await page.waitForTimeout(500);
      
      // Second click to proceed
      await cleaningBtn.click();
      await page.waitForTimeout(1000);
      
      // Fill boat length
      await page.evaluate(() => {
        const input = document.getElementById('boatLength');
        if (input) {
          input.value = '35';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      // Navigate through steps quickly to get to results
      for (let i = 0; i < 7; i++) {
        await page.click('#nextButton');
        await page.waitForTimeout(300);
      }
      
      // Click Proceed to Checkout
      const checkoutBtn = await page.$('#checkout-button');
      if (checkoutBtn) {
        await checkoutBtn.click();
        await page.waitForTimeout(1500);
        
        // Check if notes section exists
        const notesSection = await page.$('#customer-notes');
        if (notesSection) {
          console.log('  ✅ Notes section found');
          
          // Check the label text
          const labelText = await page.textContent('label[for="customer-notes"]');
          console.log(`  ✓ Label text: "${labelText}"`);
          
          // Check the placeholder
          const placeholder = await notesSection.getAttribute('placeholder');
          console.log(`  ✓ Has scheduling guidance in placeholder: ${placeholder.includes('scheduling') ? 'Yes' : 'No'}`);
          
          // Check the help text
          const helpText = await page.$('.field-help');
          if (helpText) {
            const helpContent = await helpText.textContent();
            console.log(`  ✓ Help text: "${helpContent}"`);
          }
          
          // Test filling in notes
          await notesSection.fill('Please schedule for this Saturday morning. Gate code is 1234.');
          console.log('  ✓ Successfully filled test notes');
          
          // Verify the notes would be included in form submission
          const formDataCheck = await page.evaluate(() => {
            const notes = document.getElementById('customer-notes');
            return notes ? notes.value : null;
          });
          
          if (formDataCheck) {
            console.log(`  ✓ Notes value captured: "${formDataCheck}"`);
            console.log('  ✅ Notes field is properly integrated');
          } else {
            console.log('  ❌ Notes value not captured');
          }
        } else {
          console.log('  ❌ Notes section not found');
        }
      } else {
        console.log('  ❌ Checkout button not found');
      }
    } else {
      console.log('  ❌ One-time Cleaning button not found');
    }
    
    // Test with Item Recovery to ensure notes also appear there
    console.log('\n📍 Testing with Item Recovery Service');
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(3000);
    
    let recoveryBtn = await page.$('.service-option:has-text("Item Recovery")');
    if (!recoveryBtn) {
      recoveryBtn = await page.$('text=/Item Recovery/i');
    }
    
    if (recoveryBtn) {
      await recoveryBtn.click();
      await page.waitForTimeout(500);
      await recoveryBtn.click();
      await page.waitForTimeout(1000);
      
      // Item Recovery should go to anodes then results
      await page.click('#nextButton');
      await page.waitForTimeout(500);
      await page.click('#nextButton');
      await page.waitForTimeout(500);
      
      // Click Proceed to Checkout
      const checkoutBtn2 = await page.$('#checkout-button');
      if (checkoutBtn2) {
        await checkoutBtn2.click();
        await page.waitForTimeout(1500);
        
        // Check if notes section exists for item recovery too
        const notesSection2 = await page.$('#customer-notes');
        if (notesSection2) {
          console.log('  ✅ Notes section found for Item Recovery');
        } else {
          console.log('  ❌ Notes section not found for Item Recovery');
        }
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

testNotesSection().catch(console.error);