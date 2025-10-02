-- Check what booking-related tables already exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%booking%' OR table_name LIKE '%service%' OR table_name LIKE '%blackout%'
ORDER BY table_name;

-- Check for existing indexes
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%booking%'
ORDER BY indexname;
