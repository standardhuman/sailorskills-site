const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function compareHeaders() {
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  // Launch browser
  const browser = await chromium.launch({ 
    headless: false
  });
  
  console.log('Opening SailorSkills page...');
  const page1 = await browser.newPage();
  await page1.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    await page1.goto('https://www.sailorskills.com/diving', { 
      waitUntil: 'load',
      timeout: 60000 
    });
    console.log('SailorSkills loaded, waiting for content...');
    await page1.waitForTimeout(3000);
    
    // Take screenshots
    await page1.screenshot({ 
      path: path.join(screenshotsDir, 'sailorskills-full.png'),
      fullPage: false
    });
    console.log('SailorSkills screenshot saved');
    
    // Try to capture just the header
    const headerHeight = await page1.evaluate(() => {
      const header = document.querySelector('header') || document.querySelector('nav');
      if (header) {
        const rect = header.getBoundingClientRect();
        return rect.height + 100; // Add some extra space
      }
      return 600; // Default header area
    });
    
    await page1.screenshot({ 
      path: path.join(screenshotsDir, 'sailorskills-header.png'),
      clip: { x: 0, y: 0, width: 1920, height: headerHeight }
    });
    
  } catch (error) {
    console.error('Error with SailorSkills:', error.message);
  }
  
  console.log('\nOpening localhost page...');
  const page2 = await browser.newPage();
  await page2.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    await page2.goto('http://localhost:8080', { 
      waitUntil: 'load',
      timeout: 60000 
    });
    console.log('Localhost loaded, waiting for content...');
    await page2.waitForTimeout(3000);
    
    // Take screenshots
    await page2.screenshot({ 
      path: path.join(screenshotsDir, 'localhost-full.png'),
      fullPage: false
    });
    console.log('Localhost screenshot saved');
    
    // Try to capture just the header
    const headerHeight = await page2.evaluate(() => {
      const header = document.querySelector('header') || document.querySelector('nav');
      if (header) {
        const rect = header.getBoundingClientRect();
        return rect.height + 100; // Add some extra space
      }
      return 600; // Default header area
    });
    
    await page2.screenshot({ 
      path: path.join(screenshotsDir, 'localhost-header.png'),
      clip: { x: 0, y: 0, width: 1920, height: headerHeight }
    });
    
  } catch (error) {
    console.error('Error with localhost:', error.message);
  }
  
  console.log('\nScreenshots saved to ./screenshots/');
  console.log('Keeping browser open for inspection. Press Ctrl+C to exit.');
  
  // Position windows side by side for comparison
  const pages = await browser.pages();
  if (pages.length >= 2) {
    // This is a best-effort attempt, might not work on all systems
    await pages[0].evaluate(() => window.moveTo(0, 0));
    await pages[1].evaluate(() => window.moveTo(960, 0));
  }
  
  // Keep the script running
  await new Promise(() => {});
}

compareHeaders().catch(console.error);