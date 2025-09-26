import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newContext().then(ctx => ctx.newPage());

console.log('Testing Anodes Only service update...\n');
await page.goto('http://localhost:3000/diving');
await page.waitForTimeout(2000);

// Find Anodes Only button
const anodesButton = await page.$('div[data-service-key="anodes_only"]');
if (anodesButton) {
    const buttonText = await anodesButton.textContent();
    console.log('Anodes Only button text:', buttonText);
    
    // Check if it has full-width class
    const classes = await anodesButton.getAttribute('class');
    const isFullWidth = classes.includes('full-width-service');
    console.log('Has full-width class:', isFullWidth);
    
    // Get grid column style
    const gridColumn = await anodesButton.evaluate(el => 
        window.getComputedStyle(el).gridColumn
    );
    console.log('Grid column:', gridColumn);
    
    // Check the price text specifically
    const priceText = await anodesButton.$eval('.service-price', el => el.textContent);
    console.log('Price text:', priceText);
}

// Get all services to see the layout
console.log('\nAll services in order:');
const allServices = await page.$$eval('.service-option', buttons => 
    buttons.map(btn => ({
        name: btn.querySelector('.service-name')?.textContent || '',
        price: btn.querySelector('.service-price')?.textContent || '',
        fullWidth: btn.className.includes('full-width')
    }))
);

allServices.forEach((service, i) => {
    console.log(`${i+1}. ${service.name}`);
    console.log(`   Price: ${service.price}`);
    console.log(`   Full width: ${service.fullWidth}\n`);
});

await page.screenshot({ path: 'anodes-updated.png' });
console.log('Screenshot saved as anodes-updated.png');

await browser.close();
