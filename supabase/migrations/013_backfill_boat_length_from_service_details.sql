-- ============================================
-- Migration 013: Backfill Boat Length from Service Details
-- ============================================
-- The boat length was stored in service_orders.service_details JSONB
-- but not copied to the boats.boat_length_ft column during migration.
-- This fixes that by extracting boatLength from service_details.
-- ============================================

-- Backfill boat_length_ft from service_orders.service_details
WITH boat_lengths AS (
  SELECT DISTINCT ON (boat_id)
    boat_id,
    (service_details->>'boatLength')::NUMERIC as boat_length
  FROM service_orders
  WHERE boat_id IS NOT NULL
    AND service_details IS NOT NULL
    AND service_details->>'boatLength' IS NOT NULL
    AND (service_details->>'boatLength')::NUMERIC > 0
  ORDER BY boat_id, created_at DESC
)
UPDATE boats b
SET boat_length_ft = bl.boat_length
FROM boat_lengths bl
WHERE b.id = bl.boat_id
  AND (b.boat_length_ft IS NULL OR b.boat_length_ft = 0);

-- Also update the old 'length' column for backward compatibility
UPDATE boats
SET length = boat_length_ft::INTEGER
WHERE boat_length_ft IS NOT NULL
  AND boat_length_ft > 0
  AND (length IS NULL OR length = 0);

-- Verification
DO $$
DECLARE
  total_boats INTEGER;
  boats_with_length INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_boats FROM boats;
  SELECT COUNT(*) INTO boats_with_length FROM boats WHERE boat_length_ft IS NOT NULL AND boat_length_ft > 0;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Boat Length Backfill Complete';
  RAISE NOTICE '   Total boats: %', total_boats;
  RAISE NOTICE '   Boats with length: %', boats_with_length;
  RAISE NOTICE '';
END $$;
