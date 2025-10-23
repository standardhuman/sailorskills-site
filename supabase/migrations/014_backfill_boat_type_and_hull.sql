-- ============================================
-- Migration 014: Backfill Boat Type and Hull Type
-- ============================================
-- Also backfill type and hull_type from service_details if missing
-- ============================================

-- Backfill type (sailboat/powerboat) from service_orders.service_details
WITH boat_types AS (
  SELECT DISTINCT ON (boat_id)
    boat_id,
    service_details->>'boatType' as boat_type
  FROM service_orders
  WHERE boat_id IS NOT NULL
    AND service_details IS NOT NULL
    AND service_details->>'boatType' IS NOT NULL
  ORDER BY boat_id, created_at DESC
)
UPDATE boats b
SET type = bt.boat_type
FROM boat_types bt
WHERE b.id = bt.boat_id
  AND (b.type IS NULL OR b.type = '');

-- Backfill hull_type (monohull/catamaran/trimaran) from service_orders.service_details
WITH hull_types AS (
  SELECT DISTINCT ON (boat_id)
    boat_id,
    service_details->>'hullType' as hull_type
  FROM service_orders
  WHERE boat_id IS NOT NULL
    AND service_details IS NOT NULL
    AND service_details->>'hullType' IS NOT NULL
  ORDER BY boat_id, created_at DESC
)
UPDATE boats b
SET hull_type = ht.hull_type
FROM hull_types ht
WHERE b.id = ht.boat_id
  AND (b.hull_type IS NULL OR b.hull_type = '');

-- Verification
DO $$
DECLARE
  total_boats INTEGER;
  boats_with_type INTEGER;
  boats_with_hull INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_boats FROM boats;
  SELECT COUNT(*) INTO boats_with_type FROM boats WHERE type IS NOT NULL AND type != '';
  SELECT COUNT(*) INTO boats_with_hull FROM boats WHERE hull_type IS NOT NULL AND hull_type != '';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Boat Type/Hull Backfill Complete';
  RAISE NOTICE '   Total boats: %', total_boats;
  RAISE NOTICE '   Boats with type: %', boats_with_type;
  RAISE NOTICE '   Boats with hull type: %', boats_with_hull;
  RAISE NOTICE '';
END $$;
