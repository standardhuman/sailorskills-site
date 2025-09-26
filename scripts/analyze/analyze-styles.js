const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeStyles() {
  const browser = await chromium.launch({ headless: true });
  
  // Analyze SailorSkills
  console.log('Analyzing SailorSkills.com...');
  const page1 = await browser.newPage();
  await page1.goto('https://www.sailorskills.com/diving', { waitUntil: 'load' });
  await page1.waitForTimeout(2000);
  
  const sailorSkillsData = await page1.evaluate(() => {
    const data = {};
    
    // Navigation analysis
    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (nav) {
      const navStyles = window.getComputedStyle(nav);
      const navLinks = Array.from(nav.querySelectorAll('a'));
      
      data.navigation = {
        position: navStyles.position,
        backgroundColor: navStyles.backgroundColor,
        padding: navStyles.padding,
        margin: navStyles.margin,
        height: nav.offsetHeight + 'px',
        links: navLinks.map(link => {
          const styles = window.getComputedStyle(link);
          return {
            text: link.textContent.trim(),
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            color: styles.color,
            textTransform: styles.textTransform,
            letterSpacing: styles.letterSpacing,
            padding: styles.padding,
            margin: styles.margin
          };
        })
      };
    }
    
    // Hero section analysis
    const heroTitle = document.querySelector('h1, .hero-title, [class*="hero"] h1, [class*="hero"] h2');
    if (heroTitle) {
      const heroStyles = window.getComputedStyle(heroTitle);
      data.heroTitle = {
        text: heroTitle.textContent.trim(),
        tagName: heroTitle.tagName,
        fontSize: heroStyles.fontSize,
        fontWeight: heroStyles.fontWeight,
        fontFamily: heroStyles.fontFamily,
        color: heroStyles.color,
        letterSpacing: heroStyles.letterSpacing,
        lineHeight: heroStyles.lineHeight,
        textAlign: heroStyles.textAlign,
        margin: heroStyles.margin,
        padding: heroStyles.padding
      };
    }
    
    // Subtitle/tagline
    const subtitle = document.querySelector('.tagline, .subtitle, h2, h3');
    if (subtitle) {
      const subtitleStyles = window.getComputedStyle(subtitle);
      data.subtitle = {
        text: subtitle.textContent.trim(),
        fontSize: subtitleStyles.fontSize,
        fontWeight: subtitleStyles.fontWeight,
        color: subtitleStyles.color,
        margin: subtitleStyles.margin
      };
    }
    
    // Logo/Brand
    const logo = document.querySelector('.logo, [class*="brand"], nav img, header img');
    if (logo) {
      const logoStyles = window.getComputedStyle(logo);
      data.logo = {
        type: logo.tagName,
        text: logo.textContent?.trim() || 'IMAGE',
        fontSize: logoStyles.fontSize,
        fontWeight: logoStyles.fontWeight,
        color: logoStyles.color,
        height: logoStyles.height,
        width: logoStyles.width
      };
    }
    
    // Overall header structure
    const header = document.querySelector('header') || nav?.parentElement;
    if (header) {
      const headerStyles = window.getComputedStyle(header);
      data.header = {
        backgroundColor: headerStyles.backgroundColor,
        padding: headerStyles.padding,
        margin: headerStyles.margin,
        minHeight: headerStyles.minHeight,
        display: headerStyles.display,
        flexDirection: headerStyles.flexDirection,
        alignItems: headerStyles.alignItems,
        justifyContent: headerStyles.justifyContent
      };
    }
    
    return data;
  });
  
  // Analyze localhost
  console.log('Analyzing localhost...');
  const page2 = await browser.newPage();
  await page2.goto('http://localhost:8080', { waitUntil: 'load' });
  await page2.waitForTimeout(2000);
  
  const localhostData = await page2.evaluate(() => {
    const data = {};
    
    // Navigation analysis
    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (nav) {
      const navStyles = window.getComputedStyle(nav);
      const navLinks = Array.from(nav.querySelectorAll('a'));
      
      data.navigation = {
        position: navStyles.position,
        backgroundColor: navStyles.backgroundColor,
        padding: navStyles.padding,
        margin: navStyles.margin,
        height: nav.offsetHeight + 'px',
        links: navLinks.map(link => {
          const styles = window.getComputedStyle(link);
          return {
            text: link.textContent.trim(),
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            color: styles.color,
            textTransform: styles.textTransform,
            letterSpacing: styles.letterSpacing,
            padding: styles.padding,
            margin: styles.margin
          };
        })
      };
    }
    
    // Hero section analysis
    const heroTitle = document.querySelector('h1, .hero-title, [class*="hero"] h1, [class*="hero"] h2');
    if (heroTitle) {
      const heroStyles = window.getComputedStyle(heroTitle);
      data.heroTitle = {
        text: heroTitle.textContent.trim(),
        tagName: heroTitle.tagName,
        fontSize: heroStyles.fontSize,
        fontWeight: heroStyles.fontWeight,
        fontFamily: heroStyles.fontFamily,
        color: heroStyles.color,
        letterSpacing: heroStyles.letterSpacing,
        lineHeight: heroStyles.lineHeight,
        textAlign: heroStyles.textAlign,
        margin: heroStyles.margin,
        padding: heroStyles.padding
      };
    }
    
    // Subtitle/tagline
    const subtitle = document.querySelector('.tagline, .subtitle, h2, h3');
    if (subtitle) {
      const subtitleStyles = window.getComputedStyle(subtitle);
      data.subtitle = {
        text: subtitle.textContent.trim(),
        fontSize: subtitleStyles.fontSize,
        fontWeight: subtitleStyles.fontWeight,
        color: subtitleStyles.color,
        margin: subtitleStyles.margin
      };
    }
    
    // Logo/Brand
    const logo = document.querySelector('.logo, [class*="brand"], nav img, header img');
    if (logo) {
      const logoStyles = window.getComputedStyle(logo);
      data.logo = {
        type: logo.tagName,
        text: logo.textContent?.trim() || 'IMAGE',
        fontSize: logoStyles.fontSize,
        fontWeight: logoStyles.fontWeight,
        color: logoStyles.color,
        height: logoStyles.height,
        width: logoStyles.width
      };
    }
    
    // Overall header structure
    const header = document.querySelector('header') || nav?.parentElement;
    if (header) {
      const headerStyles = window.getComputedStyle(header);
      data.header = {
        backgroundColor: headerStyles.backgroundColor,
        padding: headerStyles.padding,
        margin: headerStyles.margin,
        minHeight: headerStyles.minHeight,
        display: headerStyles.display,
        flexDirection: headerStyles.flexDirection,
        alignItems: headerStyles.alignItems,
        justifyContent: headerStyles.justifyContent
      };
    }
    
    return data;
  });
  
  await browser.close();
  
  // Save the analysis
  const analysis = {
    sailorSkills: sailorSkillsData,
    localhost: localhostData,
    timestamp: new Date().toISOString()
  };
  
  const screenshotsDir = path.join(__dirname, 'screenshots');
  fs.writeFileSync(
    path.join(screenshotsDir, 'style-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );
  
  // Print comparison
  console.log('\n=== HEADER COMPARISON ANALYSIS ===\n');
  
  console.log('NAVIGATION:');
  console.log('SailorSkills:', sailorSkillsData.navigation?.links?.map(l => l.text).join(' | '));
  console.log('Localhost:', localhostData.navigation?.links?.map(l => l.text).join(' | '));
  
  console.log('\nNAVIGATION STYLING:');
  if (sailorSkillsData.navigation?.links?.[0]) {
    console.log('SailorSkills Nav Links:');
    console.log('  Font Size:', sailorSkillsData.navigation.links[0].fontSize);
    console.log('  Color:', sailorSkillsData.navigation.links[0].color);
    console.log('  Text Transform:', sailorSkillsData.navigation.links[0].textTransform);
  }
  if (localhostData.navigation?.links?.[0]) {
    console.log('Localhost Nav Links:');
    console.log('  Font Size:', localhostData.navigation.links[0].fontSize);
    console.log('  Color:', localhostData.navigation.links[0].color);
    console.log('  Text Transform:', localhostData.navigation.links[0].textTransform);
  }
  
  console.log('\nHERO TITLE:');
  if (sailorSkillsData.heroTitle) {
    console.log('SailorSkills:');
    console.log('  Text:', sailorSkillsData.heroTitle.text);
    console.log('  Font Size:', sailorSkillsData.heroTitle.fontSize);
    console.log('  Font Weight:', sailorSkillsData.heroTitle.fontWeight);
    console.log('  Color:', sailorSkillsData.heroTitle.color);
    console.log('  Letter Spacing:', sailorSkillsData.heroTitle.letterSpacing);
  }
  if (localhostData.heroTitle) {
    console.log('Localhost:');
    console.log('  Text:', localhostData.heroTitle.text);
    console.log('  Font Size:', localhostData.heroTitle.fontSize);
    console.log('  Font Weight:', localhostData.heroTitle.fontWeight);
    console.log('  Color:', localhostData.heroTitle.color);
    console.log('  Letter Spacing:', localhostData.heroTitle.letterSpacing);
  }
  
  console.log('\nFull analysis saved to ./screenshots/style-analysis.json');
  
  return analysis;
}

analyzeStyles().catch(console.error);