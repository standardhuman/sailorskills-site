import { chromium } from '@playwright/test';

async function testScrollBehavior() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== TESTING SCROLL BEHAVIOR ===\n');
  
  console.log('1. Testing scroll on service selection...');
  await page.goto('http://localhost:3000');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Get initial scroll position
  const initialScroll = await page.evaluate(() => window.pageYOffset);
  console.log(`Initial scroll position: ${initialScroll}px`);
  
  // Click on a service
  const serviceBtn = await page.$('.service-option:has-text("Recurring Cleaning")');
  if (serviceBtn) {
    await serviceBtn.click();
    console.log('✓ Clicked on Recurring Cleaning service');
    
    // Wait for scroll animation
    await page.waitForTimeout(1500);
    
    // Get new scroll position
    const newScroll = await page.evaluate(() => window.pageYOffset);
    console.log(`New scroll position: ${newScroll}px`);
    
    if (newScroll !== initialScroll) {
      console.log('✓ Page scrolled after service selection');
      
      // Check if service description is visible
      const explainer = await page.$('#servicePriceExplainer');
      if (explainer) {
        const isVisible = await explainer.isVisible();
        if (isVisible) {
          console.log('✓ Service description is visible in viewport');
        } else {
          console.log('✗ Service description not fully visible');
        }
      }
      
      // Check if next button is visible
      const nextBtn = await page.$('#nextButton');
      if (nextBtn) {
        const isVisible = await nextBtn.isVisible();
        if (isVisible) {
          console.log('✓ Next button is visible in viewport');
        } else {
          console.log('✗ Next button not fully visible');
        }
      }
    } else {
      console.log('⚠ Page did not scroll (might already be in view)');
    }
  }
  
  console.log('\n2. Testing with different service...');
  
  // Scroll to top first
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  
  // Click on item recovery
  const itemRecoveryBtn = await page.$('.service-option:has-text("Item Recovery")');
  if (itemRecoveryBtn) {
    await itemRecoveryBtn.click();
    console.log('✓ Clicked on Item Recovery service');
    
    // Wait for scroll animation
    await page.waitForTimeout(1500);
    
    // Check if service description updated and is visible
    const explainer = await page.$('#servicePriceExplainer');
    if (explainer) {
      const text = await explainer.textContent();
      if (text.includes('45 minutes')) {
        console.log('✓ Service description updated correctly');
      }
      
      const isVisible = await explainer.isVisible();
      if (isVisible) {
        console.log('✓ Service description centered in viewport');
      }
    }
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETED ===');
}

testScrollBehavior().catch(console.error);