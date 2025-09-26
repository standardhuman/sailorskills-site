import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log("Testing /admin endpoint...");

await page.goto("http://localhost:3000/admin");
await page.waitForTimeout(2000);

const pageInfo = await page.evaluate(() => {
    return {
        hasAdminApp: typeof window.adminApp !== "undefined",
        hasOldUpdateChargeSummary: window.updateChargeSummary?.toString().includes("stub"),
        chargeButtonExists: !!document.getElementById("chargeButton"),
        title: document.title
    };
});

console.log("Page info:", pageInfo);

await browser.close();
