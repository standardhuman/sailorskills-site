-- ============================================
-- Migration 011: Add Boat Location Fields
-- ============================================
-- Adds marina, dock, and slip columns to boats table
-- to fix data loss issue where boat location information
-- was not being captured during Estimator signups.
--
-- Root Cause: Estimator edge function was writing to
-- marina_location and slip_number fields that didn't exist.
-- Billing service was trying to read marina, dock, slip fields
-- that didn't exist.
--
-- Resolution: Add marina, dock, slip columns to match
-- expected schema across all services.
-- ============================================

-- Add marina column (location name like "Berkeley Marina")
ALTER TABLE boats
ADD COLUMN IF NOT EXISTS marina TEXT;

-- Add dock column (dock letter/number like "O")
ALTER TABLE boats
ADD COLUMN IF NOT EXISTS dock TEXT;

-- Add slip column (slip number like "605")
ALTER TABLE boats
ADD COLUMN IF NOT EXISTS slip TEXT;

-- Create index for marina searches (commonly used filter)
CREATE INDEX IF NOT EXISTS idx_boats_marina ON boats(marina);

-- Add helpful comments for future developers
COMMENT ON COLUMN boats.marina IS 'Marina or harbor name where boat is located';
COMMENT ON COLUMN boats.dock IS 'Dock letter/number within marina';
COMMENT ON COLUMN boats.slip IS 'Slip number where boat is moored';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
