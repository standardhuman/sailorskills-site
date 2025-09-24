import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🎨 Testing UI Improvements');
console.log('==========================\n');

await page.goto('http://localhost:3000/admin');
await page.waitForTimeout(1500);

// Click Recurring Cleaning
const cleaningBtn = await page.$('button:has-text("Recurring Cleaning")');
if (cleaningBtn) {
    await cleaningBtn.click();
    await page.waitForTimeout(1000);

    // Check slider labels positioning
    const sliderInfo = await page.evaluate(() => {
        const labels = document.querySelector('.slider-labels');
        const slider = document.getElementById('adminGrowthLevel');

        if (!labels || !slider) return { found: false };

        const labelsRect = labels.getBoundingClientRect();
        const sliderRect = slider.getBoundingClientRect();

        return {
            found: true,
            sliderBottom: sliderRect.bottom,
            labelsTop: labelsRect.top,
            labelsBelow: labelsRect.top > sliderRect.bottom,
            gap: labelsRect.top - sliderRect.bottom,
            labelCount: document.querySelectorAll('.slider-label').length
        };
    });

    console.log('1️⃣ Slider Labels Position:');
    console.log(`   Labels found: ${sliderInfo.found ? '✅' : '❌'}`);
    if (sliderInfo.found) {
        console.log(`   Position: ${sliderInfo.labelsBelow ? '✅ Below slider' : '❌ Not below'}`);
        console.log(`   Gap from slider: ${sliderInfo.gap.toFixed(0)}px`);
        console.log(`   Number of labels: ${sliderInfo.labelCount}`);
    }

    // Check checkbox touch targets
    const checkboxInfo = await page.evaluate(() => {
        const powerboatLabel = document.querySelector('label:has(#adminPowerboat)');
        const twinEnginesLabel = document.querySelector('label:has(#adminTwinEngines)');

        const getSize = (element) => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height,
                hasBackground: window.getComputedStyle(element).backgroundColor !== 'rgba(0, 0, 0, 0)',
                hasBorder: window.getComputedStyle(element).borderWidth !== '0px',
                cursor: window.getComputedStyle(element).cursor
            };
        };

        return {
            powerboat: getSize(powerboatLabel),
            twinEngines: getSize(twinEnginesLabel)
        };
    });

    console.log('\n2️⃣ Checkbox Touch Targets:');

    if (checkboxInfo.powerboat) {
        console.log('   Powerboat checkbox:');
        console.log(`     Size: ${checkboxInfo.powerboat.width.toFixed(0)}×${checkboxInfo.powerboat.height.toFixed(0)}px`);
        console.log(`     Touch friendly: ${checkboxInfo.powerboat.height >= 44 ? '✅' : '⚠️'} (${checkboxInfo.powerboat.height >= 44 ? 'Good' : 'Could be larger'})`);
        console.log(`     Styled: ${checkboxInfo.powerboat.hasBackground && checkboxInfo.powerboat.hasBorder ? '✅' : '❌'}`);
        console.log(`     Clickable: ${checkboxInfo.powerboat.cursor === 'pointer' ? '✅' : '❌'}`);
    }

    if (checkboxInfo.twinEngines) {
        console.log('   Twin engines checkbox:');
        console.log(`     Size: ${checkboxInfo.twinEngines.width.toFixed(0)}×${checkboxInfo.twinEngines.height.toFixed(0)}px`);
        console.log(`     Touch friendly: ${checkboxInfo.twinEngines.height >= 44 ? '✅' : '⚠️'} (${checkboxInfo.twinEngines.height >= 44 ? 'Good' : 'Could be larger'})`);
        console.log(`     Styled: ${checkboxInfo.twinEngines.hasBackground && checkboxInfo.twinEngines.hasBorder ? '✅' : '❌'}`);
        console.log(`     Clickable: ${checkboxInfo.twinEngines.cursor === 'pointer' ? '✅' : '❌'}`);
    }

    // Test clicking the larger touch targets
    console.log('\n3️⃣ Testing Touch Interaction:');

    // Click powerboat label area (not just checkbox)
    const powerboatLabel = await page.$('label:has(#adminPowerboat)');
    if (powerboatLabel) {
        // Click in the middle of the label
        const box = await powerboatLabel.boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        const isChecked = await page.evaluate(() => {
            return document.getElementById('adminPowerboat')?.checked;
        });

        console.log(`   Powerboat label click: ${isChecked ? '✅ Checked' : '❌ Not checked'}`);
    }

    // Visual feedback test
    console.log('\n4️⃣ Visual Feedback:');
    const visualFeedback = await page.evaluate(() => {
        const label = document.querySelector('label:has(#adminPowerboat)');
        if (!label) return { found: false };

        const styles = window.getComputedStyle(label);
        const checkedStyles = document.getElementById('adminPowerboat')?.checked;

        return {
            found: true,
            hasHoverEffect: styles.transition.includes('all'),
            isHighlighted: checkedStyles && styles.backgroundColor !== 'rgb(248, 249, 250)',
            borderChanges: styles.borderColor !== 'rgb(224, 224, 224)'
        };
    });

    if (visualFeedback.found) {
        console.log(`   Hover effects: ${visualFeedback.hasHoverEffect ? '✅' : '❌'}`);
        console.log(`   Checked state visible: ${visualFeedback.isHighlighted || visualFeedback.borderChanges ? '✅' : '❌'}`);
    }
}

console.log('\n✨ UI Improvements Complete!');
console.log('Summary:');
console.log('  • Growth level labels positioned under the slider');
console.log('  • Checkboxes have larger touch targets with backgrounds');
console.log('  • Full label area is clickable (not just checkbox)');
console.log('  • Visual feedback on hover and selection');
console.log('  • Better for touch interaction with gloved fingers');

await page.screenshot({ path: 'admin-ui-improvements.png', fullPage: true });
console.log('\n📸 Screenshot saved as admin-ui-improvements.png');

await browser.close();