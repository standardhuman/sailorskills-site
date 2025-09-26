import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newContext().then(ctx => ctx.newPage());

console.log('Testing service layout with separator...\n');
await page.goto('http://localhost:3000/diving');
await page.waitForTimeout(2000);

// Get all elements including separator
const elements = await page.$$eval('.service-selection-grid > *', items => 
    items.map((el, i) => {
        if (el.className.includes('service-separator')) {
            return {
                index: i + 1,
                type: 'separator',
                text: el.querySelector('span')?.textContent || ''
            };
        } else if (el.className.includes('service-option')) {
            return {
                index: i + 1,
                type: 'service',
                name: el.querySelector('.service-name')?.textContent || '',
                price: el.querySelector('.service-price')?.textContent || '',
                fullWidth: el.className.includes('full-width')
            };
        }
        return { index: i + 1, type: 'unknown' };
    })
);

console.log('Layout structure:');
console.log('='.repeat(50));
elements.forEach(el => {
    if (el.type === 'separator') {
        console.log(`\n--- ${el.text} ---\n`);
    } else if (el.type === 'service') {
        console.log(`${el.index}. ${el.name}`);
        console.log(`   Price: ${el.price}`);
        console.log(`   Full width: ${el.fullWidth}`);
    }
});

// Check separator visibility
const separatorVisible = await page.$('.service-separator') !== null;
console.log(`\nSeparator visible: ${separatorVisible}`);

await page.screenshot({ path: 'separator-layout.png' });
console.log('Screenshot saved as separator-layout.png');

await browser.close();
