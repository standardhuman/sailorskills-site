import { chromium } from 'playwright';

async function testServiceClick() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    console.log('Browser:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });
  
  try {
    console.log('Navigating to admin page...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('Clicking One-Time Cleaning button...');
    const button = await page.locator('button:has-text("One-Time Cleaning")').first();
    await button.click();
    
    console.log('Waiting for form to load...');
    await page.waitForTimeout(2000);
    
    // Check if renderConsolidatedForm exists
    const hasFunction = await page.evaluate(() => {
      return typeof window.renderConsolidatedForm === 'function';
    });
    console.log('renderConsolidatedForm exists:', hasFunction);
    
    // Get wizard content
    const wizardContent = await page.locator('#wizardContent').textContent();
    console.log('Wizard content:', wizardContent);
    
    // Try to call renderConsolidatedForm manually
    if (!wizardContent.includes('Boat Length')) {
      console.log('Form not loaded, trying manual call...');
      await page.evaluate(() => {
        if (typeof window.renderConsolidatedForm === 'function') {
          window.renderConsolidatedForm(true, 'onetime_cleaning');
        }
      });
      await page.waitForTimeout(1000);
      
      const updatedContent = await page.locator('#wizardContent').textContent();
      console.log('Updated content:', updatedContent.substring(0, 200));
    }
    
    await page.screenshot({ path: 'service-click-test.png' });
    console.log('Screenshot saved as service-click-test.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testServiceClick();