-- Verify Migration Success
-- Run this to check all tables and data were created

-- 1. Check all tables exist
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('service_types', 'business_hours', 'booking_settings', 'bookings', 'booking_history', 'blackout_dates')
ORDER BY table_name;

-- 2. Check service types (should have 7)
SELECT COUNT(*) as service_count, 'service_types' as table_name FROM service_types
UNION ALL
SELECT COUNT(*), 'business_hours' FROM business_hours
UNION ALL
SELECT COUNT(*), 'booking_settings' FROM booking_settings;

-- 3. View the service types
SELECT name, slug, category, duration_minutes FROM service_types ORDER BY display_order;

-- 4. View business hours
SELECT day_of_week, start_time, end_time, notes FROM business_hours ORDER BY day_of_week;
