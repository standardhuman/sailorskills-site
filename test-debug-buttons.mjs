import { chromium } from 'playwright';

async function debugServiceButtons() {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  console.log('🔍 Debugging Service Buttons\n');
  console.log('='*50);
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('📋 Browser console:', msg.text());
    } else if (msg.type() === 'error') {
      console.log('❌ Browser error:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', err => {
    console.log('🚨 Page error:', err.message);
  });
  
  try {
    // Navigate to admin page
    console.log('\n📍 Step 1: Navigate to Admin Page');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(3000);
    console.log('  ✓ Admin page loaded');
    
    // Check if selectServiceDirect function exists
    console.log('\n📍 Step 2: Check if selectServiceDirect exists');
    const functionExists = await page.evaluate(() => {
      return typeof window.selectServiceDirect === 'function';
    });
    console.log(`  selectServiceDirect exists: ${functionExists}`);
    
    // Check if other required functions exist
    console.log('\n📍 Step 3: Check required functions');
    const functionsCheck = await page.evaluate(() => {
      return {
        selectServiceDirect: typeof window.selectServiceDirect,
        renderConsolidatedForm: typeof window.renderConsolidatedForm,
        updateChargeSummary: typeof window.updateChargeSummary,
        backToServices: typeof window.backToServices
      };
    });
    console.log('  Function types:', functionsCheck);
    
    // Try clicking button with evaluate
    console.log('\n📍 Step 4: Try calling selectServiceDirect directly');
    try {
      const result = await page.evaluate(() => {
        if (typeof selectServiceDirect === 'function') {
          selectServiceDirect('onetime_cleaning');
          return 'Function called successfully';
        } else {
          return 'Function not defined';
        }
      });
      console.log('  Result:', result);
    } catch (err) {
      console.log('  Error calling function:', err.message);
    }
    
    // Check if wizard appeared
    await page.waitForTimeout(2000);
    const wizardVisible = await page.evaluate(() => {
      const wizard = document.getElementById('wizardContainer');
      return wizard ? wizard.style.display !== 'none' : false;
    });
    console.log(`  Wizard visible after direct call: ${wizardVisible}`);
    
    // If wizard didn't appear, try clicking the actual button
    if (!wizardVisible) {
      console.log('\n📍 Step 5: Try clicking button element');
      const button = await page.$('.simple-service-btn:has-text("One-Time Cleaning")');
      if (button) {
        console.log('  Found button, clicking...');
        await button.click();
        await page.waitForTimeout(2000);
        
        const wizardAfterClick = await page.evaluate(() => {
          const wizard = document.getElementById('wizardContainer');
          return wizard ? wizard.style.display !== 'none' : false;
        });
        console.log(`  Wizard visible after click: ${wizardAfterClick}`);
      } else {
        console.log('  Button not found');
      }
    }
    
    // Check for any errors in the console
    console.log('\n📍 Step 6: Check for JavaScript errors');
    const errors = await page.evaluate(() => {
      return window.lastError || 'No errors captured';
    });
    console.log('  Last error:', errors);
    
    // Get the onclick attribute
    console.log('\n📍 Step 7: Check button onclick attributes');
    const onclickAttrs = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.simple-service-btn');
      return Array.from(buttons).map(btn => ({
        text: btn.textContent,
        onclick: btn.getAttribute('onclick')
      }));
    });
    console.log('  Button onclick attributes:');
    onclickAttrs.forEach(btn => {
      console.log(`    ${btn.text}: ${btn.onclick}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'debug-buttons.png', fullPage: false });
    console.log('\n📸 Screenshot saved as debug-buttons.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    console.log('\n⏸️  Keeping browser open for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugServiceButtons().catch(console.error);