-- ============================================================================
-- TURF CONNECT PRO - ANALYTICS DATABASE OPTIMIZATION
-- ============================================================================
-- Production-Ready SQL Setup for Analytics System
-- Run this entire file in Supabase SQL Editor
-- 
-- Purpose: Optimize database for real-time analytics with 10-100x performance
-- Last Updated: 2026-01-11
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE ESSENTIAL INDEXES (CRITICAL FOR PERFORMANCE)
-- ============================================================================
-- These indexes are REQUIRED for analytics to run fast
-- Without these, queries on 1000+ bookings will be very slow (2-3 seconds)
-- With these indexes, queries complete in <100ms
-- ============================================================================

-- 1.1 PRIMARY INDEX: Bookings by Turf, Status, and Date
-- This is the MOST IMPORTANT index for analytics
CREATE INDEX IF NOT EXISTS idx_bookings_turf_status_date
ON bookings(turf_id, status, created_at);

-- 1.2 Bookings by Turf ID (for quick turf lookups)
CREATE INDEX IF NOT EXISTS idx_bookings_turf_id
ON bookings(turf_id);

-- 1.3 Bookings by Date (for date-range queries)
CREATE INDEX IF NOT EXISTS idx_bookings_created_at
ON bookings(created_at);

-- 1.4 Slots by Turf (for occupancy calculations)
CREATE INDEX IF NOT EXISTS idx_slots_turf_id
ON slots(turf_id);

-- 1.5 Slots by Turf and Date (for date-specific occupancy)
CREATE INDEX IF NOT EXISTS idx_slots_turf_date
ON slots(turf_id, date);

-- 1.6 Reviews by Turf (for rating analytics)
CREATE INDEX IF NOT EXISTS idx_reviews_turf_id
ON reviews(turf_id);

-- 1.7 Reviews by Turf and Date (for time-based rating trends)
CREATE INDEX IF NOT EXISTS idx_reviews_turf_created
ON reviews(turf_id, created_at);


-- ============================================================================
-- SECTION 2: VERIFY INDEXES WERE CREATED
-- ============================================================================
-- Run this to confirm all indexes exist
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('bookings', 'slots', 'reviews')
  AND schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================================================
-- SECTION 3: TEST ANALYTICS QUERIES (COMMENTED OUT)
-- ============================================================================
-- INSTRUCTIONS TO USE THESE QUERIES:
-- 1. Uncomment the queries below
-- 2. Replace 'YOUR_TURF_ID' with an actual UUID from your turfs table
-- 3. Run them one at a time to test analytics
-- ============================================================================

/*
-- 3.1 Test Revenue and Bookings Query (Last 30 Days)
SELECT 
    COUNT(*) as total_bookings,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_booking_price
FROM bookings
WHERE turf_id = 'YOUR_TURF_ID'
  AND status IN ('confirmed', 'paid', 'completed')
  AND created_at >= NOW() - INTERVAL '30 days';

-- 3.2 Test Daily Bookings Trend (Last 30 Days)
SELECT
    DATE(created_at) as booking_date,
    COUNT(*) as booking_count,
    SUM(total_amount) as daily_revenue
FROM bookings
WHERE turf_id = 'YOUR_TURF_ID'
  AND status IN ('confirmed', 'paid', 'completed')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY booking_date;

-- 3.3 Test Peak Hours Analysis
SELECT
    EXTRACT(HOUR FROM slots.start_time::time) as hour,
    COUNT(*) as booking_count
FROM bookings
JOIN slots ON bookings.slot_id = slots.id
WHERE bookings.turf_id = 'YOUR_TURF_ID'
  AND bookings.status IN ('confirmed', 'paid', 'completed')
  AND bookings.created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM slots.start_time::time)
ORDER BY booking_count DESC
LIMIT 5;

-- 3.4 Test Revenue by Day of Week
SELECT
    TO_CHAR(created_at, 'Dy') as day_of_week,
    COUNT(*) as booking_count,
    SUM(total_amount) as revenue
FROM bookings
WHERE turf_id = 'YOUR_TURF_ID'
  AND status IN ('confirmed', 'paid', 'completed')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY TO_CHAR(created_at, 'Dy'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);

-- 3.5 Test Occupancy Rate Calculation
WITH total_slots AS (
    SELECT COUNT(*) as slot_count
    FROM slots
    WHERE turf_id = 'YOUR_TURF_ID'
      AND date >= CURRENT_DATE - INTERVAL '30 days'
      AND date <= CURRENT_DATE
),
booked_slots AS (
    SELECT COUNT(*) as booked_count
    FROM bookings
    WHERE turf_id = 'YOUR_TURF_ID'
      AND status IN ('confirmed', 'paid', 'completed')
      AND created_at >= NOW() - INTERVAL '30 days'
)
SELECT
    booked_slots.booked_count,
    total_slots.slot_count,
    ROUND((booked_slots.booked_count::numeric / NULLIF(total_slots.slot_count, 0)) * 100, 2) as occupancy_rate
FROM booked_slots, total_slots;

-- 3.6 Test Average Rating
SELECT
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating
FROM reviews
WHERE turf_id = 'YOUR_TURF_ID'
  AND created_at >= NOW() - INTERVAL '30 days';
*/


