-- ============================================================================
-- DATABASE VERIFICATION QUERIES FOR ANALYTICS
-- Run these in Supabase SQL Editor to verify data exists
-- ============================================================================

-- ============================================================================
-- 1. CHECK BOOKINGS TABLE STRUCTURE AND DATA
-- ============================================================================

-- Verify 'bookings' table has the correct column name
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('total_amount', 'total_price', 'status', 'turf_id', 'created_at')
ORDER BY ordinal_position;

-- Count total bookings by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_revenue
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- Get sample bookings data
SELECT 
    id,
    turf_id,
    user_id,
    status,
    total_amount,
    created_at,
    DATE(created_at) as booking_date
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- Check if any turf has bookings
SELECT 
    t.id as turf_id,
    t.name as turf_name,
    t.owner_id,
    COUNT(b.id) as total_bookings,
    SUM(b.total_amount) as total_revenue
FROM turfs t
LEFT JOIN bookings b ON t.id = b.turf_id
    AND b.status IN ('confirmed', 'completed', 'paid', 'pending', 'success')
GROUP BY t.id, t.name, t.owner_id
HAVING COUNT(b.id) > 0
ORDER BY total_bookings DESC
LIMIT 5;

-- ============================================================================
-- 2. CHECK TOURNAMENTS AND PARTICIPANTS
-- ============================================================================

-- Verify tournament_participants table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournament_participants'
  AND column_name IN ('id', 'tournament_id', 'payment_status', 'created_at')
ORDER BY ordinal_position;

-- Count tournament participants by payment status
SELECT 
    payment_status,
    COUNT(*) as participant_count
FROM tournament_participants
GROUP BY payment_status
ORDER BY participant_count DESC;

-- Check tournaments with entry fee
SELECT 
    t.id as tournament_id,
    t.name as tournament_name,
    t.turf_id,
    t.entry_fee,
    t.status,
    COUNT(tp.id) as participants_count,
    COUNT(CASE WHEN tp.payment_status IN ('paid', 'completed', 'success') THEN 1 END) as paid_participants,
    t.entry_fee * COUNT(CASE WHEN tp.payment_status IN ('paid', 'completed', 'success') THEN 1 END) as total_entry_revenue
FROM tournaments t
LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
WHERE t.entry_fee > 0
GROUP BY t.id, t.name, t.turf_id, t.entry_fee, t.status
ORDER BY participants_count DESC
LIMIT 10;

-- Check turf owners with tournaments
SELECT 
    tu.id as turf_id,
    tu.name as turf_name,
    tu.owner_id,
    COUNT(DISTINCT t.id) as tournaments_count,
    COUNT(tp.id) as total_participants,
    SUM(CASE WHEN tp.payment_status IN ('paid', 'completed', 'success') THEN t.entry_fee ELSE 0 END) as tournament_revenue
FROM turfs tu
LEFT JOIN tournaments t ON tu.id = t.turf_id
LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
GROUP BY tu.id, tu.name, tu.owner_id
HAVING COUNT(DISTINCT t.id) > 0
ORDER BY tournament_revenue DESC
LIMIT 5;

-- ============================================================================
-- 3. COMBINED ANALYTICS VERIFICATION
-- ============================================================================

-- Get combined revenue for a specific turf (REPLACE 'YOUR_TURF_ID' with actual ID)
-- This simulates what the analytics controller should return

WITH turf_slot_revenue AS (
    SELECT 
        turf_id,
        COUNT(*) as slot_bookings,
        SUM(total_amount) as slot_revenue
    FROM bookings
    WHERE turf_id = 'YOUR_TURF_ID'  -- ⚠️ REPLACE THIS
      AND status IN ('confirmed', 'completed', 'paid', 'pending', 'success')
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY turf_id
),
tournament_revenue AS (
    SELECT 
        t.turf_id,
        COUNT(tp.id) as tournament_participants,
        SUM(t.entry_fee) as tournament_revenue
    FROM tournaments t
    INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
    WHERE t.turf_id = 'YOUR_TURF_ID'  -- ⚠️ REPLACE THIS
      AND tp.payment_status IN ('paid', 'completed', 'success')
      AND tp.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY t.turf_id
)
SELECT 
    COALESCE(tsr.turf_id, tr.turf_id) as turf_id,
    COALESCE(tsr.slot_bookings, 0) as turf_slot_bookings,
    COALESCE(tsr.slot_revenue, 0) as turf_slot_revenue,
    COALESCE(tr.tournament_participants, 0) as tournament_participants,
    COALESCE(tr.tournament_revenue, 0) as tournament_revenue,
    COALESCE(tsr.slot_bookings, 0) + COALESCE(tr.tournament_participants, 0) as total_bookings,
    COALESCE(tsr.slot_revenue, 0) + COALESCE(tr.tournament_revenue, 0) as total_revenue
