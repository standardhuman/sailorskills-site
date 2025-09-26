# Database Migrations

## Version History

### 003_anode_system.sql (Current)
- **Date**: 2024
- **Description**: Complete anode management system schema
- **Tables Added**:
  - `anodes_catalog` - Product catalog from boatzincs
  - `anode_price_history` - Price tracking over time
  - `anode_inventory` - Stock management
  - `anode_orders` - Order tracking
  - `anode_order_items` - Order line items
  - `anode_sync_logs` - Scraping history
  - `boatzincs_credentials` - Encrypted credentials storage
- **Views Added**:
  - `anodes_needing_reorder` - Items below reorder point
  - `recent_price_changes` - Price changes in last 7 days
- **Functions Added**:
  - `update_updated_at_column()` - Auto-update timestamps
  - `calculate_price_change()` - Calculate price differences

## Running Migrations

### First Time Setup

1. Copy entire contents of `003_anode_system.sql`
2. Go to Supabase Dashboard > SQL Editor
3. Paste and run the migration
4. Verify tables are created in Table Editor

### Updates

When updating the schema:

1. Create new migration file: `004_[description].sql`
2. Include only the changes (ALTER TABLE, etc.)
3. Add rollback section at the bottom
4. Update this README with changes

## Rollback Instructions

To rollback the anode system:

```sql
-- WARNING: This will delete all anode data!

-- Drop views
DROP VIEW IF EXISTS anodes_needing_reorder CASCADE;
DROP VIEW IF EXISTS recent_price_changes CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_price_change() CASCADE;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS anode_sync_logs CASCADE;
DROP TABLE IF EXISTS boatzincs_credentials CASCADE;
DROP TABLE IF EXISTS anode_order_items CASCADE;
DROP TABLE IF EXISTS anode_orders CASCADE;
DROP TABLE IF EXISTS anode_inventory CASCADE;
DROP TABLE IF EXISTS anode_price_history CASCADE;
DROP TABLE IF EXISTS anodes_catalog CASCADE;
```

## Best Practices

1. **Always backup** before running migrations
2. **Test in development** first
3. **Include rollback** instructions
4. **Document changes** in this README
5. **Version control** all migrations
6. **Never modify** existing migration files
7. **Create new migrations** for changes

## Migration Naming Convention

```
NNN_description.sql
```

- `NNN` - Sequential number (003, 004, etc.)
- `description` - Brief description using underscores

Examples:
- `004_add_anode_brands.sql`
- `005_update_inventory_triggers.sql`
- `006_add_order_shipping.sql`