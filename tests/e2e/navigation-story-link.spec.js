// tests/e2e/navigation-story-link.spec.js
import { test, expect } from '@playwright/test';

test.describe('Navigation - Story Link', () => {
  test('should have "OUR STORY" link in navigation', async ({ page }) => {
    await page.goto('/');

    // Check that "OUR STORY" link exists in navigation
    const storyLink = page.locator('nav a:has-text("OUR STORY")');
    await expect(storyLink).toBeVisible();
  });

  test('should navigate to story page when clicking "OUR STORY" link', async ({ page }) => {
    await page.goto('/');

    // Click on "OUR STORY" link
    await page.click('nav a:has-text("OUR STORY")');

    // Wait for navigation
    await page.waitForURL('**/story');

    // Verify we're on the story page
    expect(page.url()).toContain('/story');

    // Verify story page content is loaded
    await expect(page.locator('h1')).toContainText('Building SailorSkills');
  });

  test('should show active navigation state on story page', async ({ page }) => {
    await page.goto('/story');

    // Verify we're on the story page
    await expect(page.locator('h1')).toContainText('Building SailorSkills');

    // Verify "OUR STORY" link is still visible in nav
    const storyLink = page.locator('nav a:has-text("OUR STORY")');
    await expect(storyLink).toBeVisible();
  });
});
