-- ============================================================================
-- QUICK DATABASE VERIFICATION - AUTO-DETECTING QUERIES
-- Just copy and paste each section - NO manual edits needed!
-- ============================================================================

-- ============================================================================
-- SECTION 1: SYSTEM OVERVIEW (Run this first!)
-- ============================================================================

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
SELECT 'Total Booking Revenue', COALESCE(ROUND(SUM(total_amount))::text, '0') FROM bookings WHERE status IN ('confirmed', 'completed', 'paid', 'success')
UNION ALL
SELECT 'Total Tournament Revenue', COALESCE(ROUND(SUM(t.entry_fee))::text, '0')
FROM tournament_participants tp 
INNER JOIN tournaments t ON tp.tournament_id = t.id 
WHERE tp.payment_status IN ('paid', 'completed', 'success');

-- ============================================================================
-- SECTION 2: TOP TURFS WITH COMBINED ANALYTICS (Auto-detects all turfs)
-- ============================================================================

WITH turf_bookings AS (
    SELECT 
        turf_id,
        COUNT(*) as booking_count,
        SUM(total_amount) as booking_revenue
    FROM bookings
    WHERE status IN ('confirmed', 'completed', 'paid', 'pending', 'success')
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY turf_id
),
turf_tournaments AS (
    SELECT 
        t.turf_id,
        COUNT(tp.id) as participant_count,
        SUM(t.entry_fee) as tournament_revenue
    FROM tournaments t
    INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
    WHERE tp.payment_status IN ('paid', 'completed', 'success')
      AND tp.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY t.turf_id
)
SELECT 
    tu.id as turf_id,
    tu.name as turf_name,
    COALESCE(tb.booking_count, 0) as slot_bookings,
    COALESCE(tb.booking_revenue, 0) as slot_revenue,
    COALESCE(tt.participant_count, 0) as tournament_participants,
    COALESCE(tt.tournament_revenue, 0) as tournament_revenue,
    COALESCE(tb.booking_count, 0) + COALESCE(tt.participant_count, 0) as total_bookings,
    COALESCE(tb.booking_revenue, 0) + COALESCE(tt.tournament_revenue, 0) as total_revenue
FROM turfs tu
LEFT JOIN turf_bookings tb ON tu.id = tb.turf_id
LEFT JOIN turf_tournaments tt ON tu.id = tt.turf_id
WHERE COALESCE(tb.booking_count, 0) > 0 OR COALESCE(tt.participant_count, 0) > 0
ORDER BY total_revenue DESC
LIMIT 10;

-- ============================================================================
-- SECTION 3: RECENT ACTIVITY (Last 7 Days)
-- ============================================================================

-- Bookings by day
SELECT 
    DATE(created_at) as date,
    COUNT(*) as bookings,
    SUM(total_amount) as revenue
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status IN ('confirmed', 'completed', 'paid', 'success')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Tournament registrations by day
SELECT 
    DATE(tp.created_at) as date,
    COUNT(*) as participants,
    SUM(t.entry_fee) as revenue
FROM tournament_participants tp
INNER JOIN tournaments t ON tp.tournament_id = t.id
WHERE tp.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND tp.payment_status IN ('paid', 'completed', 'success')
GROUP BY DATE(tp.created_at)
ORDER BY date DESC;

-- ============================================================================
-- SECTION 4: VERIFY COLUMN NAMES (Important for backend)
-- ============================================================================

-- Check if 'bookings' table has 'total_amount' column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'total_amount'
        ) THEN '✅ CORRECT: total_amount column EXISTS'
        ELSE '❌ ERROR: total_amount column MISSING (backend will fail!)'
    END as status;

-- List all columns in bookings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 5: FIND TURFS WITH DATA (For testing API)
-- ============================================================================

-- Get turf IDs that have bookings OR tournaments (use these for API testing)
SELECT 
    t.id as turf_id,
    t.name as turf_name,
    t.owner_id,
    (SELECT COUNT(*) FROM bookings WHERE turf_id = t.id) as booking_count,
    (SELECT COUNT(*) FROM tournaments WHERE turf_id = t.id) as tournament_count
FROM turfs t
WHERE EXISTS (SELECT 1 FROM bookings WHERE turf_id = t.id)
   OR EXISTS (SELECT 1 FROM tournaments WHERE turf_id = t.id)
LIMIT 5;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================

/*
SECTION 1 RESULTS:
- If "Total Bookings" > 0: ✅ Have booking data
- If "Paid Bookings" = 0: ⚠️ No confirmed bookings yet
- If "Paid Participants" > 0: ✅ Tournament integration can be tested
- If ALL zeros: ⚠️ No data - need to create test bookings

SECTION 2 RESULTS:
- Shows TOP turfs with combined analytics
- "total_revenue" should = "slot_revenue" + "tournament_revenue"
- Use "turf_id" from this result for API testing

SECTION 4 RESULTS:
- Must show: ✅ CORRECT: total_amount column EXISTS
- If shows ERROR: Update backend queries to use correct column name

SECTION 5 RESULTS:
- Copy a "turf_id" UUID from here
- Use it to test: GET /api/analytics/all?turf_id=PASTE_HERE&period=30days
*/
