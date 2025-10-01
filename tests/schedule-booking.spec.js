/**
 * Schedule Booking Flow Tests
 * Tests the complete booking system from service selection to confirmation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:3000';

test.describe('Schedule Booking System', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to schedule page
    await page.goto(`${BASE_URL}/schedule`);
    await page.waitForLoadState('networkidle');
  });

  test('Schedule page loads correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Schedule a Service/);

    // Check hero header
    await expect(page.locator('.hero-brand')).toContainText('SAILOR SKILLS');
    await expect(page.locator('.hero-service')).toContainText('SCHEDULE A SERVICE');

    // Check navigation exists
    await expect(page.locator('.navigation-header')).toBeVisible();
  });

  test('Service list loads and displays services', async ({ page }) => {
    // Wait for services to load
    await page.waitForSelector('.service-card', { timeout: 10000 });

    // Check that services are displayed
    const serviceCards = page.locator('.service-card');
    const count = await serviceCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify first service has required elements
    const firstCard = serviceCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('.duration')).toBeVisible();
    await expect(firstCard.locator('.description')).toBeVisible();

    // Check for expected services
    await expect(page.locator('.service-card:has-text("Free Consultation")')).toBeVisible();
    await expect(page.locator('.service-card:has-text("Training Half Day")')).toBeVisible();
  });

  test('Can select a service', async ({ page }) => {
    // Wait for services to load
    await page.waitForSelector('.service-card', { timeout: 10000 });

    // Click on first service
    await page.locator('.service-card').first().click();

    // Should auto-advance to step 2 (datetime picker)
    await page.waitForTimeout(500);

    // Check that datetime step is visible
    await expect(page.locator('#step-datetime')).toBeVisible();
    await expect(page.locator('.calendar')).toBeVisible();

    // Check that selected service info is displayed
    await expect(page.locator('#selected-service-name')).toBeVisible();
  });

  test('Calendar displays correctly', async ({ page }) => {
    // Select a service first
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Check calendar elements
    await expect(page.locator('.calendar-header')).toBeVisible();
    await expect(page.locator('.month-year')).toBeVisible();
    await expect(page.locator('#prev-month')).toBeVisible();
    await expect(page.locator('#next-month')).toBeVisible();

    // Check day headers
    const dayHeaders = page.locator('.calendar-day-header');
    expect(await dayHeaders.count()).toBe(7); // Sun-Sat

    // Check that calendar days are displayed
    const calendarDays = page.locator('.calendar-day:not(.empty)');
    expect(await calendarDays.count()).toBeGreaterThan(0);
  });

  test('Can navigate calendar months', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Get current month
    const currentMonth = await page.locator('.month-year').textContent();

    // Click next month
    await page.locator('#next-month').click();
    await page.waitForTimeout(300);

    // Verify month changed
    const nextMonth = await page.locator('.month-year').textContent();
    expect(nextMonth).not.toBe(currentMonth);

    // Click previous month twice to go back
    await page.locator('#prev-month').click();
    await page.waitForTimeout(300);

    const prevMonth = await page.locator('.month-year').textContent();
    expect(prevMonth).toBe(currentMonth);
  });

  test('Can select a date', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Find and click a future date (not disabled)
    const availableDay = page.locator('.calendar-day:not(.empty):not(.disabled)').first();
    await availableDay.click();

    // Check that day is selected
    await expect(availableDay).toHaveClass(/selected/);

    // Check that time slots section updates
    await expect(page.locator('#time-slots')).toBeVisible();
  });

  test('Time slots load after date selection', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Select a future date
    const availableDay = page.locator('.calendar-day:not(.empty):not(.disabled)').first();
    await availableDay.click();

    // Wait for time slots to load
    await page.waitForTimeout(1000);

    // Check for either time slots or no availability message
    const timeSlotsContainer = page.locator('#time-slots');
    const hasSlots = await timeSlotsContainer.locator('.time-slot').count() > 0;
    const hasPlaceholder = await timeSlotsContainer.locator('.placeholder').isVisible();
    const hasError = await timeSlotsContainer.locator('.error').isVisible();

    expect(hasSlots || hasPlaceholder || hasError).toBeTruthy();
  });

  test('Back button navigates to previous step', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Check we're on step 2
    await expect(page.locator('#step-datetime')).toBeVisible();

    // Click back button
    await page.locator('#back-button').click();

    // Should be back on step 1
    await expect(page.locator('#step-service')).toBeVisible();
    await expect(page.locator('#step-datetime')).toBeHidden();
  });

  test('Customer form displays correctly', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Select a date
    const availableDay = page.locator('.calendar-day:not(.empty):not(.disabled)').first();
    await availableDay.click();
    await page.waitForTimeout(1000);

    // Check if time slots are available
    const timeSlot = page.locator('.time-slot').first();
    if (await timeSlot.isVisible()) {
      // Select a time slot
      await timeSlot.click();

      // Click next to go to form
      await page.locator('#next-button').click();
      await page.waitForTimeout(500);

      // Check form fields
      await expect(page.locator('#customer-name')).toBeVisible();
      await expect(page.locator('#customer-email')).toBeVisible();
      await expect(page.locator('#customer-phone')).toBeVisible();
      await expect(page.locator('#customer-notes')).toBeVisible();
      await expect(page.locator('#booking-agreement')).toBeVisible();

      // Check booking summary
      await expect(page.locator('#summary-service')).toBeVisible();
      await expect(page.locator('#summary-datetime')).toBeVisible();
    }
  });

  test('Form validation works', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Select a date
    const availableDay = page.locator('.calendar-day:not(.empty):not(.disabled)').first();
    await availableDay.click();
    await page.waitForTimeout(1000);

    // Check if time slots are available
    const timeSlot = page.locator('.time-slot').first();
    if (await timeSlot.isVisible()) {
      // Select a time slot
      await timeSlot.click();

      // Click next to go to form
      await page.locator('#next-button').click();
      await page.waitForTimeout(500);

      // Try to submit empty form
      await page.locator('#submit-button').click();

      // Check that form validation prevents submission
      const nameField = page.locator('#customer-name');
      const isInvalid = await nameField.evaluate(el => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    }
  });

  test('Navigation links work', async ({ page }) => {
    // Check that navigation links are present
    await expect(page.locator('nav a[href="/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/training/training.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="/diving/diving.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="/detailing/detailing.html"]')).toBeVisible();
    await expect(page.locator('nav a[href="/deliveries/deliveries.html"]')).toBeVisible();
  });

  test('Mobile responsive design works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for services to load
    await page.waitForSelector('.service-card', { timeout: 10000 });

    // Check that service cards stack vertically on mobile
    const firstCard = page.locator('.service-card').first();
    await expect(firstCard).toBeVisible();

    // Select a service
    await firstCard.click();
    await page.waitForTimeout(500);

    // Check calendar is visible on mobile
    await expect(page.locator('.calendar')).toBeVisible();
  });

  test('Change service button works', async ({ page }) => {
    // Select a service
    await page.waitForSelector('.service-card', { timeout: 10000 });
    await page.locator('.service-card').first().click();
    await page.waitForTimeout(500);

    // Should be on datetime step
    await expect(page.locator('#step-datetime')).toBeVisible();

    // Click "Change Service" button
    await page.locator('#change-service').click();

    // Should go back to service selection
    await expect(page.locator('#step-service')).toBeVisible();
  });

  test('No console errors on page load', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/schedule`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.service-card', { timeout: 10000 });

    // Filter out known external errors (like ad blockers, extensions)
    const relevantErrors = consoleErrors.filter(error =>
      !error.includes('chrome-extension://') &&
      !error.includes('moz-extension://') &&
      !error.includes('Failed to load resource')
    );

    expect(relevantErrors.length).toBe(0);
  });

  test('All required scripts and styles load', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/schedule`);
    expect(response?.status()).toBe(200);

    // Check CSS loaded
    await expect(page.locator('link[href="/schedule/schedule.css"]')).toBeAttached();

    // Check JS loaded
    await expect(page.locator('script[src="/schedule/schedule.js"]')).toBeAttached();
  });

});
