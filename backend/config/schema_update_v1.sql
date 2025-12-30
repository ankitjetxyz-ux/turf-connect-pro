-- Schema updates for Booking System
-- 1. Add booking_ids to payments to support multiple slots per transaction
ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_ids uuid[];

-- 2. Make booking_id nullable in payments (we will use booking_ids or razorpay_order_id)
ALTER TABLE payments ALTER COLUMN booking_id DROP NOT NULL;

-- 3. Add razorpay_order_id to bookings to link multiple bookings to a single payment order
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpay_order_id);
