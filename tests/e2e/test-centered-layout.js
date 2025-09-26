import { chromium } from '@playwright/test';

async function testCenteredLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== TESTING CENTERED LAYOUT ===\n');
  
  await page.goto('http://localhost:3000');
  
  // Wait for service buttons
  await page.waitForSelector('#serviceButtons', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  // Check the propeller service button (5th button) styling
  const propellerBtn = await page.$('.service-option:nth-child(5)');
  
  if (propellerBtn) {
    console.log('✓ Found 5th service button (Propeller service)');
    
    // Get computed styles
    const styles = await propellerBtn.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        gridColumn: computed.gridColumn,
        maxWidth: computed.maxWidth,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        width: el.offsetWidth,
        parentWidth: el.parentElement.offsetWidth
      };
    });
    
    console.log('\nButton styling:');
    console.log(`  Grid column: ${styles.gridColumn}`);
    console.log(`  Max width: ${styles.maxWidth}`);
    console.log(`  Margins: ${styles.marginLeft} / ${styles.marginRight}`);
    console.log(`  Actual width: ${styles.width}px`);
    console.log(`  Parent width: ${styles.parentWidth}px`);
    
    if (styles.gridColumn.includes('1 / -1')) {
      console.log('✓ Button spans full grid width');
    }
    
    if (styles.marginLeft === 'auto' && styles.marginRight === 'auto') {
      console.log('✓ Button is centered with auto margins');
    }
    
    if (styles.maxWidth === '50%' || styles.width < styles.parentWidth * 0.6) {
      console.log('✓ Button width is constrained for centering');
    }
    
    // Visual check
    const boundingBox = await propellerBtn.boundingBox();
    const parentBox = await page.$eval('#serviceButtons', el => el.getBoundingClientRect());
    
    const leftSpace = boundingBox.x - parentBox.x;
    const rightSpace = (parentBox.x + parentBox.width) - (boundingBox.x + boundingBox.width);
    
    console.log(`\nVisual centering:`);
    console.log(`  Left space: ${Math.round(leftSpace)}px`);
    console.log(`  Right space: ${Math.round(rightSpace)}px`);
    
    if (Math.abs(leftSpace - rightSpace) < 10) {
      console.log('✓ Button is visually centered');
    } else {
      console.log('✗ Button is not centered (difference > 10px)');
    }
  } else {
    console.log('✗ Could not find 5th service button');
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETED ===');
}

testCenteredLayout().catch(console.error);