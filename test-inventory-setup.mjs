#!/usr/bin/env node
// Test script to verify inventory database setup

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzygakldvvzxmahkdylq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInventorySetup() {
    console.log('🔍 Testing Inventory Database Setup...\n');

    const tables = [
        'anodes_catalog',
        'anode_inventory',
        'inventory_items',
        'item_categories',
        'inventory_suppliers',
        'inventory_transactions',
        'purchase_orders',
        'purchase_order_items',
        'replenishment_list',
        'boats',
        'boat_anode_types',
        'anode_tool_requirements'
    ];

    let successCount = 0;
    let failCount = 0;

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .limit(1);

            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                failCount++;
            } else {
                console.log(`✅ ${table}: Table exists and is accessible`);
                successCount++;
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Results: ${successCount}/${tables.length} tables verified`);

    if (failCount === 0) {
        console.log('✅ All tables are properly set up!');
        console.log('\n🎉 Your inventory system is ready to use!');
        console.log('📍 Visit: https://cost-calculator-sigma.vercel.app/anode-manager.html');
    } else {
        console.log(`⚠️ ${failCount} table(s) need to be created`);
        console.log('\n📝 Next steps:');
        console.log('1. Run the setup-inventory-database.sql script in Supabase SQL Editor');
        console.log('2. Check the INVENTORY_SETUP_GUIDE.md for instructions');
    }

    // Check for default categories
    console.log('\n🔍 Checking default data...');
    const { data: categories, error: catError } = await supabase
        .from('item_categories')
        .select('name');

    if (categories && categories.length > 0) {
        console.log(`✅ Found ${categories.length} item categories`);
    } else if (catError) {
        console.log(`⚠️ Could not check categories: ${catError.message}`);
    } else {
        console.log('📝 No categories found - default data may need to be inserted');
    }
}

// Run the test
testInventorySetup().catch(console.error);