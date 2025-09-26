# Inventory System Database Setup Guide

## Quick Setup (5 minutes)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fzygakldvvzxmahkdylq
2. Click on **SQL Editor** in the left sidebar
3. Click on **New query** button

### Step 2: Run the Setup Script
1. Copy the entire contents of `setup-inventory-database.sql`
2. Paste it into the SQL editor
3. Click the **Run** button (or press Ctrl/Cmd + Enter)

### Step 3: Verify Installation
After running the script, you should see:
- **Success message** at the bottom
- A table showing all created tables grouped by system category

### Step 4: Test the System
1. Go to: https://cost-calculator-sigma.vercel.app/anode-manager.html
2. The system should now connect automatically (no credential prompts)
3. Click on the **Inventory** tab - it should load without errors

## What Gets Created

### 📦 Core Tables
- **anodes_catalog** - Your Boatzincs product catalog
- **anode_inventory** - Anode-specific stock tracking
- **inventory_items** - General tools and equipment
- **item_categories** - Organization system for items

### 📋 Management Tables
- **inventory_suppliers** - Vendor information
- **inventory_transactions** - All stock movements
- **purchase_orders** - Order management
- **replenishment_list** - Items to reorder

### 🚤 Future Features (Ready but not active)
- **boats** - Customer boat profiles
- **boat_anode_types** - Boat-specific anode requirements
- **anode_tool_requirements** - Tools needed per anode type

## Initial Data Setup

### Add Your First Supplier (Optional)
```sql
INSERT INTO inventory_suppliers (name, email, phone, website, is_preferred)
VALUES ('Boatzincs', 'orders@boatzincs.com', '1-800-BOATZINC', 'https://boatzincs.com', true);
```

### Import Existing Anodes (If you have data)
The scraper should populate the `anodes_catalog` table. To manually add anodes to inventory:
```sql
-- Example: Add a specific anode to inventory
INSERT INTO anode_inventory (anode_id, quantity_on_hand, reorder_point, primary_location)
SELECT id, 10, 5, 'Warehouse A'
FROM anodes_catalog
WHERE name LIKE '%Shaft Zinc%'
LIMIT 1;
```

### Add Tools/Equipment
Use the inventory interface to add tools:
1. Go to Inventory tab
2. Click "+ Add Item"
3. Select "General Item"
4. Fill in details (name, category, quantity, location)

## Troubleshooting

### If tables already exist
The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### If you get permission errors
Make sure you're using the service role key or have proper permissions in Supabase.

### If the inventory page shows no data
This is normal for a fresh installation. You need to:
1. Run your anode scraper to populate the catalog
2. Add items through the interface
3. Or manually insert test data

### To reset everything (CAUTION!)
```sql
-- This will DELETE all inventory data!
DROP TABLE IF EXISTS anode_tool_requirements CASCADE;
DROP TABLE IF EXISTS boat_anode_types CASCADE;
DROP TABLE IF EXISTS boats CASCADE;
DROP TABLE IF EXISTS replenishment_list CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS item_suppliers CASCADE;
DROP TABLE IF EXISTS inventory_suppliers CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS item_categories CASCADE;
DROP TABLE IF EXISTS anode_inventory CASCADE;
DROP TABLE IF EXISTS anodes_catalog CASCADE;
```

## Next Steps

1. **Run the anode scraper** to populate your catalog
2. **Add your common tools** through the interface
3. **Set minimum stock levels** for critical items
4. **Configure suppliers** if you want to track orders
5. **Start tracking inventory** as you use items

## Support

- **Database Script**: `setup-inventory-database.sql`
- **Main Application**: https://cost-calculator-sigma.vercel.app/anode-manager.html
- **Admin Interface**: https://cost-calculator-sigma.vercel.app/admin.html

## Features Available After Setup

✅ Track all inventory types (anodes, tools, supplies)
✅ Set reorder points and minimum stock levels
✅ Process customer charges with auto-deduction
✅ Generate replenishment lists
✅ Track supplier information
✅ Monitor stock levels with visual alerts
✅ Complete transaction history
✅ Purchase order management
✅ Multi-category organization

The system is now ready to use!