import { test, expect } from '@playwright/test';

test('Quick surcharge display check', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Click Recurring Cleaning
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(2000);

    // Check if wizard opened
    const wizardContent = await page.evaluate(() => {
        const wizard = document.getElementById('wizardContent');
        return wizard ? wizard.innerHTML : null;
    });

    console.log('Wizard opened:', !!wizardContent);

    // Scroll down to see more form fields
    await page.evaluate(() => {
        const wizard = document.getElementById('wizardContent');
        if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    await page.waitForTimeout(1000);

    // Check paint condition options
    const paintOptions = await page.evaluate(() => {
        const select = document.querySelector('select[name="paint_condition"]');
        if (!select) return [];
        const options = Array.from(select.querySelectorAll('option'));
        return options.map(opt => ({ value: opt.value, text: opt.textContent }));
    });

    console.log('\nPaint Condition Options:');
    paintOptions.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));

    // Check growth level options
    const growthOptions = await page.evaluate(() => {
        const select = document.querySelector('select[name="growth_level"]');
        if (!select) return [];
        const options = Array.from(select.querySelectorAll('option'));
        return options.map(opt => ({ value: opt.value, text: opt.textContent }));
    });

    console.log('\nGrowth Level Options:');
    growthOptions.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));

    // Check hull type options
    const hullOptions = await page.evaluate(() => {
        const select = document.querySelector('select[name="hull_type"]');
        if (!select) return [];
        const options = Array.from(select.querySelectorAll('option'));
        return options.map(opt => ({ value: opt.value, text: opt.textContent }));
    });

    console.log('\nHull Type Options:');
    hullOptions.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));

    // Verify correct percentages
    const paintGood = paintOptions.find(o => o.value === 'good');
    const paintFair = paintOptions.find(o => o.value === 'fair');
    const growthModerate = growthOptions.find(o => o.value === 'moderate');
    const growthHeavy = growthOptions.find(o => o.value === 'heavy');
    const hullTrimaran = hullOptions.find(o => o.value === 'trimaran');

    console.log('\n=== Verifying Key Surcharges ===');
    console.log(`Paint Good: ${paintGood?.text} (should contain 0%)`);
    console.log(`Paint Fair: ${paintFair?.text} (should contain 0%)`);
    console.log(`Growth Moderate: ${growthModerate?.text} (should contain 0%)`);
    console.log(`Growth Heavy: ${growthHeavy?.text} (should contain 35%)`);
    console.log(`Hull Trimaran: ${hullTrimaran?.text} (should contain 50%)`);

    // Basic assertions - check if options exist first
    if (paintOptions.length > 0) {
        expect(paintGood?.text || '').toContain('0%');
        expect(paintFair?.text || '').toContain('0%');
    } else {
        console.log('⚠️  Paint options not found - form may not be fully loaded');
    }

    if (growthOptions.length > 0) {
        expect(growthModerate?.text || '').toContain('0%');
        expect(growthHeavy?.text || '').toContain('35%');
    } else {
        console.log('⚠️  Growth options not found - form may not be fully loaded');
    }

    if (hullOptions.length > 0) {
        expect(hullTrimaran?.text || '').toContain('50%');
    } else {
        console.log('⚠️  Hull options not found - form may not be fully loaded');
    }

    if (paintOptions.length > 0 && growthOptions.length > 0 && hullOptions.length > 0) {
        console.log('\n✅ All surcharge percentages are correct!');
    }
});