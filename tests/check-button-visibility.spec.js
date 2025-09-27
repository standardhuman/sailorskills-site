import { test, expect } from '@playwright/test';

test('Check service button visibility', async ({ page }) => {
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(3000); // Give time to load

  // Check for service-option buttons
  const serviceOptions = page.locator('.service-option');
  const count = await serviceOptions.count();
  console.log(`Found ${count} .service-option elements`);

  for (let i = 0; i < count; i++) {
    const button = serviceOptions.nth(i);
    const isVisible = await button.isVisible();
    const text = await button.textContent();
    const boundingBox = await button.boundingBox();
    const computedStyle = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        position: styles.position,
        width: styles.width,
        height: styles.height,
        zIndex: styles.zIndex
      };
    });

    console.log(`Button ${i}: "${text}"`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  BoundingBox:`, boundingBox);
    console.log(`  Styles:`, computedStyle);
  }

  // Check for simple-service-btn buttons
  const simpleButtons = page.locator('.simple-service-btn');
  const simpleCount = await simpleButtons.count();
  console.log(`\nFound ${simpleCount} .simple-service-btn elements`);

  for (let i = 0; i < simpleCount; i++) {
    const button = simpleButtons.nth(i);
    const isVisible = await button.isVisible();
    const text = await button.textContent();
    console.log(`Simple Button ${i}: "${text}" - Visible: ${isVisible}`);
  }

  // Check parent containers
  const serviceContainer = page.locator('#serviceButtons, .service-buttons, #simpleServiceButtons');
  const containerCount = await serviceContainer.count();
  console.log(`\nFound ${containerCount} service button containers`);

  for (let i = 0; i < containerCount; i++) {
    const container = serviceContainer.nth(i);
    const isVisible = await container.isVisible();
    const id = await container.getAttribute('id');
    const className = await container.getAttribute('class');
    const computedStyle = await container.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        height: styles.height
      };
    });
    console.log(`Container ${i}: id="${id}" class="${className}"`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Styles:`, computedStyle);
  }

  // Take screenshot
  await page.screenshot({ path: 'tests/button-visibility-check.png', fullPage: true });
  console.log('\nScreenshot saved to tests/button-visibility-check.png');
});