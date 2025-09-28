import { test, expect } from '@playwright/test';

test('Check network requests and script loading', async ({ page }) => {
  const requests = [];
  const responses = [];

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('.js')) {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('.js')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  // Navigate to admin page
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== JavaScript Requests ===');
  requests.forEach(req => {
    console.log(`${req.method} ${req.url}`);
  });

  console.log('\n=== JavaScript Responses ===');
  responses.forEach(resp => {
    console.log(`${resp.status} ${resp.statusText} - ${resp.url}`);
  });

  // Check if modules actually executed
  const moduleState = await page.evaluate(() => {
    // Try to check if imports worked
    return {
      // Check window object
      windowKeys: Object.keys(window).filter(key =>
        key.includes('admin') ||
        key.includes('render') ||
        key.includes('select') ||
        key.includes('wizard')
      ),
      // Check if modules are in memory
      hasAdminApp: 'adminApp' in window,
      hasRenderConsolidatedForm: 'renderConsolidatedForm' in window,
      hasSelectServiceDirect: 'selectServiceDirect' in window
    };
  });

  console.log('\n=== Module State ===');
  console.log(moduleState);

  // Try to manually execute the module code
  console.log('\n=== Trying to manually load admin-wizard.js ===');
  const wizardLoaded = await page.evaluate(async () => {
    try {
      const response = await fetch('/admin/admin-wizard.js');
      const text = await response.text();
      console.log('Fetched wizard script, length:', text.length);

      // Check if it's assigning to window
      const hasWindowAssignments = text.includes('window.renderConsolidatedForm');
      return {
        scriptLength: text.length,
        hasWindowAssignments,
        firstLines: text.substring(0, 200)
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log(wizardLoaded);
});