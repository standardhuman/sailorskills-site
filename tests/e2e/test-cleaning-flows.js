import { chromium } from 'playwright';

async function testCleaningFlows() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newContext().then(ctx => ctx.newPage());
    
    try {
        // Test Recurring Cleaning Flow
        console.log('Testing RECURRING CLEANING flow:\n');
        await page.goto('http://localhost:3000/diving');
        await page.waitForTimeout(1500);
        
        // Click recurring cleaning
        await page.click('div[data-service-key="recurring_cleaning"]');
        await page.waitForTimeout(1000);
        
        // Check what step we're on
        let visibleStep = await page.$eval('.form-step[style*="block"]', el => ({
            id: el.id,
            heading: el.querySelector('h2')?.textContent || ''
        }));
        console.log('After selecting Recurring Cleaning:');
        console.log('  Current step:', visibleStep.id, '-', visibleStep.heading);
        
        // Click Next
        await page.click('#nextButton');
        await page.waitForTimeout(1000);
        
        visibleStep = await page.$eval('.form-step[style*="block"]', el => ({
            id: el.id,
            heading: el.querySelector('h2')?.textContent || ''
        }));
        console.log('After clicking Next:');
        console.log('  Current step:', visibleStep.id, '-', visibleStep.heading);
        
        // Go back to start
        await page.reload();
        await page.waitForTimeout(1500);
        
        // Test One-time Cleaning Flow
        console.log('\nTesting ONE-TIME CLEANING flow:\n');
        
        // Click one-time cleaning
        await page.click('div[data-service-key="onetime_cleaning"]');
        await page.waitForTimeout(1000);
        
        visibleStep = await page.$eval('.form-step[style*="block"]', el => ({
            id: el.id,
            heading: el.querySelector('h2')?.textContent || ''
        }));
        console.log('After selecting One-time Cleaning:');
        console.log('  Current step:', visibleStep.id, '-', visibleStep.heading);
        
        // Click Next
        await page.click('#nextButton');
        await page.waitForTimeout(1000);
        
        visibleStep = await page.$eval('.form-step[style*="block"]', el => ({
            id: el.id,
            heading: el.querySelector('h2')?.textContent || ''
        }));
        console.log('After clicking Next:');
        console.log('  Current step:', visibleStep.id, '-', visibleStep.heading);
        
        // Check the full flow - keep clicking next
        console.log('\nFull flow for One-time (clicking through all steps):');
        for (let i = 0; i < 6; i++) {
            await page.click('#nextButton');
            await page.waitForTimeout(500);
            
            const step = await page.$eval('.form-step[style*="block"]', el => ({
                heading: el.querySelector('h2')?.textContent || 'Results/End'
            })).catch(() => ({ heading: 'Error/End' }));
            
            console.log(`  Step ${i+2}: ${step.heading}`);
            
            if (step.heading.includes('Estimated Cost') || step.heading.includes('Error')) {
                break;
            }
        }
        
    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

testCleaningFlows().catch(console.error);
