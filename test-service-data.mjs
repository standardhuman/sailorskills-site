import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("http://localhost:3000/admin");
await page.waitForTimeout(2000);

const serviceInfo = await page.evaluate(() => {
    return {
        availableServices: window.serviceData ? Object.keys(window.serviceData) : [],
        serviceDetails: window.serviceData || {}
    };
});

console.log("Available services:", serviceInfo.availableServices);
console.log("\nService details:");
for (const [key, value] of Object.entries(serviceInfo.serviceDetails)) {
    console.log(`  ${key}: ${value.name}`);
}

await browser.close();