import { chromium } from 'playwright';

async function testFormLoading() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.text().includes('renderConsolidatedForm') || msg.text().includes('Direct service')) {
      console.log('Console:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });
  
  try {
    console.log('Navigating to admin...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    console.log('Clicking One-Time Cleaning...');
    const button = await page.locator('button:has-text("One-Time Cleaning")').first();
    await button.click();
    
    // Wait up to 5 seconds for form to load
    console.log('Waiting for form to load...');
    await page.waitForTimeout(5000);
    
    // Check what's actually in the wizard content
    const wizardText = await page.locator('#wizardContent').textContent();
    console.log('\nWizard content:', wizardText);
    
    // Check if boat information section loaded
    const boatSection = await page.locator('h3:has-text("Boat Information")').count();
    if (boatSection > 0) {
      console.log('✓ Boat Information section loaded!');
    } else {
      console.log('✗ Boat Information section NOT found');
    }
    
    // Check if boat length input exists
    const boatLengthInput = await page.locator('#wizardBoatLength').count();
    if (boatLengthInput > 0) {
      console.log('✓ Boat length input found!');
    } else {
      console.log('✗ Boat length input NOT found');
    }
    
    // Check if renderConsolidatedForm function exists
    const functionExists = await page.evaluate(() => {
      return typeof window.renderConsolidatedForm === 'function';
    });
    console.log('renderConsolidatedForm exists:', functionExists);
    
    await page.screenshot({ path: 'form-loading-test.png' });
    console.log('\nScreenshot saved');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testFormLoading();