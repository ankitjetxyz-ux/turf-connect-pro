-- CORRECTED: CHECK LATEST BOOKINGS FOR "NEEV'S DEMO TURF"
-- Removed non-existent 'payment_status' column

SELECT 
    b.id,
    b.created_at,
    b.booking_date,
    b.status, -- This holds the state (confirmed, pending, etc.)
    b.total_amount,
    t.name as turf_name
FROM bookings b
JOIN turfs t ON b.turf_id = t.id
WHERE t.name = 'NEEV''S DEMO TURF'
ORDER BY b.created_at DESC;
