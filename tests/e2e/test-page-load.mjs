import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
    console.log('Loading admin page...');
    await page.goto('http://localhost:3000/admin.html', { waitUntil: 'domcontentloaded' });
    console.log('✓ Page loaded');
    
    // Check if page has content
    const title = await page.title();
    console.log('Page title:', title);
    
    // Look for service buttons
    const serviceButtons = await page.locator('.simple-service-btn').count();
    console.log('Service buttons found:', serviceButtons);
    
    // Look for sliders
    const sliders = await page.locator('.growth-slider').count();
    console.log('Growth sliders found:', sliders);
    
    // Check if main form section exists
    const mainForm = await page.locator('#cleaningOptions').count();
    console.log('Main form section found:', mainForm > 0);
    
} catch (error) {
    console.error('Error:', error.message);
}

await browser.close();
