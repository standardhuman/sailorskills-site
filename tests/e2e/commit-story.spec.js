// tests/e2e/commit-story.spec.js
import { test, expect } from '@playwright/test';

test.describe('Commit Story Page', () => {
  test('should load commit story page', async ({ page }) => {
    await page.goto('/story');

    // Check header
    await expect(page.locator('h1')).toContainText('Building SailorSkills');

    // Check subtitle
    await expect(page.locator('.subtitle')).toBeVisible();

    // Wait for data to load
    await page.waitForSelector('.category-section', { timeout: 10000 });
  });

  test('should display categorized features', async ({ page }) => {
    await page.goto('/story');

    // Wait for categories to load
    await page.waitForSelector('.category-section', { timeout: 10000 });

    // Check that at least one category is present
    const categories = page.locator('.category-section');
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should expand and collapse categories', async ({ page }) => {
    await page.goto('/story');

    // Wait for page load
    await page.waitForSelector('.category-section h2', { timeout: 10000 });

    // Find first category header and feature cards
    const firstCategory = page.locator('.category-section h2').first();
    const featureCards = page.locator('.feature-cards').first();

    // Verify initial state (should be visible by default)
    const initiallyVisible = await featureCards.isVisible();
    expect(initiallyVisible).toBe(true);

    // Click to collapse
    await firstCategory.click();
    const collapsedState = await featureCards.isVisible();
    expect(collapsedState).toBe(false);

    // Click to expand again
    await firstCategory.click();
    const expandedState = await featureCards.isVisible();
    expect(expandedState).toBe(true);
  });

  test('should display feature cards with metadata', async ({ page }) => {
    await page.goto('/story');

    // Wait for data
    await page.waitForSelector('.feature-card', { timeout: 10000 });

    const firstCard = page.locator('.feature-card').first();

    // Check business impact text
    await expect(firstCard.locator('.business-impact')).toBeVisible();

    // Check date badge
    await expect(firstCard.locator('.date-badge')).toBeVisible();

    // Check commit link
    await expect(firstCard.locator('.commit-link')).toBeVisible();
  });

  test('should have working GitHub commit links', async ({ page }) => {
    await page.goto('/story');

    // Wait for feature cards
    await page.waitForSelector('.commit-link', { timeout: 10000 });

    const commitLink = page.locator('.commit-link').first();

    // Check link href contains GitHub URL
    const href = await commitLink.getAttribute('href');
    expect(href).toContain('github.com');
    expect(href).toContain('commit');
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/story');

    // Check header is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check categories display properly
    await page.waitForSelector('.category-section', { timeout: 10000 });
    const sections = page.locator('.category-section');
    await expect(sections.first()).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/commit-story', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'API error' }),
      });
    });

    await page.goto('/story');

    // Should display error message
    await expect(page.locator('text=Error')).toBeVisible();
  });
});
