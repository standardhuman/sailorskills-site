const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function analyzeHeaderDetailed() {
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

  // Get detailed CSS analysis
  const detailedAnalysis = await page.evaluate(() => {
    const analysis = {
      header: {},
      navigation: {},
      hero: {},
      typography: {},
      layout: {},
      backgrounds: [],
      overlays: []
    };

    // Helper function to get all styles
    const getAllStyles = (element) => {
      const computed = window.getComputedStyle(element);
      const styles = {};
      
      // Get all properties
      for (let i = 0; i < computed.length; i++) {
        const propName = computed[i];
        styles[propName] = computed.getPropertyValue(propName);
      }
      
      return styles;
    };

    // Find the header/navigation area
    const possibleHeaders = document.querySelectorAll('header, .header, [class*="header"], nav, .nav, [class*="nav"]');
    
    possibleHeaders.forEach((header, index) => {
      const rect = header.getBoundingClientRect();
      if (rect.height > 0) {
        analysis.header[`element_${index}`] = {
          tagName: header.tagName.toLowerCase(),
          className: header.className,
          id: header.id,
          boundingBox: rect,
          styles: getAllStyles(header)
        };
      }
    });

    // Find elements with "SAILOR SKILLS" text
    const sailorSkillsElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent.includes('SAILOR SKILLS') && !el.querySelector('*')?.textContent.includes('SAILOR SKILLS')
    );
    
    sailorSkillsElements.forEach((el, index) => {
      analysis.typography[`sailor_skills_${index}`] = {
        text: el.textContent.trim(),
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        styles: {
          color: window.getComputedStyle(el).color,
          fontSize: window.getComputedStyle(el).fontSize,
          fontWeight: window.getComputedStyle(el).fontWeight,
          fontFamily: window.getComputedStyle(el).fontFamily,
          letterSpacing: window.getComputedStyle(el).letterSpacing,
          textTransform: window.getComputedStyle(el).textTransform,
          lineHeight: window.getComputedStyle(el).lineHeight
        }
      };
    });

    // Find "DIVING" text elements
    const divingElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent.trim() === 'DIVING' || el.textContent.includes('DIVING\nUNDERWATER VESSEL CARE')
    );
    
    divingElements.forEach((el, index) => {
      analysis.typography[`diving_${index}`] = {
        text: el.textContent.trim(),
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        styles: {
          color: window.getComputedStyle(el).color,
          fontSize: window.getComputedStyle(el).fontSize,
          fontWeight: window.getComputedStyle(el).fontWeight,
          fontFamily: window.getComputedStyle(el).fontFamily,
          letterSpacing: window.getComputedStyle(el).letterSpacing,
          textTransform: window.getComputedStyle(el).textTransform,
          lineHeight: window.getComputedStyle(el).lineHeight,
          marginTop: window.getComputedStyle(el).marginTop,
          marginBottom: window.getComputedStyle(el).marginBottom
        },
        boundingBox: el.getBoundingClientRect()
      };
    });

    // Check all elements for backgrounds and overlays
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      
      // Check for background images
      if (styles.backgroundImage && styles.backgroundImage !== 'none') {
        analysis.backgrounds.push({
          element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
          backgroundImage: styles.backgroundImage,
          backgroundSize: styles.backgroundSize,
          backgroundPosition: styles.backgroundPosition,
          backgroundRepeat: styles.backgroundRepeat,
          backgroundAttachment: styles.backgroundAttachment,
          opacity: styles.opacity,
          boundingBox: el.getBoundingClientRect()
        });
      }
      
      // Check for overlays (elements with opacity or rgba backgrounds)
      if (styles.opacity !== '1' || 
          styles.backgroundColor.includes('rgba') && !styles.backgroundColor.includes('rgba(0, 0, 0, 0)')) {
        analysis.overlays.push({
          element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
          backgroundColor: styles.backgroundColor,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          boundingBox: el.getBoundingClientRect()
        });
      }
    });

    // Get navigation links specifically
    const navLinks = document.querySelectorAll('nav a, .nav a, [class*="nav"] a, header a');
    analysis.navigation.links = Array.from(navLinks).map(link => ({
      text: link.textContent.trim(),
      href: link.href,
      styles: {
        color: window.getComputedStyle(link).color,
        fontSize: window.getComputedStyle(link).fontSize,
        fontWeight: window.getComputedStyle(link).fontWeight,
        fontFamily: window.getComputedStyle(link).fontFamily,
        textDecoration: window.getComputedStyle(link).textDecoration,
        textTransform: window.getComputedStyle(link).textTransform,
        padding: window.getComputedStyle(link).padding,
        margin: window.getComputedStyle(link).margin
      }
    }));

    // Get the overall layout structure
    const body = document.body;
    const html = document.documentElement;
    
    analysis.layout = {
      body: {
        backgroundColor: window.getComputedStyle(body).backgroundColor,
        margin: window.getComputedStyle(body).margin,
        padding: window.getComputedStyle(body).padding,
        fontFamily: window.getComputedStyle(body).fontFamily
      },
      html: {
        backgroundColor: window.getComputedStyle(html).backgroundColor,
        fontSize: window.getComputedStyle(html).fontSize
      }
    };

    return analysis;
  });

  // Save the detailed analysis
  await fs.writeFile(
    path.join(screenshotsDir, 'header-detailed-analysis.json'),
    JSON.stringify(detailedAnalysis, null, 2)
  );
  console.log('Detailed header analysis saved to header-detailed-analysis.json');

  // Take specific element screenshots
  try {
    // Screenshot the specific "SAILOR SKILLS DIVING" area
    const divingHeader = await page.locator('text="DIVING"').first();
    if (await divingHeader.count() > 0) {
      const parentElement = await divingHeader.locator('..').first();
      await parentElement.screenshot({
        path: path.join(screenshotsDir, 'diving-header-parent.png')
      });
    }
  } catch (e) {
    console.log('Could not capture DIVING header parent');
  }

  await browser.close();
  console.log('Analysis complete!');
}

analyzeHeaderDetailed().catch(console.error);