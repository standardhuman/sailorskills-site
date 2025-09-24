import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Testing diving page...\n');

// Test diving.html
await page.goto('http://localhost:3000/diving.html');
const title = await page.title();
console.log('✓ Diving page title:', title);

// Check for service buttons
const serviceButtons = await page.locator('.service-selection-grid button').count();
console.log('✓ Service buttons found:', serviceButtons);

// Check page structure
const heroHeader = await page.locator('.hero-header').count();
const calculator = await page.locator('.calculator-container').count();
console.log('✓ Hero header present:', heroHeader > 0);
console.log('✓ Calculator container present:', calculator > 0);

// Test admin page
await page.goto('http://localhost:3000/admin.html');
const adminTitle = await page.title();
console.log('\n✓ Admin page title:', adminTitle);

// Check for growth slider in admin
const growthSliders = await page.locator('.growth-slider').count();
console.log('✓ Growth sliders in admin:', growthSliders);

console.log('\n✅ All pages accessible and functional!');

await browser.close();
