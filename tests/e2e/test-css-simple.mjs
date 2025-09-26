import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🔍 Testing CSS on Vercel');
console.log('========================\n');

const url = 'https://cost-calculator-sigma.vercel.app/diving';

// Navigate with longer timeout
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

// Take screenshot
await page.screenshot({ path: 'vercel-diving-page.png', fullPage: true });
console.log('📸 Screenshot saved as vercel-diving-page.png');

// Check computed styles
const styles = await page.evaluate(() => {
    const body = document.body;
    const h1 = document.querySelector('h1');
    const bodyStyles = window.getComputedStyle(body);
    const h1Styles = h1 ? window.getComputedStyle(h1) : null;

    return {
        body: {
            fontFamily: bodyStyles.fontFamily,
            background: bodyStyles.background,
            backgroundColor: bodyStyles.backgroundColor,
            backgroundImage: bodyStyles.backgroundImage
        },
        h1: h1Styles ? {
            fontFamily: h1Styles.fontFamily,
            fontSize: h1Styles.fontSize,
            color: h1Styles.color
        } : null,
        stylesheets: Array.from(document.styleSheets).map(sheet => sheet.href).filter(Boolean)
    };
});

console.log('\n📋 Computed Styles:');
console.log(JSON.stringify(styles, null, 2));

// Check if CSS is properly applied
const hasStyling = styles.body.fontFamily.includes('Montserrat') ||
                   styles.body.backgroundImage !== 'none' ||
                   (styles.h1 && styles.h1.fontFamily.includes('Montserrat'));

console.log(`\n${hasStyling ? '✅' : '❌'} CSS is ${hasStyling ? 'WORKING' : 'NOT WORKING'}`);

await browser.close();