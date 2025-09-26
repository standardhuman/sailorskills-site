import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture all console messages
const messages = [];
page.on('console', msg => {
    messages.push({
        type: msg.type(),
        text: msg.text()
    });
});

console.log('Testing if module script executes...\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(3000);

// Check for module execution markers
const moduleStatus = await page.evaluate(() => {
    return {
        hasRealUpdateChargeSummary: typeof window.updateChargeSummary === 'function' &&
                                    !window.updateChargeSummary.toString().includes('stub'),
        hasChargeCustomer: typeof window.chargeCustomer === 'function',
        hasOpenCustomerSelectionModal: typeof window.openCustomerSelectionModal === 'function',
        updateChargeSummarySource: window.updateChargeSummary ?
                                    window.updateChargeSummary.toString().substring(0, 100) : 'not defined'
    };
});

console.log('Module execution status:');
console.log(`  Real updateChargeSummary loaded: ${moduleStatus.hasRealUpdateChargeSummary}`);
console.log(`  chargeCustomer defined: ${moduleStatus.hasChargeCustomer}`);
console.log(`  openCustomerSelectionModal defined: ${moduleStatus.hasOpenCustomerSelectionModal}`);
console.log(`  updateChargeSummary source: ${moduleStatus.updateChargeSummarySource}...`);

console.log('\nConsole messages:');
messages.forEach(msg => {
    if (msg.text.includes('Module script') ||
        msg.text.includes('error') ||
        msg.type === 'error' ||
        msg.text.includes('Service already selected')) {
        console.log(`  [${msg.type}] ${msg.text}`);
    }
});

await browser.close();
