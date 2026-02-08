-- ============================================================================
-- MIGRATION: Cancellation Policies & Slot Hold System
-- ============================================================================
-- This migration adds support for:
-- 1. Owner cancellation policy (reason required, ₹80 penalty, max 10/month)
-- 2. Player cancellation policy (100% refund if ≥2hrs, 0% if <2hrs, max 5/month)
-- 3. Slot hold system (REMOVED)
-- ============================================================================

-- ============================================================================
-- PART 1: BOOKINGS TABLE ENHANCEMENTS
-- ============================================================================

-- Add new status values for cancelled bookings
-- First, drop the existing check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new check constraint with additional status values
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN (
    'pending', 
    'confirmed', 
    'cancelled',           -- Generic cancelled (legacy)
    'cancelled_by_player', -- Player initiated cancellation
    'cancelled_by_owner',  -- Owner initiated cancellation
    'completed'
  ));

-- Add refund_amount column to track refunds
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2) DEFAULT 0;

-- Add cancelled_at timestamp
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Add cancellation_reason for owner cancellations (required)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Add penalty_applied to track penalties charged to owners
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS penalty_applied numeric(10,2) DEFAULT 0;

-- Add index for cancelled bookings lookup (for monthly limit checks)
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status_user ON bookings(status, user_id);



-- ============================================================================
-- PART 4: OWNER PENALTIES TABLE (Optional - for tracking penalty history)
-- ============================================================================

-- Create table to track owner penalties
CREATE TABLE IF NOT EXISTS owner_penalties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  penalty_amount numeric(10,2) NOT NULL DEFAULT 80.00,
  reason text NOT NULL,
  player_refund_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for looking up owner penalties
CREATE INDEX IF NOT EXISTS idx_owner_penalties_owner ON owner_penalties(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_penalties_created ON owner_penalties(created_at);

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to count owner cancellations this month
CREATE OR REPLACE FUNCTION count_owner_cancellations_this_month(p_owner_id uuid)
RETURNS integer AS $$
DECLARE
  cancel_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO cancel_count
  FROM bookings b
  JOIN slots s ON b.slot_id = s.id
  JOIN turfs t ON s.turf_id = t.id
  WHERE t.owner_id = p_owner_id
    AND b.status = 'cancelled_by_owner'
    AND b.cancelled_at >= date_trunc('month', CURRENT_DATE)
    AND b.cancelled_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN COALESCE(cancel_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to count player cancellations this month
CREATE OR REPLACE FUNCTION count_player_cancellations_this_month(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  cancel_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO cancel_count
  FROM bookings
  WHERE user_id = p_user_id
    AND status = 'cancelled_by_player'
    AND cancelled_at >= date_trunc('month', CURRENT_DATE)
    AND cancelled_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  
  RETURN COALESCE(cancel_count, 0);
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 6: DECREMENT EARNINGS FUNCTION (for refunds)
-- ============================================================================

-- Function to decrement earnings (for refunds/penalties)
CREATE OR REPLACE FUNCTION decrement_earning(p_entity_id uuid, p_entity_type text, p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE earnings 
  SET 
    amount = GREATEST(0, amount - p_amount),
    updated_at = now()
  WHERE entity_id = p_entity_id 
    AND entity_type = p_entity_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on new table
GRANT EXECUTE ON FUNCTION decrement_earning(uuid, text, numeric) TO postgres, service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 
-- BOOKINGS table:
--   + refund_amount (numeric) - Tracks refund given to player
--   + cancelled_at (timestamptz) - When cancellation occurred
--   + cancellation_reason (text) - Required reason for owner cancellations
--   + penalty_applied (numeric) - Penalty charged to owner
--   ~ status CHECK updated to include 'cancelled_by_player', 'cancelled_by_owner'
--
-- SLOTS table:
--   + locked_by (uuid) - User who has temporarily locked the slot
--   + lock_expires_at (timestamptz) - When the lock expires
--   + status (text) - 'available', 'locked', 'booked', 'cancelled'
--
-- NEW TABLES:
--   + slot_hold_history - Tracks slot hold history for cooldown enforcement
--   + owner_penalties - Tracks penalty history for owners
--
-- NEW FUNCTIONS:
--   + count_owner_cancellations_this_month(owner_id)
--   + count_player_cancellations_this_month(user_id)
--   + release_expired_slot_holds()
--   + can_user_hold_slots(user_id, turf_id, cooldown_minutes)
--   + decrement_earning(entity_id, entity_type, amount)
-- ============================================================================
