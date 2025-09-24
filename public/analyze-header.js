const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function analyzeHeader() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navigating to https://www.sailorskills.com/diving...');
  await page.goto('https://www.sailorskills.com/diving', { 
    waitUntil: 'networkidle' 
  });

  // Wait for the page to fully load
  await page.waitForTimeout(3000);

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  // Take a full page screenshot first
  await page.screenshot({
    path: path.join(screenshotsDir, 'full-page.png'),
    fullPage: true
  });
  console.log('Full page screenshot saved');

  // Take a screenshot of just the header section
  const header = await page.locator('header, [role="banner"], .header, #header, nav').first();
  if (await header.count() > 0) {
    await header.screenshot({
      path: path.join(screenshotsDir, 'header-section.png')
    });
    console.log('Header section screenshot saved');
  }

  // Try to capture the hero section
  const heroSelectors = [
    '.hero', 
    '#hero', 
    '[class*="hero"]', 
    'section:first-of-type',
    'main > section:first-child',
    '.banner',
    '[class*="banner"]'
  ];

  for (const selector of heroSelectors) {
    const hero = await page.locator(selector).first();
    if (await hero.count() > 0) {
      await hero.screenshot({
        path: path.join(screenshotsDir, `hero-section-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`)
      });
      console.log(`Hero section screenshot saved for selector: ${selector}`);
      break;
    }
  }

  // Extract CSS information for header elements
  const headerInfo = await page.evaluate(() => {
    const results = {
      navigation: {},
      hero: {},
      colors: [],
      fonts: [],
      spacing: [],
      backgroundImages: []
    };

    // Function to get computed styles
    const getStyles = (element, properties) => {
      const computed = window.getComputedStyle(element);
      const styles = {};
      properties.forEach(prop => {
        styles[prop] = computed.getPropertyValue(prop);
      });
      return styles;
    };

    // Analyze navigation
    const nav = document.querySelector('nav, .nav, .navigation, header nav');
    if (nav) {
      results.navigation = {
        styles: getStyles(nav, [
          'background-color', 'color', 'height', 'padding', 'margin',
          'position', 'z-index', 'font-family', 'font-size', 'font-weight'
        ]),
        boundingBox: nav.getBoundingClientRect()
      };

      // Get navigation links
      const navLinks = nav.querySelectorAll('a');
      results.navigation.links = Array.from(navLinks).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        styles: getStyles(link, [
          'color', 'font-size', 'font-weight', 'text-decoration',
          'padding', 'margin', 'background-color'
        ])
      }));
    }

    // Analyze hero section
    const heroSelectors = [
      '.hero', '#hero', '[class*="hero"]', 
      'section:first-of-type', 'main > section:first-child'
    ];
    
    let heroElement = null;
    for (const selector of heroSelectors) {
      heroElement = document.querySelector(selector);
      if (heroElement) break;
    }

    if (heroElement) {
      results.hero = {
        styles: getStyles(heroElement, [
          'background-color', 'background-image', 'background-size',
          'background-position', 'height', 'min-height', 'padding',
          'margin', 'position', 'overflow'
        ]),
        boundingBox: heroElement.getBoundingClientRect()
      };

      // Get hero text elements
      const heroHeadings = heroElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      results.hero.headings = Array.from(heroHeadings).map(heading => ({
        tag: heading.tagName.toLowerCase(),
        text: heading.textContent.trim(),
        styles: getStyles(heading, [
          'color', 'font-size', 'font-weight', 'font-family',
          'line-height', 'text-align', 'margin', 'padding',
          'text-transform', 'letter-spacing'
        ])
      }));
    }

    // Look for specific text
    const sailorSkillsText = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent.includes('SAILOR SKILLS DIVING UNDERWATER VESSEL CARE')
    );
    
    if (sailorSkillsText) {
      results.sailorSkillsElement = {
        tag: sailorSkillsText.tagName.toLowerCase(),
        text: sailorSkillsText.textContent.trim(),
        styles: getStyles(sailorSkillsText, [
          'color', 'font-size', 'font-weight', 'font-family',
          'line-height', 'text-align', 'margin', 'padding',
          'text-transform', 'letter-spacing', 'background-color',
          'position', 'top', 'left', 'width', 'height'
        ]),
        boundingBox: sailorSkillsText.getBoundingClientRect()
      };
    }

    // Collect all unique colors from header area
    const headerElements = document.querySelectorAll('header *, nav *, .hero *, section:first-of-type *');
    const colorSet = new Set();
    const fontSet = new Set();
    
    headerElements.forEach(el => {
      const computed = window.getComputedStyle(el);
      colorSet.add(computed.color);
      colorSet.add(computed.backgroundColor);
      fontSet.add(computed.fontFamily);
      
      // Check for background images
      const bgImage = computed.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        results.backgroundImages.push({
          element: el.tagName.toLowerCase() + (el.className ? '.' + el.className : ''),
          backgroundImage: bgImage,
          backgroundSize: computed.backgroundSize,
          backgroundPosition: computed.backgroundPosition,
          backgroundRepeat: computed.backgroundRepeat
        });
      }
    });

    results.colors = Array.from(colorSet).filter(c => c && c !== 'rgba(0, 0, 0, 0)');
    results.fonts = Array.from(fontSet).filter(f => f);

    return results;
  });

  // Save the analysis results
  await fs.writeFile(
    path.join(screenshotsDir, 'header-analysis.json'),
    JSON.stringify(headerInfo, null, 2)
  );
  console.log('Header analysis saved to header-analysis.json');

  // Take viewport screenshot for reference
  await page.screenshot({
    path: path.join(screenshotsDir, 'viewport-header.png')
  });

  // Try to isolate just the header + hero area
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  await page.screenshot({
    path: path.join(screenshotsDir, 'header-hero-area.png'),
    clip: {
      x: 0,
      y: 0,
      width: 1920,
      height: Math.min(viewportHeight, 800) // Capture up to 800px height
    }
  });
  console.log('Header and hero area screenshot saved');

  await browser.close();
  console.log('\nAnalysis complete! Check the screenshots folder for images and header-analysis.json for CSS details.');
}

analyzeHeader().catch(console.error);