import { test } from '@playwright/test';

test('Debug service button clicks', async ({ page }) => {
    // Capture console messages
    const logs = [];
    page.on('console', msg => {
        logs.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to admin page
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Check initial state
    console.log('=== Initial State ===');
    const initialState = await page.evaluate(() => {
        return {
            adminAppExists: typeof window.adminApp !== 'undefined',
            renderConsolidatedFormExists: typeof window.renderConsolidatedForm !== 'undefined',
            selectServiceDirectExists: typeof window.selectServiceDirect !== 'undefined',
            serviceButtons: document.querySelectorAll('.simple-service-btn').length
        };
    });
    console.log(initialState);

    // Try clicking Recurring Cleaning
    console.log('\n=== Clicking Recurring Cleaning ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Check what happened
    const afterClick = await page.evaluate(() => {
        const wizardContainer = document.getElementById('wizardContainer');
        const wizardContent = document.getElementById('wizardContent');
        return {
            wizardVisible: wizardContainer?.style.display,
            wizardHasContent: wizardContent?.innerHTML.length > 0,
            wizardFirstChars: wizardContent?.innerHTML.substring(0, 100),
            currentServiceKey: window.currentServiceKey,
            serviceButtonsHidden: document.getElementById('simpleServiceButtons')?.style.display
        };
    });
    console.log(afterClick);

    // Check if anode section exists
    const anodeCheck = await page.evaluate(() => {
        const anodeSection = document.getElementById('anodeSection');
        const addAnodesBtn = document.querySelector('button:has-text("Add Anodes")');
        return {
            anodeSectionExists: !!anodeSection,
            anodeSectionVisible: anodeSection?.style.display,
            addAnodesBtnExists: !!addAnodesBtn
        };
    });
    console.log('\n=== Anode Section Check ===');
    console.log(anodeCheck);

    // Print console logs
    console.log('\n=== Console Logs ===');
    logs.forEach(log => {
        if (log.type === 'error') {
            console.log(`ERROR: ${log.text}`);
        } else if (log.type === 'log' && (log.text.includes('Service') || log.text.includes('renderConsolidated'))) {
            console.log(`LOG: ${log.text}`);
        }
    });

    // Take screenshot
    await page.screenshot({ path: 'button-debug.png', fullPage: true });
});