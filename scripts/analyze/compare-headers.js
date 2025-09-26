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
    headless: false,
    args: ['--window-size=1920,1080']
  });
  
  // Create two browser contexts for side-by-side viewing
  const context1 = await browser.newContext({
    viewport: { width: 960, height: 1080 }
  });
  const context2 = await browser.newContext({
    viewport: { width: 960, height: 1080 }
  });
  
  // Open pages
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  console.log('Navigating to websites...');
  
  // Navigate to both sites
  try {
    await page1.goto('https://www.sailorskills.com/diving', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    console.log('SailorSkills page loaded');
  } catch (error) {
    console.error('Error loading SailorSkills:', error.message);
  }
  
  try {
    await page2.goto('http://localhost:8080', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    console.log('Localhost page loaded');
  } catch (error) {
    console.error('Error loading localhost:', error.message);
  }
  
  // Wait a bit for any animations to complete
  await page1.waitForTimeout(2000);
  await page2.waitForTimeout(2000);
  
  console.log('Taking screenshots...');
  
  // Take full page screenshots
  await page1.screenshot({ 
    path: path.join(screenshotsDir, 'sailorskills-full.png'),
    fullPage: true
  });
  await page2.screenshot({ 
    path: path.join(screenshotsDir, 'localhost-full.png'),
    fullPage: true
  });
  
  // Take header-specific screenshots
  // Try to capture just the header section
  try {
    // For SailorSkills
    const header1 = await page1.$('header') || await page1.$('nav').parentElement;
    if (header1) {
      await header1.screenshot({ 
        path: path.join(screenshotsDir, 'sailorskills-header.png')
      });
    }
    
    // For localhost
    const header2 = await page2.$('header') || await page2.$('nav').parentElement;
    if (header2) {
      await header2.screenshot({ 
        path: path.join(screenshotsDir, 'localhost-header.png')
      });
    }
  } catch (error) {
    console.log('Could not capture header-specific screenshots, using viewport screenshots instead');
  }
  
  // Take viewport screenshots (top portion of the page)
  await page1.screenshot({ 
    path: path.join(screenshotsDir, 'sailorskills-viewport.png'),
    clip: { x: 0, y: 0, width: 960, height: 800 }
  });
  await page2.screenshot({ 
    path: path.join(screenshotsDir, 'localhost-viewport.png'),
    clip: { x: 0, y: 0, width: 960, height: 800 }
  });
  
  console.log('Extracting styling information...');
  
  // Extract styling information from both sites
  const sailorSkillsStyles = await page1.evaluate(() => {
    const nav = document.querySelector('nav');
    const hero = document.querySelector('h1, .hero-title, [class*="hero"]');
    const body = document.body;
    
    const getStyles = (element) => {
      if (!element) return null;
      const computed = window.getComputedStyle(element);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        padding: computed.padding,
        margin: computed.margin,
        lineHeight: computed.lineHeight,
        textAlign: computed.textAlign,
        position: computed.position,
        display: computed.display,
        flexDirection: computed.flexDirection,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems
      };
    };
    
    return {
      nav: nav ? getStyles(nav) : null,
      hero: hero ? { ...getStyles(hero), text: hero.textContent.trim() } : null,
      bodyFont: body ? getStyles(body).fontFamily : null,
      navItems: Array.from(document.querySelectorAll('nav a, nav li')).map(item => ({
        text: item.textContent.trim(),
        styles: getStyles(item)
      }))
    };
  });
  
  const localhostStyles = await page2.evaluate(() => {
    const nav = document.querySelector('nav');
    const hero = document.querySelector('h1, .hero-title, [class*="hero"]');
    const body = document.body;
    
    const getStyles = (element) => {
      if (!element) return null;
      const computed = window.getComputedStyle(element);
      return {
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        padding: computed.padding,
        margin: computed.margin,
        lineHeight: computed.lineHeight,
        textAlign: computed.textAlign,
        position: computed.position,
        display: computed.display,
        flexDirection: computed.flexDirection,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems
      };
    };
    
    return {
      nav: nav ? getStyles(nav) : null,
      hero: hero ? { ...getStyles(hero), text: hero.textContent.trim() } : null,
      bodyFont: body ? getStyles(body).fontFamily : null,
      navItems: Array.from(document.querySelectorAll('nav a, nav li')).map(item => ({
        text: item.textContent.trim(),
        styles: getStyles(item)
      }))
    };
  });
  
  // Save the styling information
  fs.writeFileSync(
    path.join(screenshotsDir, 'styles-comparison.json'),
    JSON.stringify({ sailorSkills: sailorSkillsStyles, localhost: localhostStyles }, null, 2)
  );
  
  console.log('Screenshots and style analysis saved to ./screenshots/');
  console.log('\nStyle Comparison Summary:');
  console.log('========================');
  
  // Print comparison summary
  if (sailorSkillsStyles.nav && localhostStyles.nav) {
    console.log('\nNavigation Bar:');
    console.log(`SailorSkills - Position: ${sailorSkillsStyles.nav.position}, Display: ${sailorSkillsStyles.nav.display}`);
    console.log(`Localhost - Position: ${localhostStyles.nav.position}, Display: ${localhostStyles.nav.display}`);
  }
  
  if (sailorSkillsStyles.hero && localhostStyles.hero) {
    console.log('\nHero Text:');
    console.log(`SailorSkills - "${sailorSkillsStyles.hero.text}"`);
    console.log(`  Font: ${sailorSkillsStyles.hero.fontSize} ${sailorSkillsStyles.hero.fontWeight}`);
    console.log(`  Color: ${sailorSkillsStyles.hero.color}`);
    console.log(`Localhost - "${localhostStyles.hero.text}"`);
    console.log(`  Font: ${localhostStyles.hero.fontSize} ${localhostStyles.hero.fontWeight}`);
    console.log(`  Color: ${localhostStyles.hero.color}`);
  }
  
  // Keep browser open for manual inspection
  console.log('\nBrowser windows will remain open for manual inspection.');
  console.log('Press Ctrl+C to close and exit.');
  
  // Keep the script running
  await new Promise(() => {});
}

compareHeaders().catch(console.error);