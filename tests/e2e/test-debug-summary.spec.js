import { test, expect } from '@playwright/test';

test('Debug charge summary display issue', async ({ page }) => {
    // Add console listener to capture any JavaScript errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Browser Error:', msg.text());
        }
    });

    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    console.log('=== Debugging Charge Summary Display ===\n');

    // Step 1: Open wizard
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Step 2: Check if wizard opened
    const wizardVisible = await page.evaluate(() => {
        const wizard = document.getElementById('wizardContainer');
        return wizard ? wizard.style.display : 'not found';
    });
    console.log(`1. Wizard container display: ${wizardVisible}`);

    // Step 3: Set boat configuration
    await page.fill('#wizardBoatLength', '40');
    await page.click('input[name="wizard_boat_type"][value="powerboat"]');
    await page.click('input[name="wizard_hull_type"][value="catamaran"]');

    const twinEngines = await page.locator('#wizard_twin_engines');
    if (await twinEngines.count() > 0) {
        await twinEngines.check();
    }

    await page.fill('#wizardGrowthLevelSlider', '70');
    console.log('2. Configured: 40ft powerboat catamaran with twin engines and heavy growth');

    // Wait for updates
    await page.waitForTimeout(2000);

    // Step 4: Check what functions are available
    const functionsAvailable = await page.evaluate(() => {
        return {
            updateWizardPricing: typeof window.updateWizardPricing,
            updateChargeSummary: typeof window.updateChargeSummary,
            currentServiceKey: window.currentServiceKey,
            selectedCustomer: window.selectedCustomer ? 'exists' : 'null'
        };
    });
    console.log('\n3. Functions available:', functionsAvailable);

    // Step 5: Try to manually trigger updateWizardPricing
    const manualUpdate = await page.evaluate(() => {
        if (window.updateWizardPricing) {
            try {
                window.updateWizardPricing();
                return 'Called successfully';
            } catch (e) {
                return 'Error: ' + e.message;
            }
        }
        return 'Function not found';
    });
    console.log(`\n4. Manual updateWizardPricing call: ${manualUpdate}`);

    // Step 6: Check charge summary element
    const summaryCheck = await page.evaluate(() => {
        const elem = document.getElementById('chargeSummaryContent');
        if (!elem) {
            // Try to find it with querySelector
            const altElem = document.querySelector('#chargeSummaryContent');
            if (altElem) {
                return { found: true, method: 'querySelector', content: altElem.innerHTML.substring(0, 200) };
            }

            // Check if it exists in a different location
            const anyChargeSummary = document.querySelector('.charge-summary');
            if (anyChargeSummary) {
                return { found: false, method: 'class found', hasContent: anyChargeSummary.innerHTML.includes('chargeSummaryContent') };
            }

            return { found: false, method: 'not found at all' };
        }

        return {
            found: true,
            method: 'getElementById',
            display: elem.style.display || 'default',
            visibility: elem.style.visibility || 'default',
            innerHTML: elem.innerHTML.substring(0, 500),
            textContent: elem.textContent.substring(0, 200),
            parentDisplay: elem.parentElement ? elem.parentElement.style.display : 'no parent'
        };
    });

    console.log('\n5. Charge summary element check:');
    console.log(JSON.stringify(summaryCheck, null, 2));

    // Step 7: Check if charge summary is in viewport
    if (summaryCheck.found) {
        const inViewport = await page.evaluate(() => {
            const elem = document.getElementById('chargeSummaryContent');
            if (!elem) return false;

            const rect = elem.getBoundingClientRect();
            return {
                top: rect.top,
                bottom: rect.bottom,
                visible: rect.top < window.innerHeight && rect.bottom > 0,
                windowHeight: window.innerHeight
            };
        });
        console.log('\n6. Element viewport position:', inViewport);

        // Try scrolling to it
        await page.evaluate(() => {
            const elem = document.getElementById('chargeSummaryContent');
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        await page.waitForTimeout(1000);

        // Check content again after scroll
        const afterScroll = await page.evaluate(() => {
            const elem = document.getElementById('chargeSummaryContent');
            if (!elem) return 'Element disappeared';

            return {
                innerHTML: elem.innerHTML.substring(0, 300),
                hasBoatDetails: elem.innerHTML.includes('Boat Details'),
                hasPricingBreakdown: elem.innerHTML.includes('Pricing Breakdown'),
                hasService: elem.textContent.includes('Service:'),
                hasTotal: elem.textContent.includes('Total:')
            };
        });
        console.log('\n7. Content after scroll:', afterScroll);
    }

    // Step 8: Try calling updateChargeSummary directly
    const directCall = await page.evaluate(() => {
        if (window.updateChargeSummary) {
            try {
                window.updateChargeSummary();
                const elem = document.getElementById('chargeSummaryContent');
                return elem ? elem.innerHTML.substring(0, 200) : 'Element not found after update';
            } catch (e) {
                return 'Error: ' + e.message;
            }
        }
        return 'updateChargeSummary not found';
    });
    console.log('\n8. After calling updateChargeSummary:', directCall);

    // Step 9: Check what's in the actual HTML
    const htmlStructure = await page.evaluate(() => {
        const container = document.querySelector('.charge-summary');
        if (!container) return 'No .charge-summary found';

        // Get the structure
        const structure = {
            hasH3: container.querySelector('h3') ? container.querySelector('h3').textContent : 'no h3',
            hasChargeDetails: !!container.querySelector('.charge-details'),
            innerElements: Array.from(container.querySelectorAll('*')).map(el => el.tagName + (el.id ? '#' + el.id : '')).slice(0, 10)
        };
        return structure;
    });
    console.log('\n9. HTML Structure:', htmlStructure);

    // Final check
    const finalStatus = summaryCheck.found &&
                       (summaryCheck.innerHTML?.includes('Boat Details') ||
                        summaryCheck.innerHTML?.includes('Pricing Breakdown'));

    console.log('\n=== RESULT ===');
    console.log(finalStatus ? '✅ Detailed charge summary is working!' : '❌ Detailed charge summary NOT showing');
});