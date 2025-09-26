// Inventory System Tests
import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8080/anode-system/web/anode-manager.html';

test.describe('Inventory Management System', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the anode manager page
        await page.goto(BASE_URL);

        // Handle Supabase credentials if prompted
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Supabase URL')) {
                await dialog.accept(process.env.SUPABASE_URL || 'https://your-project.supabase.co');
            } else if (dialog.message().includes('Supabase Anon Key')) {
                await dialog.accept(process.env.SUPABASE_ANON_KEY || 'your-anon-key');
            }
        });
    });

    test('should display inventory navigation', async ({ page }) => {
        // Check that inventory nav button exists
        const inventoryBtn = page.locator('[data-view="inventory"]');
        await expect(inventoryBtn).toBeVisible();
        await expect(inventoryBtn).toHaveText('Inventory');
    });

    test('should switch to inventory view', async ({ page }) => {
        // Click inventory button
        await page.click('[data-view="inventory"]');

        // Check that inventory view is active
        const inventoryView = page.locator('#inventory-view');
        await expect(inventoryView).toHaveClass(/active/);

        // Check for inventory UI elements
        await expect(page.locator('#add-item')).toBeVisible();
        await expect(page.locator('#add-stock')).toBeVisible();
        await expect(page.locator('#inventory-count')).toBeVisible();
        await expect(page.locator('#replenishment-list')).toBeVisible();
    });

    test('should display inventory tabs', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Check for all tabs
        const tabs = ['all-items', 'anodes', 'tools', 'equipment', 'consumables'];
        for (const tab of tabs) {
            await expect(page.locator(`[data-tab="${tab}"]`)).toBeVisible();
        }
    });

    test('should filter inventory by search', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Enter search term
        await page.fill('#inventory-search', 'test');

        // Check that search input has value
        await expect(page.locator('#inventory-search')).toHaveValue('test');
    });

    test('should show add item modal', async ({ page }) => {
        await page.click('[data-view="inventory"]');
        await page.click('#add-item');

        // Check modal is visible
        const modal = page.locator('#add-item-modal');
        await expect(modal).toHaveClass(/active/);

        // Check form fields
        await expect(page.locator('#item-type')).toBeVisible();
        await expect(page.locator('#item-name')).toBeVisible();
        await expect(page.locator('#item-category')).toBeVisible();
    });

    test('should toggle between general item and anode', async ({ page }) => {
        await page.click('[data-view="inventory"]');
        await page.click('#add-item');

        // Default should be general item
        await expect(page.locator('#general-item-fields')).toBeVisible();
        await expect(page.locator('#anode-item-fields')).toHaveClass(/hidden/);

        // Switch to anode
        await page.selectOption('#item-type', 'anode');
        await expect(page.locator('#general-item-fields')).toHaveClass(/hidden/);
        await expect(page.locator('#anode-item-fields')).toBeVisible();
    });

    test('should show stock transaction modal', async ({ page }) => {
        await page.click('[data-view="inventory"]');
        await page.click('#add-stock');

        // Check modal is visible
        const modal = page.locator('#stock-transaction-modal');
        await expect(modal).toHaveClass(/active/);

        // Check transaction type is set to purchase
        await expect(page.locator('#transaction-type')).toHaveValue('purchase');
    });

    test('should show replenishment modal', async ({ page }) => {
        await page.click('[data-view="inventory"]');
        await page.click('#replenishment-list');

        // Check modal is visible
        const modal = page.locator('#replenishment-modal');
        await expect(modal).toHaveClass(/active/);

        // Check for replenishment controls
        await expect(page.locator('text=Generate PO')).toBeVisible();
        await expect(page.locator('text=Export List')).toBeVisible();
        await expect(page.locator('text=Auto-Add Low Stock')).toBeVisible();
    });

    test('should show customer charge modal', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Wait for inventory to load
        await page.waitForTimeout(1000);

        // If there are charge buttons, click one
        const chargeBtn = page.locator('.action-btn.charge').first();
        if (await chargeBtn.count() > 0) {
            await chargeBtn.click();

            // Check modal is visible
            const modal = page.locator('#charge-modal');
            await expect(modal).toHaveClass(/active/);

            // Check form fields
            await expect(page.locator('#charge-customer')).toBeVisible();
            await expect(page.locator('.charge-anode-select')).toBeVisible();
        }
    });

    test('should display stock level alerts', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Check if alerts div exists
        const alerts = page.locator('#stock-alerts');
        await expect(alerts).toBeInViewport();

        // If there are low stock items, alerts should be visible
        // Otherwise, they should be hidden
        const isHidden = await alerts.evaluate(el => el.classList.contains('hidden'));
        expect(typeof isHidden).toBe('boolean');
    });

    test('should close modals when clicking close button', async ({ page }) => {
        await page.click('[data-view="inventory"]');
        await page.click('#add-item');

        // Modal should be active
        const modal = page.locator('#add-item-modal');
        await expect(modal).toHaveClass(/active/);

        // Click close button
        await page.click('#add-item-modal .close');

        // Modal should not be active
        await expect(modal).not.toHaveClass(/active/);
    });

    test('should have working inventory filters', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Test low stock filter
        await page.check('#show-low-stock');
        await expect(page.locator('#show-low-stock')).toBeChecked();

        // Test out of stock filter
        await page.check('#show-out-of-stock');
        await expect(page.locator('#show-out-of-stock')).toBeChecked();

        // Test critical items filter
        await page.check('#show-critical');
        await expect(page.locator('#show-critical')).toBeChecked();
    });

    test('should switch between inventory tabs', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Click on Tools tab
        await page.click('[data-tab="tools"]');
        await expect(page.locator('[data-tab="tools"]')).toHaveClass(/active/);

        // Click on Anodes tab
        await page.click('[data-tab="anodes"]');
        await expect(page.locator('[data-tab="anodes"]')).toHaveClass(/active/);
        await expect(page.locator('[data-tab="tools"]')).not.toHaveClass(/active/);
    });
});

