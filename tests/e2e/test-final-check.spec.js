import { test, expect } from '@playwright/test';

test('Final check - All service wizards working', async ({ page }) => {
    // Capture console logs
    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('renderConsolidatedForm') || text.includes('Service')) {
            logs.push(text);
        }
    });

    await page.goto('http://localhost:3000/admin');
    await page.waitForTimeout(2000);

    // Test 1: Recurring Cleaning
    console.log('=== Testing Recurring Cleaning ===');
    await page.click('button:has-text("🔄 Recurring Cleaning")');
    await page.waitForTimeout(1500);

    let wizardState = await page.evaluate(() => ({
        visible: document.getElementById('wizardContainer')?.style.display,
        hasContent: document.getElementById('wizardContent')?.innerHTML.length > 100,
        anodeSection: !!document.getElementById('anodeSection')
    }));
    console.log('Recurring Cleaning wizard:', wizardState);
    expect(wizardState.visible).toBe('block');
    expect(wizardState.hasContent).toBe(true);
    expect(wizardState.anodeSection).toBe(true);

    // Go back
    await page.reload();
    await page.waitForTimeout(1000);

    // Test 2: One-time Cleaning
    console.log('\n=== Testing One-time Cleaning ===');
    await page.click('button:has-text("✨ One-Time Cleaning")');
    await page.waitForTimeout(1500);

    wizardState = await page.evaluate(() => ({
        visible: document.getElementById('wizardContainer')?.style.display,
        hasContent: document.getElementById('wizardContent')?.innerHTML.length > 100,
        anodeSection: !!document.getElementById('anodeSection')
    }));
    console.log('One-time Cleaning wizard:', wizardState);
    expect(wizardState.visible).toBe('block');
    expect(wizardState.hasContent).toBe(true);
    expect(wizardState.anodeSection).toBe(true);

    // Go back
    await page.reload();
    await page.waitForTimeout(1000);

    // Test 3: Anodes Only
    console.log('\n=== Testing Anodes Only ===');
    await page.click('button:has-text("🔋 Anodes Only")');
    await page.waitForTimeout(1500);

    wizardState = await page.evaluate(() => ({
        visible: document.getElementById('wizardContainer')?.style.display,
        hasContent: document.getElementById('wizardContent')?.innerHTML.length > 100,
        anodeSection: !!document.getElementById('anodeSection'),
        anodeSectionVisible: document.getElementById('anodeSection')?.style.display
    }));
    console.log('Anodes Only wizard:', wizardState);
    expect(wizardState.visible).toBe('block');
    expect(wizardState.hasContent).toBe(true);
    expect(wizardState.anodeSection).toBe(true);
    expect(wizardState.anodeSectionVisible).toBe('block'); // Should auto-open

    // Check if anode grid has items
    const anodeItems = await page.locator('.anode-item').count();
    console.log(`Anode items loaded: ${anodeItems}`);

    console.log('\n=== Console Logs ===');
    logs.forEach(log => console.log(log));

    console.log('\n✅ All service wizards are now working with anode pickers!');
});