FROM turf_slot_revenue tsr
FULL OUTER JOIN tournament_revenue tr ON tsr.turf_id = tr.turf_id;

-- ============================================================================
-- 4. CHECK FOR MISSING DATA SCENARIOS
-- ============================================================================

-- Find turfs with ZERO bookings (will show empty analytics)
SELECT 
    id as turf_id,
    name as turf_name,
    owner_id
FROM turfs
WHERE id NOT IN (
    SELECT DISTINCT turf_id FROM bookings
) AND id NOT IN (
    SELECT DISTINCT turf_id FROM tournaments
)
LIMIT 10;

-- Find turf owners with bookings but NO paid tournament participants
SELECT 
    t.owner_id,
    COUNT(DISTINCT t.id) as turfs_owned,
    COUNT(DISTINCT b.id) as slot_bookings,
    COUNT(DISTINCT tour.id) as tournaments_created,
    COUNT(DISTINCT tp.id) FILTER (WHERE tp.payment_status IN ('paid', 'completed', 'success')) as paid_tournament_participants
FROM turfs t
LEFT JOIN bookings b ON t.id = b.turf_id
LEFT JOIN tournaments tour ON t.id = tour.turf_id
LEFT JOIN tournament_participants tp ON tour.id = tp.tournament_id
GROUP BY t.owner_id
HAVING COUNT(DISTINCT b.id) > 0 AND COUNT(DISTINCT tp.id) FILTER (WHERE tp.payment_status IN ('paid', 'completed', 'success')) = 0
LIMIT 5;

-- ============================================================================
-- 5. RECENT ACTIVITY CHECK (Last 7 Days)
-- ============================================================================

-- Bookings in last 7 days
SELECT 
    DATE(created_at) as booking_date,
    status,
    COUNT(*) as count,
    SUM(total_amount) as revenue
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), status
ORDER BY booking_date DESC, count DESC;

-- Tournament participants in last 7 days
SELECT 
    DATE(tp.created_at) as registration_date,
    t.name as tournament_name,
    tp.payment_status,
    COUNT(*) as participants,
    SUM(t.entry_fee) as revenue
FROM tournament_participants tp
INNER JOIN tournaments t ON tp.tournament_id = t.id
WHERE tp.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(tp.created_at), t.name, tp.payment_status
ORDER BY registration_date DESC;

-- ============================================================================
-- 6. QUICK DATA SUMMARY
-- ============================================================================

-- Overall system stats
SELECT 
    'Total Turfs' as metric, COUNT(*)::text as value FROM turfs
UNION ALL
SELECT 'Total Bookings', COUNT(*)::text FROM bookings
UNION ALL
SELECT 'Paid Bookings', COUNT(*)::text FROM bookings WHERE status IN ('confirmed', 'completed', 'paid', 'success')
UNION ALL
SELECT 'Total Tournaments', COUNT(*)::text FROM tournaments
UNION ALL
SELECT 'Total Participants', COUNT(*)::text FROM tournament_participants
UNION ALL
SELECT 'Paid Participants', COUNT(*)::text FROM tournament_participants WHERE payment_status IN ('paid', 'completed', 'success')
UNION ALL
SELECT 'Total Booking Revenue', ROUND(SUM(total_amount))::text FROM bookings WHERE status IN ('confirmed', 'completed', 'paid', 'success')
UNION ALL
SELECT 'Total Tournament Revenue', ROUND(SUM(t.entry_fee))::text 
FROM tournament_participants tp 
INNER JOIN tournaments t ON tp.tournament_id = t.id 
WHERE tp.payment_status IN ('paid', 'completed', 'success');

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
1. Copy these queries into Supabase SQL Editor
2. Run them one by one
3. Look for:
   - Bookings table has 'total_amount' column ✓
   - Some bookings exist with status in ('confirmed', 'completed', 'paid', 'success')
   - Some tournament participants exist with payment_status = 'paid'
   - At least one turf has both bookings AND tournament participants

4. If query #3 (Combined Analytics) shows data:
   - Replace 'YOUR_TURF_ID' with an actual UUID from your turfs table
   - Run it to see expected analytics output
   - Compare with API response from /api/analytics/all

5. If query #6 (Quick Data Summary) shows zeros:
   - No data exists in database
   - You need to create test bookings and tournaments
   - Or wait for real users to create bookings
*/
