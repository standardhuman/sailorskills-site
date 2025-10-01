import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testInventorySystem() {
    console.log('\n🔍 INVENTORY SYSTEM REVIEW\n');
    console.log('=' .repeat(60));

    // 1. Test Supabase Connection
    console.log('\n📊 1. DATABASE SCHEMA CHECK');
    console.log('-'.repeat(60));

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const tables = [
        'anodes_catalog',
        'anode_inventory',
        'inventory_items',
        'item_categories',
        'inventory_suppliers',
        'inventory_transactions',
        'replenishment_list',
        'purchase_orders'
    ];

    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`  ❌ ${table.padEnd(30)} - ERROR: ${error.message}`);
            } else {
                console.log(`  ✅ ${table.padEnd(30)} - ${count || 0} records`);
            }
        } catch (err) {
            console.log(`  ❌ ${table.padEnd(30)} - ERROR: ${err.message}`);
        }
    }

    // 2. Test Page Loading
    console.log('\n\n🌐 2. INVENTORY PAGE TEST');
    console.log('-'.repeat(60));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });

    try {
        const page = await browser.newPage();

        // Navigate to inventory page
        console.log('  🔗 Loading http://localhost:3000/inventory/inventory.html');
        await page.goto('http://localhost:3000/inventory/inventory.html', {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Wait a bit for page to load
        await page.waitForTimeout(2000);

        // Check page title
        const title = await page.title();
        console.log(`  📄 Page Title: ${title}`);

        // Check for main elements
        console.log('\n  🔍 Checking UI Elements:');

        const checks = [
            { selector: 'h1', name: 'Main Header', required: true },
            { selector: '.nav-btn[data-view="catalog"]', name: 'Catalog View Button', required: true },
            { selector: '.nav-btn[data-view="inventory"]', name: 'Inventory View Button', required: true },
            { selector: '#catalog-view', name: 'Catalog View', required: true },
            { selector: '#inventory-view', name: 'Inventory View', required: true },
            { selector: '#catalog-grid', name: 'Catalog Grid', required: true },
            { selector: '#inventory-table', name: 'Inventory Table', required: true },
            { selector: '#add-item', name: 'Add Item Button', required: false },
            { selector: '#add-stock', name: 'Add Stock Button', required: false },
            { selector: '.modal', name: 'Modal Dialogs', required: false }
        ];

        for (const check of checks) {
            const count = await page.locator(check.selector).count();
            const status = count > 0 ? '✅' : (check.required ? '❌' : '⚠️ ');
            console.log(`    ${status} ${check.name.padEnd(30)} - ${count} found`);
        }

        // Check for JavaScript errors
        console.log('\n  🐛 Checking for Console Errors:');
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Click on Inventory tab
        console.log('\n  🖱️  Clicking Inventory View Tab...');
        try {
            await page.click('[data-view="inventory"]');
            await page.waitForTimeout(1000);

            const inventoryViewVisible = await page.locator('#inventory-view.active').isVisible();
            console.log(`    ${inventoryViewVisible ? '✅' : '❌'} Inventory view ${inventoryViewVisible ? 'activated' : 'failed to activate'}`);
        } catch (err) {
            console.log(`    ❌ Error clicking inventory tab: ${err.message}`);
        }

        // Check console errors
        if (errors.length > 0) {
            console.log(`\n    Found ${errors.length} console errors:`);
            errors.slice(0, 5).forEach(err => {
                console.log(`      - ${err.substring(0, 100)}`);
            });
        } else {
            console.log(`    ✅ No console errors detected`);
        }

        // Take screenshot
        await page.screenshot({
            path: 'docs/test-screenshots/inventory-review.png',
            fullPage: true
        });
        console.log('\n  📸 Screenshot saved: docs/test-screenshots/inventory-review.png');

        // Keep browser open for observation
        console.log('\n  ⏰ Browser will close in 5 seconds...');
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('\n  ❌ Error during page test:', error.message);
    } finally {
        await browser.close();
    }

    // 3. Summary and Recommendations
    console.log('\n\n📋 3. SUMMARY & NEXT STEPS');
    console.log('-'.repeat(60));
    console.log(`
  Based on this review:

  ✅ Tested:
    - Database connectivity
    - Table existence and record counts
    - Page loading
    - UI element visibility
    - Navigation functionality

  📌 Next Steps:
    1. Verify all database tables have proper data
    2. Test adding new inventory items
    3. Test stock transactions
    4. Test customer charging
    5. Test replenishment list generation
    6. Verify all modals work correctly
    7. Test filtering and search functionality

  🔧 Potential Issues to Address:
    - Multiple file versions (consolidate)
    - JavaScript manager architecture
    - Environment variable usage
    - API endpoint integration
    `);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Review Complete!\n');
}

testInventorySystem().catch(console.error);
