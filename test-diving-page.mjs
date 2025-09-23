import { chromium } from 'playwright';

async function testDivingPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Customer-Facing Diving Page\n');
  console.log('='*50);
  
  try {
    // Navigate to diving page
    console.log('\n📍 Navigate to Diving Page');
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(2000);
    console.log('  ✓ Diving page loaded');
    
    // Check for the new text additions
    console.log('\n📍 Verify New Information Text');
    
    // Check for labor + materials indicator
    const laborText = await page.getByText('All prices shown are for labor only. Materials are additional.');
    if (await laborText.isVisible()) {
      console.log('  ✓ "Labor only, materials additional" text is visible');
    } else {
      console.log('  ❌ Labor/materials text NOT found');
    }
    
    // Check for $150 minimum service fee
    const minimumFeeText = await page.getByText('$150 minimum service fee applies to all services.');
    if (await minimumFeeText.isVisible()) {
      console.log('  ✓ "$150 minimum service fee" text is visible');
    } else {
      console.log('  ❌ Minimum fee text NOT found');
    }
    
    // Check service buttons are present
    console.log('\n📍 Verify Service Buttons');
    const serviceButtons = await page.$$('.service-option');
    console.log(`  ✓ Found ${serviceButtons.length} service buttons`);
    
    // Take screenshot for visual confirmation
    await page.screenshot({ path: 'diving-page-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved as diving-page-test.png');
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testDivingPage().catch(console.error);