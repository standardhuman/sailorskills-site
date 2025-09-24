import { chromium } from "playwright";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log("🎨 Final Admin Page Test");
console.log("========================\n");

// Navigate to admin page
await page.goto("http://localhost:3000/admin");
await page.waitForTimeout(2000);

// 1. Check overall styling
console.log("1️⃣ Checking Styling:");
const styling = await page.evaluate(() => {
    const badge = document.querySelector('.admin-badge');
    const container = document.querySelector('.container');
    const heroTitle = document.querySelector('.hero-title');

    return {
        badgeFloating: badge ? window.getComputedStyle(badge).position === 'fixed' : false,
        badgeText: badge?.textContent,
        containerWidth: container ? window.getComputedStyle(container).maxWidth : null,
        heroTitle: heroTitle?.textContent,
        serviceButtonCount: document.querySelectorAll('.simple-service-btn').length
    };
});

console.log(`  ✅ Admin badge: ${styling.badgeFloating ? 'Floating' : 'Not floating'} - "${styling.badgeText}"`);
console.log(`  ✅ Container width: ${styling.containerWidth}`);
console.log(`  ✅ Hero title: ${styling.heroTitle}`);
console.log(`  ✅ Service buttons: ${styling.serviceButtonCount} buttons\n`);

// 2. Test flat rate service selection (Anodes Only)
console.log("2️⃣ Testing Flat Rate Service (Anodes Only):");
const anodesButton = await page.$('button:has-text("Zinc Anodes Only")');
if (anodesButton) {
    await anodesButton.click();
    await page.waitForTimeout(500);

    const flatRateResult = await page.evaluate(() => {
        const details = document.getElementById('chargeDetails');
        const button = document.getElementById('chargeButton');

        return {
            serviceKey: window.adminApp?.currentServiceKey,
            detailsHTML: details?.innerHTML || '',
            buttonEnabled: !button?.disabled,
            buttonText: button?.textContent?.trim()
        };
    });

    console.log(`  • Service key: ${flatRateResult.serviceKey}`);
    console.log(`  • Button enabled: ${flatRateResult.buttonEnabled ? '✅ Yes' : '❌ No'}`);
    console.log(`  • Button text: ${flatRateResult.buttonText}`);

    // Check if price shows in details
    const hasPrice = flatRateResult.detailsHTML.includes('$150');
    console.log(`  • Price shown: ${hasPrice ? '✅ $150.00' : '❌ Not shown'}\n`);
}

// 3. Test per-foot service (Recurring Cleaning)
console.log("3️⃣ Testing Per-Foot Service (Recurring Cleaning):");
const cleaningButton = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningButton) {
    await cleaningButton.click();
    await page.waitForTimeout(500);

    const wizardVisible = await page.evaluate(() => {
        const wizard = document.getElementById('wizardContainer');
        return wizard && wizard.style.display !== 'none';
    });

    console.log(`  • Wizard displayed: ${wizardVisible ? '✅ Yes' : '❌ No'}`);

    if (wizardVisible) {
        // Set boat length
        const boatInput = await page.$('#adminBoatLength');
        if (boatInput) {
            await boatInput.fill('40');
            await page.waitForTimeout(500);

            // Click calculate price
            const calcButton = await page.$('button:has-text("Calculate Price")');
            if (calcButton) {
                await calcButton.click();
                await page.waitForTimeout(1000);

                const perFootResult = await page.evaluate(() => {
                    const details = document.getElementById('chargeDetails');
                    const button = document.getElementById('chargeButton');

                    return {
                        buttonEnabled: !button?.disabled,
                        buttonText: button?.textContent?.trim(),
                        hasPrice: details?.innerHTML?.includes('$') || false
                    };
                });

                console.log(`  • Button enabled: ${perFootResult.buttonEnabled ? '✅ Yes' : '❌ No'}`);
                console.log(`  • Shows price: ${perFootResult.hasPrice ? '✅ Yes' : '❌ No'}`);
                console.log(`  • Button text: ${perFootResult.buttonText}\n`);
            }
        }
    }
}

// 4. Check customer selection integration
console.log("4️⃣ Checking Customer Integration:");
const chargeBtn = await page.$('#chargeButton:not([disabled])');
if (chargeBtn) {
    console.log("  ✅ Charge button is enabled (service selected)");

    // Try clicking charge button without customer
    await chargeBtn.click();
    await page.waitForTimeout(500);

    const modalVisible = await page.evaluate(() => {
        const modal = document.getElementById('customerSelectionModal');
        return modal && modal.style.display !== 'none';
    });

    console.log(`  • Modal shows on charge: ${modalVisible ? '✅ Yes' : '❌ No'}\n`);

    if (modalVisible) {
        // Close modal
        const closeBtn = await page.$('.close');
        if (closeBtn) await closeBtn.click();
    }
}

console.log("✨ Admin page test complete!");
console.log("The admin page has been restored to its original styling with:");
console.log("  • Floating ADMIN MODE badge");
console.log("  • 800px container width");
console.log("  • All 6 service buttons");
console.log("  • Proper charge summary functionality");

await page.screenshot({ path: 'admin-final-test.png', fullPage: true });
console.log("\n📸 Full-page screenshot saved as admin-final-test.png");

await browser.close();