import { test } from '@playwright/test';

test('Check for console errors during page load', async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];

  // Capture all console messages
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Navigate to admin page
  await page.goto('http://localhost:3000/admin/admin.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
    if (msg.location.url) {
      console.log(`  at ${msg.location.url}:${msg.location.lineNumber}`);
    }
  });

  console.log('\n=== Page Errors ===');
  pageErrors.forEach(err => {
    console.log(err.message);
    if (err.stack) {
      console.log(err.stack);
    }
  });

  // Try to execute the module code directly
  const manualExecution = await page.evaluate(() => {
    // Try executing the window assignments directly
    try {
      // This is what admin-wizard.js should be doing
      window.renderConsolidatedForm = function(isCleaningService, serviceKey) {
        console.log('Manual renderConsolidatedForm called:', serviceKey);
        const wizardContainer = document.getElementById('wizardContainer');
        const wizardContent = document.getElementById('wizardContent');
        if (wizardContainer && wizardContent) {
          wizardContainer.style.display = 'block';
          wizardContent.innerHTML = '<h3>Manual test - wizard loaded for ' + serviceKey + '</h3>';
          return true;
        }
        return false;
      };

      window.selectServiceDirect = function(serviceKey) {
        console.log('Manual selectServiceDirect called:', serviceKey);
        if (window.renderConsolidatedForm) {
          const isCleaningService = serviceKey === 'recurring_cleaning' || serviceKey === 'onetime_cleaning';
          window.renderConsolidatedForm(isCleaningService, serviceKey);
        }
      };

      return {
        success: true,
        functionsNowExist: {
          renderConsolidatedForm: typeof window.renderConsolidatedForm,
          selectServiceDirect: typeof window.selectServiceDirect
        }
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('\n=== Manual Execution Result ===');
  console.log(manualExecution);

  // Now try clicking a button
  if (manualExecution.success) {
    console.log('\n=== Testing button with manually loaded functions ===');
    await page.click('button:has-text("Recurring Cleaning")');
    await page.waitForTimeout(1000);

    const wizardState = await page.evaluate(() => {
      const wizard = document.getElementById('wizardContainer');
      const content = document.getElementById('wizardContent');
      return {
        display: wizard ? getComputedStyle(wizard).display : 'not found',
        content: content ? content.innerHTML : 'no content'
      };
    });
    console.log('Wizard state after click:', wizardState);
  }
});