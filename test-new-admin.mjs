import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.on("console", msg => {
    console.log("[console]", msg.text());
});

console.log("Testing new admin page...");

await page.goto("http://localhost:3000/admin-new.html");
await page.waitForTimeout(3000);

const appStatus = await page.evaluate(() => {
    return {
        adminAppExists: typeof window.adminApp !== "undefined",
        updateChargeSummaryType: typeof window.updateChargeSummary,
        chargeButtonDisabled: document.getElementById("chargeButton")?.disabled
    };
});

console.log("App status:", appStatus);

await page.evaluate(() => {
    if (window.adminApp) {
        window.adminApp.currentServiceKey = "test_service";
        window.adminApp.updateChargeSummary();
    }
});

await page.waitForTimeout(1000);

const afterService = await page.evaluate(() => {
    return {
        chargeButtonDisabled: document.getElementById("chargeButton")?.disabled,
        chargeDetails: document.getElementById("chargeDetails")?.textContent
    };
});

console.log("After setting service:", afterService);

await browser.close();