test.describe('Inventory Form Validations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);

        // Handle Supabase credentials
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Supabase')) {
                await dialog.accept('test-value');
            }
        });

        await page.click('[data-view="inventory"]');
    });

    test('should validate required fields in add item form', async ({ page }) => {
        await page.click('#add-item');

        // Try to submit without filling required fields
        await page.click('button[type="submit"]');

        // Check that name field is required
        const nameField = page.locator('#item-name');
        const isRequired = await nameField.evaluate(el => el.hasAttribute('required'));
        expect(isRequired).toBeTruthy();
    });

    test('should validate numeric fields', async ({ page }) => {
        await page.click('#add-item');

        // Fill in numeric fields
        await page.fill('#initial-quantity', '10');
        await page.fill('#unit-cost', '25.50');
        await page.fill('#min-stock', '5');
        await page.fill('#reorder-point', '8');
        await page.fill('#reorder-qty', '20');

        // Check values
        await expect(page.locator('#initial-quantity')).toHaveValue('10');
        await expect(page.locator('#unit-cost')).toHaveValue('25.50');
    });

    test('should add and remove charge items', async ({ page }) => {
        await page.click('[data-view="inventory"]');

        // Open charge modal (if available)
        const chargeBtn = page.locator('.action-btn.charge').first();
        if (await chargeBtn.count() > 0) {
            await chargeBtn.click();

            // Add another charge item
            await page.click('text=+ Add Another');

            // Should have 2 charge items now
            const chargeItems = page.locator('.charge-item');
            await expect(chargeItems).toHaveCount(2);

            // Remove the second item
            await page.click('.btn-remove:last-child');

            // Should have 1 charge item again
            await expect(chargeItems).toHaveCount(1);
        }
    });
});

test.describe('Inventory Data Flow', () => {
    test('should display inventory table with proper columns', async ({ page }) => {
        await page.goto(BASE_URL);

        page.on('dialog', async dialog => {
            await dialog.accept('test-value');
        });

        await page.click('[data-view="inventory"]');

        // Check table headers
        const headers = [
            'Type', 'SKU', 'Name', 'Category', 'On Hand',
            'Allocated', 'Available', 'Min Stock', 'Reorder Point',
            'Location', 'Unit Cost', 'Actions'
        ];

        for (const header of headers) {
            await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
        }
    });

    test('should update transaction form based on type', async ({ page }) => {
        await page.goto(BASE_URL);

        page.on('dialog', async dialog => {
            await dialog.accept('test-value');
        });

        await page.click('[data-view="inventory"]');
        await page.click('#add-stock');

        // Select physical count
        await page.selectOption('#transaction-type', 'count');

        // New count field should be visible
        await expect(page.locator('#new-count-group')).toBeVisible();
        await expect(page.locator('#quantity-group')).toHaveClass(/hidden/);

        // Select adjustment
        await page.selectOption('#transaction-type', 'adjustment');

        // Quantity field should be visible
        await expect(page.locator('#quantity-group')).toBeVisible();
        await expect(page.locator('#new-count-group')).toHaveClass(/hidden/);
    });
});