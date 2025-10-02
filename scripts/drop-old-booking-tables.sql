-- Drop old booking tables if they exist (to start fresh)
-- Run this FIRST, then run the migration

DROP TABLE IF EXISTS booking_history CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS blackout_dates CASCADE;
DROP TABLE IF EXISTS booking_settings CASCADE;
DROP TABLE IF EXISTS business_hours CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;

-- Also drop any related functions/triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Confirm cleanup
SELECT 'Cleanup complete - ready for fresh migration' as status;
