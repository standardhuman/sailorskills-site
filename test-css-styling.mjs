import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing CSS Styling on Production');
console.log('=====================================\n');

const url = 'https://cost-calculator-sigma.vercel.app';

// Go to diving page
await page.goto(`${url}/diving`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Check if CSS is loaded by looking at computed styles
const h1Styles = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return null;
    const styles = window.getComputedStyle(h1);
    return {
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        color: styles.color,
        fontWeight: styles.fontWeight,
        margin: styles.margin
    };
});

console.log('H1 Computed Styles:');
console.log(h1Styles);

// Check for specific CSS classes
const hasStyledElements = await page.evaluate(() => {
    const results = {
        heroHeader: !!document.querySelector('.hero-header'),
        container: !!document.querySelector('.container'),
        serviceButtons: document.querySelectorAll('.service-btn').length,
        hasBackgroundGradient: false
    };

    // Check if body has gradient background
    const bodyStyle = window.getComputedStyle(document.body);
    results.hasBackgroundGradient = bodyStyle.background.includes('gradient') ||
                                    bodyStyle.backgroundImage.includes('gradient');

    return results;
});

console.log('\nCSS Classes Found:');
console.log(hasStyledElements);

// Check if style.css loaded
const stylesheetLoaded = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => ({
        href: link.href,
        loaded: link.sheet !== null
    }));
});

console.log('\nStylesheets:');
stylesheetLoaded.forEach(sheet => {
    console.log(`  ${sheet.loaded ? '✅' : '❌'} ${sheet.href}`);
});

// Take screenshot
await page.screenshot({ path: 'css-check-diving.png' });
console.log('\n📸 Screenshot saved as css-check-diving.png');

// Now check admin page
console.log('\n--- Checking Admin Page ---');
await page.goto(`${url}/admin`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const adminStyles = await page.evaluate(() => {
    const adminBadge = document.querySelector('.admin-badge');
    const heroHeader = document.querySelector('.hero-header');

    return {
        adminBadgeExists: !!adminBadge,
        heroHeaderBackground: heroHeader ? window.getComputedStyle(heroHeader).background : 'none',
        serviceButtonsCount: document.querySelectorAll('.simple-service-btn').length
    };
});

console.log('\nAdmin Page Styles:');
console.log(adminStyles);

await page.screenshot({ path: 'css-check-admin.png' });
console.log('📸 Screenshot saved as css-check-admin.png\n');

// Final verdict
const hasCSS = h1Styles && h1Styles.fontSize !== '32px' && h1Styles.fontFamily !== 'Times New Roman';
console.log(`\n${hasCSS ? '✅' : '❌'} CSS Styling is ${hasCSS ? 'WORKING' : 'NOT WORKING'}`);

await browser.close();