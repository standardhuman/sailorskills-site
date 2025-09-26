import puppeteer from 'puppeteer';

async function testAdminChanges() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing admin interface changes...\n');
    
    // Navigate to admin interface
    await page.goto('http://localhost:3000/admin.html');
    
    // Wait for page to load
    await page.waitForSelector('h2', { timeout: 5000 });
    console.log('✓ Admin page loaded');
    
    // Search for a customer
    await page.type('#customerSearch', 'brian');
    await page.click('button:text("Search")');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Try to select first customer
    const customers = await page.$$('.customer-item');
    if (customers.length > 0) {
      await customers[0].click();
      console.log('✓ Customer selected');
      
      // Look for Add Payment Method button
      await page.waitForTimeout(1000);
      const addPaymentBtns = await page.$$('button');
      let paymentBtn = null;
      
      for (const btn of addPaymentBtns) {
        const text = await btn.evaluate(el => el.textContent);
        if (text && text.includes('Add Payment Method')) {
          paymentBtn = btn;
          break;
        }
      }
      
      if (paymentBtn) {
        await paymentBtn.click();
        console.log('✓ Opened payment method modal');
        
        // Wait for modal to appear
        await page.waitForSelector('#paymentMethodModal', { visible: true, timeout: 5000 });
        
        // Check form attributes
        const formAutocomplete = await page.$eval('#payment-form', form => form.getAttribute('autocomplete'));
        const formDataPrivate = await page.$eval('#payment-form', form => form.getAttribute('data-private'));
        
        console.log(`✓ Form autocomplete="${formAutocomplete}" (should be "off")`);
        console.log(`✓ Form data-private="${formDataPrivate}" (should be "true")`);
        
        if (formAutocomplete !== 'off') {
          console.error('✗ ERROR: autocomplete is not "off"');
        }
        if (formDataPrivate !== 'true') {
          console.error('✗ ERROR: data-private is not "true"');
        }
        
        // Close modal
        await page.click('#paymentMethodModal .close');
        await page.waitForSelector('#paymentMethodModal', { hidden: true });
        console.log('✓ Closed payment modal');
      }
    }
    
    // Test boat configuration visibility
    console.log('\n--- Testing Boat Configuration Visibility ---');
    
    // Click on a service button
    const serviceButtons = await page.$$('.service-button');
    if (serviceButtons.length > 0) {
      await serviceButtons[0].click();
      console.log('✓ Clicked service button');
      
      // Check boat config section
      const boatConfigSection = await page.$('#boatConfigSection');
      if (boatConfigSection) {
        const isVisible = await boatConfigSection.isVisible();
        const displayStyle = await page.$eval('#boatConfigSection', el => window.getComputedStyle(el).display);
        
        console.log(`✓ Boat config visible: ${isVisible} (should be false)`);
        console.log(`✓ Boat config display: ${displayStyle} (should be "none")`);
        
        if (isVisible) {
          console.error('✗ ERROR: Boat configuration section is visible when it should be hidden');
        }
      } else {
        console.log('✓ Boat configuration section not found (good)');
      }
      
      // Double-click to test wizard
      await serviceButtons[0].click();
      await serviceButtons[0].click();
      console.log('✓ Double-clicked service button');
      
      await page.waitForTimeout(1000);
      
      // Check wizard container
      const wizardContainer = await page.$('#wizardContainer');
      if (wizardContainer) {
        const wizardVisible = await wizardContainer.isVisible();
        console.log(`✓ Wizard visible: ${wizardVisible}`);
        
        // Re-check boat config is still hidden
        if (boatConfigSection) {
          const stillHidden = !(await boatConfigSection.isVisible());
          console.log(`✓ Boat config still hidden with wizard: ${stillHidden}`);
        }
      }
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testAdminChanges();