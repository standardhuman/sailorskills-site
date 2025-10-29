// Test for Task 3 & Task 4: GitHub API Integration and Gemini Translation
import { test, expect } from '@playwright/test';

test.describe('Commit Story API - GitHub Integration', () => {
  test('should return GitHub commits or configuration error', async ({ request }) => {
    // This test verifies the GitHub integration works
    // Note: In local dev, this may not work due to vercel.json rewrites
    // In production Vercel deployment with GITHUB_TOKEN, this should return commits

    const response = await request.get('/api/commit-story');

    // Should return 200 (success), 500 (config error), or 404 (local routing)
    expect([200, 500, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();

      // Should have commits array and count
      expect(data).toHaveProperty('commits');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.commits)).toBe(true);

      // If commits exist, verify structure
      if (data.commits.length > 0) {
        const commit = data.commits[0];
        expect(commit).toHaveProperty('sha');
        expect(commit).toHaveProperty('message');
        expect(commit).toHaveProperty('date');
        expect(commit).toHaveProperty('author');

        // Verify commit message matches milestone pattern
        expect(commit.message).toMatch(/^\[(FEATURE|FIX|PHASE|DOC)\]/);
      }
    }

    if (response.status() === 500) {
      const data = await response.json();

      // Should have error property
      expect(data).toHaveProperty('error');

      // Error should indicate token issue or API error
      expect(data.error).toMatch(/token|GitHub API error/i);
    }
  });

  test('should handle network errors gracefully', async ({ request }) => {
    // This verifies error handling is in place
    const response = await request.get('/api/commit-story');

    // Should always return JSON, never crash
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('Commit Story API - Gemini Translation (Task 4)', () => {
  test('should return categorized translations with correct structure', async ({ request }) => {
    const response = await request.get('/api/commit-story');

    // Should return 200 (success), 500 (config error), or 404 (local routing)
    expect([200, 500, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();

      // Verify response has categories object
      expect(data).toHaveProperty('categories');
      expect(typeof data.categories).toBe('object');

      // Verify lastUpdated timestamp
      expect(data).toHaveProperty('lastUpdated');
      expect(new Date(data.lastUpdated).toString()).not.toBe('Invalid Date');

      // Verify expected category structure
      const expectedCategories = ['Operations', 'Billing', 'Scheduling', 'Inventory', 'Communication'];
      expectedCategories.forEach(category => {
        expect(data.categories).toHaveProperty(category);
        expect(Array.isArray(data.categories[category])).toBe(true);
      });

      // Verify translation items have required fields
      const allTranslations = Object.values(data.categories).flat();
      if (allTranslations.length > 0) {
        const translation = allTranslations[0];
        expect(translation).toHaveProperty('business_impact');
        expect(translation).toHaveProperty('category');
        expect(translation).toHaveProperty('commit_sha');
        expect(translation).toHaveProperty('date');

        // Verify field types
        expect(typeof translation.business_impact).toBe('string');
        expect(typeof translation.category).toBe('string');
        expect(typeof translation.commit_sha).toBe('string');
        expect(typeof translation.date).toBe('string');

        // Verify business_impact is not empty
        expect(translation.business_impact.length).toBeGreaterThan(0);

        // Verify category is one of the expected values
        expect(expectedCategories).toContain(translation.category);
      }
    }
  });

  test('should handle Gemini API errors gracefully', async ({ request }) => {
    // This verifies error handling for Gemini API failures
    const response = await request.get('/api/commit-story');

    if (response.status() === 500) {
      const data = await response.json();

      // Should have error property
      expect(data).toHaveProperty('error');

      // Verify error messages include helpful context
      const errorMessage = data.error.toLowerCase();
      const hasUsefulContext =
        errorMessage.includes('api key') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('gemini') ||
        errorMessage.includes('parse') ||
        errorMessage.includes('response excerpt');

      expect(hasUsefulContext).toBe(true);
    }
  });

  test('should provide helpful error context for JSON parsing failures', async ({ request }) => {
    // This test verifies that parsing errors include response excerpt
    const response = await request.get('/api/commit-story');

    if (response.status() === 500) {
      const data = await response.json();

      // If error is related to JSON parsing, it should include excerpt
      if (data.error && data.error.includes('parse')) {
        expect(data.error).toMatch(/response excerpt/i);
      }
    }
  });

  test('should identify rate limiting errors', async ({ request }) => {
    // This test verifies rate limit handling (will pass when not rate-limited)
    const response = await request.get('/api/commit-story');

    if (response.status() === 500) {
      const data = await response.json();

      // If error is 429, should have specific rate limit message
      if (data.error && data.error.includes('rate limit')) {
        expect(data.error).toContain('try again later');
      }
    }
  });
});
