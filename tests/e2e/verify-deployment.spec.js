import { test, expect } from '@playwright/test';

// Test against the actual Vercel deployment
const DEPLOYMENT_URL = 'https://sailorskills-site-5wc2328kg-sailorskills.vercel.app';

test.describe('Verify Deployment Works', () => {
  test('should load /story page on deployment', async ({ page }) => {
    await page.goto(`${DEPLOYMENT_URL}/story`);

    // Wait for React app to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Check if page loaded (not 404)
    const title = await page.title();
    expect(title).toContain('Sailor Skills');

    // Take screenshot
    await page.screenshot({ path: 'test-results/deployment-story-page.png' });

    console.log('Page loaded successfully on deployment');
  });

  test('should have API endpoint responding', async ({ request }) => {
    const response = await request.get(`${DEPLOYMENT_URL}/api/commit-story`);

    // Should get a response (even if it's an error)
    expect(response.status()).toBeLessThan(500);

    const contentType = response.headers()['content-type'];
    console.log(`API Content-Type: ${contentType}`);
    console.log(`API Status: ${response.status()}`);

    // If 200, should be JSON
    if (response.status() === 200) {
      expect(contentType).toContain('application/json');
      const data = await response.json();
      console.log('API returned:', Object.keys(data));
    }
  });
});
