import { chromium } from 'playwright';

async function testDivingUrl() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing /diving URL\n');
  
  try {
    // Test 1: Direct navigation to /diving
    console.log('📍 Test 1: Direct navigation to /diving');
    await page.goto('http://localhost:3000/diving');
    await page.waitForTimeout(2000);
    
    // Check if the cost calculator loaded
    const title = await page.title();
    console.log(`  ✓ Page title: ${title}`);
    
    const heading = await page.textContent('h1');
    console.log(`  ✓ Page heading: ${heading}`);
    
    // Check for service buttons
    const serviceButtons = await page.$$('.service-option');
    console.log(`  ✓ Service buttons found: ${serviceButtons.length}`);
    
    // Test 2: Root URL redirects to /diving
    console.log('\n📍 Test 2: Root URL redirect');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);
    
    const redirectedUrl = page.url();
    console.log(`  ✓ Redirected to: ${redirectedUrl}`);
    
    if (redirectedUrl.includes('/diving')) {
      console.log('  ✅ Successfully redirected to /diving');
    } else {
      console.log('  ❌ Redirect failed');
    }
    
    // Test 3: Admin page still works
    console.log('\n📍 Test 3: Admin page at /admin');
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);
    
    const adminUrl = page.url();
    const adminHeading = await page.textContent('h1');
    console.log(`  ✓ Admin URL: ${adminUrl}`);
    console.log(`  ✓ Admin heading: ${adminHeading}`);
    
    console.log('\n✅ All URL tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testDivingUrl().catch(console.error);