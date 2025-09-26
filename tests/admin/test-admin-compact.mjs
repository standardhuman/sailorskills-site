import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Testing compact admin interface...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Take screenshot of the compact interface
await page.screenshot({ path: 'admin-compact-interface.png', clip: { x: 0, y: 0, width: 800, height: 400 } });
console.log('✓ Screenshot saved as admin-compact-interface.png');

// Check dimensions
const searchInput = await page.locator('#customerSearch');
const searchBox = await searchInput.boundingBox();
console.log(`\nSearch input dimensions:`);
console.log(`  Width: ${searchBox?.width}px`);
console.log(`  Height: ${searchBox?.height}px`);

// Check button dimensions
const buttons = await page.locator('.customer-btn').all();
console.log(`\nButton dimensions:`);
for (let i = 0; i < Math.min(3, buttons.length); i++) {
    const box = await buttons[i].boundingBox();
    const text = await buttons[i].textContent();
    console.log(`  "${text}": ${box?.width}px × ${box?.height}px`);
}

console.log('\n✅ Compact interface test complete!');

await page.waitForTimeout(2000);
await browser.close();
