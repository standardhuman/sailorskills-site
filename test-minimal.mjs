import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.on("console", msg => {
    console.log("[console]", msg.text());
});

console.log("Testing minimal admin page...");

await page.goto("http://localhost:3000/test-admin-minimal.html");
await page.waitForTimeout(2000);

const buttonState = await page.evaluate(() => {
    return {
        disabled: document.getElementById("chargeButton")?.disabled,
        detailsText: document.getElementById("chargeDetails")?.textContent
    };
});

console.log("Button state:", buttonState);

await browser.close();
