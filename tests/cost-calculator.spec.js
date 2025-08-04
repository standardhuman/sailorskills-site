// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Cost Calculator Tests', () => {
  const calculatorURL = `file://${path.resolve(__dirname, '../index.html')}`;

  test.beforeEach(async ({ page }) => {
    await page.goto(calculatorURL);
    // Wait for the page to be ready and dropdown to be populated
    await page.waitForFunction(() => {
      const dropdown = document.querySelector('#serviceDropdown');
      return dropdown && dropdown.options && dropdown.options.length > 1;
    }, { timeout: 10000 });
  });

  test('1. Initial page load and screenshot', async ({ page }) => {
    // Wait for initial content to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Take screenshot of initial view
    await page.screenshot({ 
      path: 'screenshots/01-initial-view.png',
      fullPage: true 
    });

    // Verify initial elements are present
    await expect(page.locator('h1')).toContainText('Sailor Skills Diving Cost Estimator');
    await expect(page.locator('#serviceDropdown')).toBeVisible();
    
    // Verify service dropdown is populated
    const options = await page.locator('#serviceDropdown option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('2. Calculator flow - Recurring Cleaning & Anodes', async ({ page }) => {
    // Step 1: Select service type - "Recurring Cleaning & Anodes"
    await page.selectOption('#serviceDropdown', { label: 'Recurring Cleaning & Anodes' });
    await page.screenshot({ path: 'screenshots/02-service-selected.png' });
    
    // Click Next to move to boat length
    await page.click('#nextButton');
    await page.waitForSelector('#step-1:not([style*="display: none"])');

    // Step 2: Enter boat length
    await page.fill('#boatLength', '35');
    await page.screenshot({ path: 'screenshots/03-boat-length-entered.png' });
    
    // Click Next to move to boat type
    await page.click('#nextButton');
    await page.waitForSelector('#step-2:not([style*="display: none"])');

    // Step 3: Select boat type - Sailboat (already selected by default)
    await page.check('#boat_type_sailboat');
    await page.screenshot({ path: 'screenshots/04-sailboat-selected.png' });
    
    // Click Next to move to hull type
    await page.click('#nextButton');
    await page.waitForSelector('#step-3:not([style*="display: none"])');

    // Step 4: Select hull type - Monohull (already selected by default)
    await page.check('#hull_monohull');
    await page.screenshot({ path: 'screenshots/05-monohull-selected.png' });
    
    // Click Next to move to engine configuration
    await page.click('#nextButton');
    await page.waitForSelector('#step-4:not([style*="display: none"])');

    // Step 5: Select no twin engines (leave unchecked)
    await page.screenshot({ path: 'screenshots/06-single-engine-selected.png' });
    
    // Click Next to move to paint age
    await page.click('#nextButton');
    await page.waitForSelector('#step-5:not([style*="display: none"])');

    // Step 6: Select paint age - 7-12 months
    await page.selectOption('#lastPaintedTime', '7-12_months');
    await page.screenshot({ path: 'screenshots/07-paint-age-selected.png' });
    
    // Click Next to move to last cleaned
    await page.click('#nextButton');
    await page.waitForSelector('#step-6:not([style*="display: none"])');

    // Step 7: Select last cleaned - 3-4 months
    await page.selectOption('#lastCleanedTime', '3-4_months');
    await page.screenshot({ path: 'screenshots/08-last-cleaned-selected.png' });
    
    // Click Next to move to anodes
    await page.click('#nextButton');
    await page.waitForSelector('#step-7:not([style*="display: none"])');

    // Step 8: Enter anodes count
    await page.fill('#anodesToInstall', '2');
    await page.screenshot({ path: 'screenshots/09-anodes-entered.png' });

    // Step 9: View estimate
    await page.click('#nextButton');
    
    // Wait for results to appear
    await page.waitForSelector('#step-8:not([style*="display: none"])');
    await page.screenshot({ path: 'screenshots/10-estimate-displayed.png', fullPage: true });

    // Verify estimate is displayed
    const estimateText = await page.locator('#totalCostDisplay').textContent();
    expect(estimateText).toContain('$');
    console.log('Estimated cost:', estimateText);
  });

  test('3. Checkout flow', async ({ page }) => {
    // First, go through the calculator flow quickly
    await page.selectOption('#serviceDropdown', { label: 'Recurring Cleaning & Anodes' });
    await page.click('#nextButton');
    
    await page.fill('#boatLength', '35');
    await page.click('#nextButton');
    
    await page.check('#boat_type_sailboat');
    await page.click('#nextButton');
    
    await page.check('#hull_monohull');
    await page.click('#nextButton');
    
    // Leave twin engines unchecked
    await page.click('#nextButton');
    
    await page.selectOption('#lastPaintedTime', '7-12_months');
    await page.click('#nextButton');
    
    await page.selectOption('#lastCleanedTime', '3-4_months');
    await page.click('#nextButton');
    
    await page.fill('#anodesToInstall', '2');
    await page.click('#nextButton');
    
    // Wait for results
    await page.waitForSelector('#step-8:not([style*="display: none"])');
    
    // Look for the dynamically created checkout button
    await page.waitForSelector('#checkout-button', { timeout: 5000 });
    await page.click('#checkout-button');
    
    // Wait for checkout section to be visible
    await page.waitForSelector('#checkout-section:not([style*="display: none"])');
    await page.screenshot({ path: 'screenshots/11-checkout-form.png', fullPage: true });

    // Fill in boat information
    await page.fill('#boat-name', 'Sea Breeze');
    await page.fill('#boat-make', 'Catalina');
    await page.fill('#boat-model', '350');

    // Fill in marina information
    await page.fill('#marina-name', 'Harbor Bay Marina');
    await page.fill('#dock', 'A');
    await page.fill('#slip-number', '42');

    // Take screenshot with filled form
    await page.screenshot({ path: 'screenshots/12-checkout-form-filled.png', fullPage: true });

    // Select 2-month service interval (click on the interval option div)
    await page.click('.interval-option[data-interval="2"]');
    
    // Take screenshot showing selected interval
    await page.screenshot({ path: 'screenshots/13-service-interval-selected.png', fullPage: true });

    // Verify the interval is selected
    const selectedInterval = await page.locator('.interval-option.selected[data-interval="2"]');
    await expect(selectedInterval).toBeVisible();
  });

  test('4. Responsive design - Mobile view', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Take screenshot of mobile view - initial
    await page.screenshot({ path: 'screenshots/14-mobile-initial.png', fullPage: true });

    // Go through calculator flow on mobile
    await page.selectOption('#serviceDropdown', { label: 'Recurring Cleaning & Anodes' });
    await page.click('#nextButton');
    
    await page.fill('#boatLength', '35');
    await page.click('#nextButton');
    
    await page.check('#boat_type_sailboat');
    await page.click('#nextButton');
    
    await page.check('#hull_monohull');
    
    // Take screenshot of mobile view - mid-flow
    await page.screenshot({ path: 'screenshots/15-mobile-mid-flow.png', fullPage: true });

    // Continue flow
    await page.click('#nextButton');
    
    // Leave twin engines unchecked
    await page.click('#nextButton');
    
    await page.selectOption('#lastPaintedTime', '7-12_months');
    await page.click('#nextButton');
    
    await page.selectOption('#lastCleanedTime', '3-4_months');
    await page.click('#nextButton');
    
    await page.fill('#anodesToInstall', '2');
    await page.click('#nextButton');
    
    // Wait for results
    await page.waitForSelector('#step-8:not([style*="display: none"])');
    
    // Take screenshot of mobile view - results
    await page.screenshot({ path: 'screenshots/16-mobile-results.png', fullPage: true });
  });

  test('5. Navigation header links', async ({ page }) => {
    // Get all navigation links
    const navLinks = await page.locator('nav a').all();
    
    console.log(`Found ${navLinks.length} navigation links`);
    
    const linkData = [];
    
    for (const link of navLinks) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      linkData.push({ text: text.trim(), href });
      
      console.log(`Link: "${text.trim()}" -> ${href}`);
    }

    // Verify expected links - updated to match actual site
    const expectedLinks = [
      { text: 'HOME', href: 'https://www.sailorskills.com/' },
      { text: 'TRAINING', href: 'https://www.sailorskills.com/training' },
      { text: 'DIVING', href: 'https://www.sailorskills.com/diving' },
      { text: 'DETAILING', href: 'https://www.sailorskills.com/detailing' },
      { text: 'DELIVERIES', href: 'https://www.sailorskills.com/deliveries' }
    ];

    // Check if all expected links are present
    for (const expected of expectedLinks) {
      const found = linkData.find(link => link.text === expected.text);
      expect(found).toBeTruthy();
      if (found) {
        expect(found.href).toBe(expected.href);
      }
    }

    // Verify the DIVING link is marked as active
    const activeLink = await page.locator('nav a.active');
    await expect(activeLink).toHaveText('DIVING');

    // Take screenshot of navigation
    await page.screenshot({ path: 'screenshots/17-navigation-links.png' });
  });

  test('Additional validation tests', async ({ page }) => {
    // Test form validation
    await page.selectOption('#serviceDropdown', { label: 'Recurring Cleaning & Anodes' });
    await page.click('#nextButton');
    
    // Test empty boat length
    await page.fill('#boatLength', '');
    await page.click('#nextButton');
    
    // Should still be on step 1 due to validation
    const step1Visible = await page.locator('#step-1').isVisible();
    expect(step1Visible).toBeTruthy();
    
    // Check if error message appears
    const errorVisible = await page.locator('#boatLengthError').isVisible();
    
    // Test invalid boat length
    await page.fill('#boatLength', '-10');
    await page.screenshot({ path: 'screenshots/18-validation-negative-length.png' });
    
    // Test boundary values
    await page.fill('#boatLength', '0');
    await page.click('#nextButton');
    const stillOnStep1 = await page.locator('#step-1').isVisible();
    expect(stillOnStep1).toBeTruthy();
    
    await page.fill('#boatLength', '200');
    await page.screenshot({ path: 'screenshots/19-validation-large-length.png' });
    
    // Test decimal values
    await page.fill('#boatLength', '35.5');
    await page.click('#nextButton');
    const movedFromStep1 = await page.locator('#step-2').isVisible();
    expect(movedFromStep1).toBeTruthy();
    
    console.log('Form validation tested');
  });
});

// Create screenshots directory before running tests
test.beforeAll(async () => {
  const screenshotsDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
});