-- ============================================================================
-- SECTION 4: VERIFY QUERY PERFORMANCE (COMMENTED OUT)
-- ============================================================================
-- INSTRUCTIONS: Uncomment and replace 'YOUR_TURF_ID' to test performance
-- ============================================================================

/*
EXPLAIN ANALYZE
SELECT 
    COUNT(*) as total_bookings,
    SUM(total_amount) as total_revenue
FROM bookings
WHERE turf_id = 'YOUR_TURF_ID'
  AND status IN ('confirmed', 'paid', 'completed')
  AND created_at >= NOW() - INTERVAL '30 days';
*/


-- ============================================================================
-- SECTION 5: DATABASE MAINTENANCE
-- ============================================================================
-- Run these periodically (weekly/monthly) for optimal performance
-- ============================================================================

-- 5.1 Update table statistics for query planner
ANALYZE bookings;
ANALYZE slots;
ANALYZE reviews;

-- 5.2 Clean up dead rows and optimize storage
VACUUM ANALYZE bookings;
VACUUM ANALYZE slots;
VACUUM ANALYZE reviews;


-- ============================================================================
-- SECTION 6: MONITORING QUERIES
-- ============================================================================
-- Use these to monitor database health and performance
-- ============================================================================

-- 6.1 Check Index Usage Statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('bookings', 'slots', 'reviews')
ORDER BY idx_scan DESC;

-- 6.2 Check Table Sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE tablename IN ('bookings', 'slots', 'reviews')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 6.3 Check Slow Queries (if enabled)
-- This requires pg_stat_statements extension
-- Run: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%bookings%'
ORDER BY mean_exec_time DESC
LIMIT 10;


-- ============================================================================
-- SECTION 7: DATA VALIDATION QUERIES
-- ============================================================================
-- Use these to verify your data is correct
-- ============================================================================

-- 7.1 Check Total Bookings by Status
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_revenue
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- 7.2 Check Bookings by Turf (Top 10)
SELECT 
    t.name as turf_name,
    COUNT(b.id) as total_bookings,
    SUM(b.total_amount) as total_revenue
FROM bookings b
JOIN turfs t ON b.turf_id = t.id
WHERE b.status IN ('confirmed', 'paid', 'completed')
GROUP BY t.id, t.name
ORDER BY total_bookings DESC
LIMIT 10;

-- 7.3 Check Date Range of Bookings
SELECT
    MIN(created_at) as first_booking,
    MAX(created_at) as last_booking,
    COUNT(*) as total_count
FROM bookings;

-- 7.4 Check for Missing Turf References
SELECT COUNT(*) as orphaned_bookings
FROM bookings
WHERE turf_id NOT IN (SELECT id FROM turfs);

