import { test } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

test('Check wizard elements exist', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('=== CLICKING SERVICE ===');
  await page.click('button:has-text("Recurring Cleaning")');
  await page.waitForTimeout(2000);

  console.log('\n=== WIZARD ELEMENTS CHECK ===');
  const elements = await page.evaluate(() => {
    const results = {};

    // Check for all wizard-related elements
    const elementIds = [
      'wizardContainer',
      'wizardContent',
      'wizardBoatLength',
      'wizardBoatName',
      'wizardTotalPrice',
      'wizardCostBreakdown',
      'boatLength',
      'totalCost',
      'totalCostDisplay'
    ];

    elementIds.forEach(id => {
      const el = document.getElementById(id);
      results[id] = {
        exists: !!el,
        value: el?.value || el?.textContent || 'N/A',
        visible: el ? window.getComputedStyle(el).display !== 'none' : false,
        tagName: el?.tagName || 'N/A'
      };
    });

    // Also check wizard HTML content
    const wizardContent = document.getElementById('wizardContent');
    results.wizardHTML = wizardContent ? wizardContent.innerHTML.substring(0, 500) : 'No wizard content';

    return results;
  });

  console.log('Element Status:');
  Object.entries(elements).forEach(([key, info]) => {
    if (key !== 'wizardHTML') {
      console.log(`  ${key}: ${info.exists ? '✓' : '✗'} (${info.tagName}) - Value: "${info.value}" - Visible: ${info.visible}`);
    }
  });

  console.log('\nFirst 500 chars of wizard HTML:');
  console.log(elements.wizardHTML);

  // Try to find boat length input by any selector
  console.log('\n=== SEARCHING FOR BOAT LENGTH INPUT ===');
  const boatInputs = await page.evaluate(() => {
    const inputs = [];
    // Search by partial ID match
    document.querySelectorAll('input[type="number"]').forEach(input => {
      if (input.id.toLowerCase().includes('boat') || input.placeholder?.toLowerCase().includes('boat')) {
        inputs.push({
          id: input.id,
          name: input.name,
          placeholder: input.placeholder,
          value: input.value
        });
      }
    });
    return inputs;
  });
  console.log('Boat-related inputs found:', boatInputs);

  // Keep open for inspection
  console.log('\nKeeping browser open for 20 seconds...');
  await page.waitForTimeout(20000);
});