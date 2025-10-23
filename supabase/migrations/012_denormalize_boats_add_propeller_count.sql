-- ============================================
-- Migration 012: Denormalize Boats Table & Add Propeller Count
-- ============================================
-- Fixes boat data flow issues across Estimator, Billing, and Operations
--
-- PROBLEM: Estimator writes to boat_name, boat_make, boat_model, boat_length_ft
--          but database only has name, make, model, length columns.
--          This causes all boat data to fail during insert.
--
-- SOLUTION: Add denormalized columns to support both old and new schemas
--           during transition period. Add propeller_count for Billing UI.
-- ============================================

-- Step 1: Add denormalized columns
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS boat_name TEXT,
  ADD COLUMN IF NOT EXISTS boat_make TEXT,
  ADD COLUMN IF NOT EXISTS boat_model TEXT,
  ADD COLUMN IF NOT EXISTS boat_year INTEGER,
  ADD COLUMN IF NOT EXISTS boat_length_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS hull_material TEXT,
  ADD COLUMN IF NOT EXISTS marina_location TEXT,
  ADD COLUMN IF NOT EXISTS slip_number TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS propeller_count INTEGER;

-- Step 2: Migrate existing data from old columns to new
UPDATE boats SET boat_name = name WHERE boat_name IS NULL AND name IS NOT NULL;
UPDATE boats SET boat_make = make WHERE boat_make IS NULL AND make IS NOT NULL;
UPDATE boats SET boat_model = model WHERE boat_model IS NULL AND model IS NOT NULL;
UPDATE boats SET boat_length_ft = length WHERE boat_length_ft IS NULL AND length IS NOT NULL;

-- Step 3: Populate marina_location from marina column (added in migration 011)
UPDATE boats SET marina_location = marina WHERE marina_location IS NULL AND marina IS NOT NULL;

-- Step 4: Populate slip_number from slip column (added in migration 011)
UPDATE boats SET slip_number = slip WHERE slip_number IS NULL AND slip IS NOT NULL;

-- Step 5: Populate customer data from customers table using customer_id
UPDATE boats b
SET
  customer_name = c.name,
  customer_email = c.email,
  customer_phone = c.phone
FROM customers c
WHERE b.customer_id = c.id
  AND (b.customer_name IS NULL OR b.customer_email IS NULL OR b.customer_phone IS NULL);

-- Step 6: Backfill propeller_count from service_orders.service_details JSONB
WITH boat_propellers AS (
  SELECT DISTINCT ON (boat_id)
    boat_id,
    (service_details->>'propellerCount')::INTEGER as propeller_count
  FROM service_orders
  WHERE boat_id IS NOT NULL
    AND service_details IS NOT NULL
    AND service_details->>'propellerCount' IS NOT NULL
  ORDER BY boat_id, created_at DESC
)
UPDATE boats b
SET propeller_count = bp.propeller_count
FROM boat_propellers bp
WHERE b.id = bp.boat_id
  AND b.propeller_count IS NULL;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boats_customer_email ON boats(customer_email);
CREATE INDEX IF NOT EXISTS idx_boats_boat_name ON boats(boat_name);
CREATE INDEX IF NOT EXISTS idx_boats_marina_location ON boats(marina_location);
CREATE INDEX IF NOT EXISTS idx_boats_is_active ON boats(is_active) WHERE is_active = TRUE;

-- Step 8: Add helpful comments
COMMENT ON COLUMN boats.boat_name IS 'Denormalized boat name (replaces old name column)';
COMMENT ON COLUMN boats.boat_length_ft IS 'Denormalized boat length in feet (replaces old length column)';
COMMENT ON COLUMN boats.customer_name IS 'Denormalized customer name from customers table';
COMMENT ON COLUMN boats.marina_location IS 'Denormalized marina name (duplicates marina column for compatibility)';
COMMENT ON COLUMN boats.slip_number IS 'Denormalized slip number (duplicates slip column for compatibility)';
COMMENT ON COLUMN boats.propeller_count IS 'Number of propellers (extracted from service_details)';
COMMENT ON COLUMN boats.is_active IS 'Whether this boat is actively serviced';

-- ============================================
-- MIGRATION COMPLETE
-- Old columns (name, make, model, length) kept for backward compatibility
-- New columns (boat_name, boat_make, boat_model, boat_length_ft) now available
-- Both schemas will work during transition period
-- ============================================