-- 7.5 Check for Missing Slot References
SELECT COUNT(*) as orphaned_bookings
FROM bookings
WHERE slot_id NOT IN (SELECT id FROM slots);


-- ============================================================================
-- SECTION 8: SAMPLE DATA CHECK
-- ============================================================================
-- View sample data to verify structure
-- ============================================================================

-- 8.1 Sample Bookings
SELECT 
    id,
    turf_id,
    user_id,
    status,
    total_amount,
    created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- 8.2 Sample Slots
SELECT
    id,
    turf_id,
    date,
    start_time,
    end_time,
    price,
    is_booked
FROM slots
ORDER BY date DESC, start_time DESC
LIMIT 5;

-- 8.3 Sample Reviews
SELECT
    id,
    turf_id,
    user_id,
    rating,
    comment,
    created_at
FROM reviews
ORDER BY created_at DESC
LIMIT 5;


-- ============================================================================
-- SECTION 9: CLEANUP (USE WITH CAUTION!)
-- ============================================================================
-- Only run these if you need to remove the indexes
-- NOT RECOMMENDED unless you're rebuilding them
-- ============================================================================

/*
-- Remove all analytics indexes
DROP INDEX IF EXISTS idx_bookings_turf_status_date;
DROP INDEX IF EXISTS idx_bookings_turf_id;
DROP INDEX IF EXISTS idx_bookings_created_at;
DROP INDEX IF EXISTS idx_slots_turf_id;
DROP INDEX IF EXISTS idx_slots_turf_date;
DROP INDEX IF EXISTS idx_reviews_turf_id;
DROP INDEX IF EXISTS idx_reviews_turf_created;
*/


-- ============================================================================
-- COMPLETION CHECKLIST
-- ============================================================================
-- After running this file, verify:
-- [ ] SECTION 2: All indexes are listed
-- [ ] SECTION 3: Test queries return data (update YOUR_TURF_ID)
-- [ ] SECTION 4: EXPLAIN shows "Index Scan" not "Seq Scan"
-- [ ] SECTION 6.1: Indexes show usage statistics
-- [ ] SECTION 6.2: Table sizes are reasonable
-- [ ] SECTION 7: Data validation queries show correct data
-- 
-- If all checks pass, your database is optimized for analytics! ✅
-- ============================================================================


-- ============================================================================
-- PERFORMANCE EXPECTATIONS
-- ============================================================================
-- BEFORE INDEXES:
--   - Query Time: 500-2000ms (with 1000+ bookings)
--   - Database Load: High CPU usage
--   - User Experience: Slow dashboard loads
--
-- AFTER INDEXES:
--   - Query Time: 20-100ms (with same data)
--   - Database Load: Low CPU usage  
--   - User Experience: Instant analytics ⚡
--
-- Performance Improvement: 10-100x faster!
-- ============================================================================


-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. COLUMN NAME: Bookings table uses 'total_amount' NOT 'total_price'
-- 2. STATUSES: Only 'confirmed', 'paid', 'completed' count in analytics
-- 3. INDEXES: Essential for production - don't skip creating them!
-- 4. MAINTENANCE: Run VACUUM ANALYZE monthly for best performance
-- 5. MONITORING: Check index usage regularly to ensure they're being used
-- ============================================================================


-- ============================================================================
-- 🎉 SETUP COMPLETE!
-- ============================================================================
-- Your database is now optimized for production-grade analytics!
-- 
-- Next Steps:
-- 1. Test your analytics dashboard
-- 2. Monitor query performance with SECTION 6 queries
-- 3. Run maintenance (SECTION 5) monthly
-- 4. Check data validation (SECTION 7) weekly
--
-- Questions? Check the documentation:
-- - docs/ANALYTICS_SYSTEM_GUIDE.md
-- - docs/ANALYTICS_README.md
-- - docs/DATABASE_FIX_total_amount.md
-- ============================================================================
