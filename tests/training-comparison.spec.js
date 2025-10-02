import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ORIGINAL_URL = 'https://www.sailorskills.com/training';
const LOCAL_URL = 'http://localhost:3002/training/training.html';

test.describe('Training Page Pixel-Perfect Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Full Page Screenshots', async ({ page }) => {
    // Create directories
    const screenshotsDir = path.join(projectRoot, 'test-results', 'screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // Capture original Wix page
    await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any animations/lazy loading
    await page.screenshot({
      path: path.join(screenshotsDir, 'wix-original-full.png'),
      fullPage: true
    });

    // Capture local recreation
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'local-recreation-full.png'),
      fullPage: true
    });

    console.log('Full page screenshots captured');
  });

  test('Measure Original Wix Page Elements', async ({ page }) => {
    await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const measurements = {
      viewport: { width: 1920, height: 1080 },
      navigation: {},
      hero: {},
      typography: {},
      spacing: {},
      colors: {},
      buttons: {},
      sections: []
    };

    // Navigation measurements
    try {
      const nav = await page.locator('header, nav, [role="navigation"]').first();
      if (await nav.count() > 0) {
        const navBox = await nav.boundingBox();
        const navStyles = await nav.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            height: computed.height,
            padding: computed.padding,
            borderBottom: computed.borderBottom
          };
        });
        measurements.navigation = {
          boundingBox: navBox,
          styles: navStyles,
          links: await page.locator('header a, nav a').count()
        };

        // Measure navigation links
        const navLinks = await page.locator('header a, nav a').all();
        measurements.navigation.linkStyles = [];
        for (const link of navLinks.slice(0, 5)) {
          const linkStyles = await link.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              color: computed.color,
              letterSpacing: computed.letterSpacing,
              textTransform: computed.textTransform
            };
          });
          const linkText = await link.textContent();
          measurements.navigation.linkStyles.push({ text: linkText, styles: linkStyles });
        }
      }
    } catch (e) {
      console.log('Navigation measurement error:', e.message);
    }

    // Hero Section measurements
    try {
      // Try to find hero image
      const heroImg = await page.locator('img[src*="sailing"], img[alt*="sailing" i], img[alt*="training" i]').first();
      if (await heroImg.count() > 0) {
        const imgBox = await heroImg.boundingBox();
        const imgSrc = await heroImg.getAttribute('src');
        measurements.hero.image = {
          boundingBox: imgBox,
          src: imgSrc,
          naturalSize: await heroImg.evaluate((img) => ({
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
        };
      }

      // Measure main heading
      const h1 = await page.locator('h1').first();
      if (await h1.count() > 0) {
        const h1Box = await h1.boundingBox();
        const h1Styles = await h1.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontFamily: computed.fontFamily,
            color: computed.color,
            letterSpacing: computed.letterSpacing,
            lineHeight: computed.lineHeight,
            textTransform: computed.textTransform,
            marginBottom: computed.marginBottom
          };
        });
        const h1Text = await h1.textContent();
        measurements.hero.h1 = { boundingBox: h1Box, styles: h1Styles, text: h1Text };
      }

      // Measure price element
      const priceElements = await page.locator('text=/\\$\\d+/').all();
      if (priceElements.length > 0) {
        const priceEl = priceElements[0];
        const priceBox = await priceEl.boundingBox();
        const priceStyles = await priceEl.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color
          };
        });
        const priceText = await priceEl.textContent();
        measurements.hero.price = { boundingBox: priceBox, styles: priceStyles, text: priceText };
      }

      // Measure sidebar/left column
      const sidebar = await page.locator('[class*="sidebar"], [class*="left"]').first();
      if (await sidebar.count() > 0) {
        const sidebarBox = await sidebar.boundingBox();
        const sidebarStyles = await sidebar.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            backgroundColor: computed.backgroundColor,
            padding: computed.padding
          };
        });
        measurements.hero.sidebar = { boundingBox: sidebarBox, styles: sidebarStyles };
      }
    } catch (e) {
      console.log('Hero measurement error:', e.message);
    }

    // Button measurements
    try {
      const buttons = await page.locator('button, a[class*="button"], a[class*="cta"]').all();
      measurements.buttons.list = [];
      for (const button of buttons.slice(0, 3)) {
        const btnBox = await button.boundingBox();
        const btnStyles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontSize: computed.fontSize,
            padding: computed.padding,
            letterSpacing: computed.letterSpacing,
            width: computed.width,
            textAlign: computed.textAlign
          };
        });
        const btnText = await button.textContent();
        measurements.buttons.list.push({
          boundingBox: btnBox,
          styles: btnStyles,
          text: btnText?.trim()
        });
      }
    } catch (e) {
      console.log('Button measurement error:', e.message);
    }

    // Heading styles (h2, h3)
    try {
      const h2 = await page.locator('h2').first();
      if (await h2.count() > 0) {
        const h2Styles = await h2.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            letterSpacing: computed.letterSpacing,
            marginBottom: computed.marginBottom,
            textAlign: computed.textAlign
          };
        });
        measurements.typography.h2 = h2Styles;
      }

      const h3 = await page.locator('h3').first();
      if (await h3.count() > 0) {
        const h3Styles = await h3.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            letterSpacing: computed.letterSpacing,
            marginBottom: computed.marginBottom
          };
        });
        measurements.typography.h3 = h3Styles;
      }

      // Paragraph styles
      const p = await page.locator('p').first();
      if (await p.count() > 0) {
        const pStyles = await p.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            color: computed.color,
            marginBottom: computed.marginBottom
          };
        });
        measurements.typography.paragraph = pStyles;
      }
    } catch (e) {
      console.log('Typography measurement error:', e.message);
    }

    // Section measurements
    try {
      const sections = await page.locator('section, [class*="section"]').all();
      for (let i = 0; i < Math.min(sections.length, 5); i++) {
        const section = sections[i];
        const sectionBox = await section.boundingBox();
        const sectionStyles = await section.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            padding: computed.padding,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom,
            textAlign: computed.textAlign
          };
        });
        measurements.sections.push({
          index: i,
          boundingBox: sectionBox,
          styles: sectionStyles
        });
      }
    } catch (e) {
      console.log('Section measurement error:', e.message);
    }

    // Get colors from various elements
    try {
      measurements.colors.bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Get all unique background colors
      const bgColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = new Set();
        elements.forEach(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            colors.add(bg);
          }
        });
        return Array.from(colors);
      });
      measurements.colors.backgrounds = bgColors;

      // Get all unique text colors
      const textColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = new Set();
        elements.forEach(el => {
          const color = window.getComputedStyle(el).color;
          if (color) {
            colors.add(color);
          }
        });
        return Array.from(colors);
      });
      measurements.colors.text = textColors;
    } catch (e) {
      console.log('Color measurement error:', e.message);
    }

    // Save measurements
    const measurementsDir = path.join(projectRoot, 'test-results', 'measurements');
    fs.mkdirSync(measurementsDir, { recursive: true });
    fs.writeFileSync(
      path.join(measurementsDir, 'wix-original-measurements.json'),
      JSON.stringify(measurements, null, 2)
    );

    console.log('Original Wix measurements saved');
  });

  test('Measure Local Recreation Elements', async ({ page }) => {
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const measurements = {
      viewport: { width: 1920, height: 1080 },
      navigation: {},
      hero: {},
      typography: {},
      spacing: {},
      colors: {},
      buttons: {},
      sections: []
    };

    // Navigation measurements
    try {
      const nav = await page.locator('.navigation-header').first();
      if (await nav.count() > 0) {
        const navBox = await nav.boundingBox();
        const navStyles = await nav.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            height: computed.height,
            padding: computed.padding,
            borderBottom: computed.borderBottom
          };
        });
        measurements.navigation = {
          boundingBox: navBox,
          styles: navStyles,
          links: await page.locator('.nav-links a').count()
        };

        // Measure navigation links
        const navLinks = await page.locator('.nav-links a').all();
        measurements.navigation.linkStyles = [];
        for (const link of navLinks) {
          const linkStyles = await link.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              color: computed.color,
              letterSpacing: computed.letterSpacing,
              textTransform: computed.textTransform
            };
          });
          const linkText = await link.textContent();
          measurements.navigation.linkStyles.push({ text: linkText, styles: linkStyles });
        }
      }
    } catch (e) {
      console.log('Navigation measurement error:', e.message);
    }

    // Hero Section measurements
    try {
      const heroImg = await page.locator('.hero-image').first();
      if (await heroImg.count() > 0) {
        const imgBox = await heroImg.boundingBox();
        const imgSrc = await heroImg.getAttribute('src');
        measurements.hero.image = {
          boundingBox: imgBox,
          src: imgSrc,
          naturalSize: await heroImg.evaluate((img) => ({
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
        };
      }

      const h1 = await page.locator('.page-title').first();
      if (await h1.count() > 0) {
        const h1Box = await h1.boundingBox();
        const h1Styles = await h1.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontFamily: computed.fontFamily,
            color: computed.color,
            letterSpacing: computed.letterSpacing,
            lineHeight: computed.lineHeight,
            textTransform: computed.textTransform,
            marginBottom: computed.marginBottom
          };
        });
        const h1Text = await h1.textContent();
        measurements.hero.h1 = { boundingBox: h1Box, styles: h1Styles, text: h1Text };
      }

      const price = await page.locator('.price').first();
      if (await price.count() > 0) {
        const priceBox = await price.boundingBox();
        const priceStyles = await price.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color
          };
        });
        const priceText = await price.textContent();
        measurements.hero.price = { boundingBox: priceBox, styles: priceStyles, text: priceText };
      }

      const sidebar = await page.locator('.sidebar').first();
      if (await sidebar.count() > 0) {
        const sidebarBox = await sidebar.boundingBox();
        const sidebarStyles = await sidebar.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: computed.width,
            backgroundColor: computed.backgroundColor,
            padding: computed.padding
          };
        });
        measurements.hero.sidebar = { boundingBox: sidebarBox, styles: sidebarStyles };
      }
    } catch (e) {
      console.log('Hero measurement error:', e.message);
    }

    // Button measurements
    try {
      const buttons = await page.locator('.cta-button').all();
      measurements.buttons.list = [];
      for (const button of buttons) {
        const btnBox = await button.boundingBox();
        const btnStyles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontSize: computed.fontSize,
            padding: computed.padding,
            letterSpacing: computed.letterSpacing,
            width: computed.width,
            textAlign: computed.textAlign
          };
        });
        const btnText = await button.textContent();
        measurements.buttons.list.push({
          boundingBox: btnBox,
          styles: btnStyles,
          text: btnText?.trim()
        });
      }
    } catch (e) {
      console.log('Button measurement error:', e.message);
    }

    // Heading styles
    try {
      const h2 = await page.locator('h2').first();
      if (await h2.count() > 0) {
        const h2Styles = await h2.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            letterSpacing: computed.letterSpacing,
            marginBottom: computed.marginBottom,
            textAlign: computed.textAlign
          };
        });
        measurements.typography.h2 = h2Styles;
      }

      const h3 = await page.locator('h3').first();
      if (await h3.count() > 0) {
        const h3Styles = await h3.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            letterSpacing: computed.letterSpacing,
            marginBottom: computed.marginBottom
          };
        });
        measurements.typography.h3 = h3Styles;
      }

      const p = await page.locator('p').first();
      if (await p.count() > 0) {
        const pStyles = await p.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            color: computed.color,
            marginBottom: computed.marginBottom
          };
        });
        measurements.typography.paragraph = pStyles;
      }
    } catch (e) {
      console.log('Typography measurement error:', e.message);
    }

    // Section measurements
    try {
      const sections = await page.locator('section').all();
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionBox = await section.boundingBox();
        const sectionStyles = await section.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            padding: computed.padding,
            marginTop: computed.marginTop,
            marginBottom: computed.marginBottom,
            textAlign: computed.textAlign
          };
        });
        measurements.sections.push({
          index: i,
          boundingBox: sectionBox,
          styles: sectionStyles
        });
      }
    } catch (e) {
      console.log('Section measurement error:', e.message);
    }

    // Colors
    try {
      measurements.colors.bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      const bgColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = new Set();
        elements.forEach(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            colors.add(bg);
          }
        });
        return Array.from(colors);
      });
      measurements.colors.backgrounds = bgColors;

      const textColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const colors = new Set();
        elements.forEach(el => {
          const color = window.getComputedStyle(el).color;
          if (color) {
            colors.add(color);
          }
        });
        return Array.from(colors);
      });
      measurements.colors.text = textColors;
    } catch (e) {
      console.log('Color measurement error:', e.message);
    }

    // Save measurements
    const measurementsDir = path.join(projectRoot, 'test-results', 'measurements');
    fs.mkdirSync(measurementsDir, { recursive: true });
    fs.writeFileSync(
      path.join(measurementsDir, 'local-recreation-measurements.json'),
      JSON.stringify(measurements, null, 2)
    );

    console.log('Local recreation measurements saved');
  });

  test('Capture Hero Section Detailed Comparison', async ({ page }) => {
    const screenshotsDir = path.join(projectRoot, 'test-results', 'screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // Original hero
    await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Try to find and screenshot hero section
    try {
      const heroSection = await page.locator('section, [class*="hero"]').first();
      await heroSection.screenshot({
        path: path.join(screenshotsDir, 'wix-hero-section.png')
      });
    } catch (e) {
      console.log('Could not capture Wix hero:', e.message);
    }

    // Local hero
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const localHero = await page.locator('.hero-section');
    await localHero.screenshot({
      path: path.join(screenshotsDir, 'local-hero-section.png')
    });

    console.log('Hero section screenshots captured');
  });
});
