import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Anodes Only service
const btn = await page.$('button:has-text("Zinc Anodes Only")');
if (btn) {
    await btn.click();
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
        const display = document.getElementById('totalCostDisplay');
        const details = document.getElementById('chargeDetails');
        const button = document.getElementById('chargeButton');

        return {
            displayValue: display?.textContent,
            detailsHTML: details?.innerHTML?.substring(0, 200),
            buttonEnabled: !button?.disabled,
            serviceKey: window.adminApp?.currentServiceKey,
            serviceData: window.serviceData?.anodes_only
        };
    });

    console.log('After selecting Anodes Only:');
    console.log('  Service key:', result.serviceKey);
    console.log('  Service data:', result.serviceData);
    console.log('  Display value:', result.displayValue);
    console.log('  Button enabled:', result.buttonEnabled);
    console.log('  Details HTML preview:', result.detailsHTML);
}

await browser.close();