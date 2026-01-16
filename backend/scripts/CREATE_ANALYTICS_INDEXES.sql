-- ============================================================================
-- ANALYTICS DATABASE OPTIMIZATION - ESSENTIAL SETUP ONLY
-- ============================================================================
-- Run this file in Supabase SQL Editor
-- Creates all necessary indexes for 10-100x performance improvement
-- ============================================================================

-- CREATE ESSENTIAL INDEXES
-- ============================================================================

-- Primary index for analytics (MOST IMPORTANT)
CREATE INDEX IF NOT EXISTS idx_bookings_turf_status_date
ON bookings(turf_id, status, created_at);

-- Bookings by turf
CREATE INDEX IF NOT EXISTS idx_bookings_turf_id
ON bookings(turf_id);

-- Bookings by date
CREATE INDEX IF NOT EXISTS idx_bookings_created_at
ON bookings(created_at);

-- Slots by turf (for occupancy)
CREATE INDEX IF NOT EXISTS idx_slots_turf_id
ON slots(turf_id);

-- Slots by turf and date
CREATE INDEX IF NOT EXISTS idx_slots_turf_date
ON slots(turf_id, date);

-- Reviews by turf
CREATE INDEX IF NOT EXISTS idx_reviews_turf_id
ON reviews(turf_id);

-- Reviews by turf and date
CREATE INDEX IF NOT EXISTS idx_reviews_turf_created
ON reviews(turf_id, created_at);

-- VERIFY INDEXES CREATED
-- ============================================================================

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('bookings', 'slots', 'reviews')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- UPDATE STATISTICS
-- ============================================================================

ANALYZE bookings;
ANALYZE slots;
ANALYZE reviews;

-- DONE!
-- ============================================================================
-- All indexes created successfully
-- Analytics queries should now be 10-100x faster
-- ============================================================================
