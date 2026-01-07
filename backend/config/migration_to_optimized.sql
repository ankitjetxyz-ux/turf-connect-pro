-- ============================================
-- SAFE MIGRATION TO OPTIMIZED SCHEMA
-- Add missing columns to existing database
-- Run this in Supabase SQL Editor
-- ============================================

-- This script is SAFE to run multiple times (uses IF NOT EXISTS)

-- ============================================
-- 1. ADD MISSING COLUMNS TO USERS TABLE
-- ============================================

-- Add phone column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;

-- Add failed_login_attempts if it doesn't exist (used in auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;

-- Add last_failed_login if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login timestamptz;

-- Add deleted_at if it doesn't exist (used for soft deletes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================
-- 2. ADD MISSING COLUMNS TO TURFS TABLE
-- ============================================

-- Add rating column (will be auto-computed by trigger)
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;

-- Add reviews_count column (will be auto-computed by trigger)
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0;

-- Add owner_phone column
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS owner_phone text;

-- ============================================
-- 3. ADD MISSING COLUMNS TO BOOKINGS TABLE
-- ============================================

-- Add direct turf reference for easier queries
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS turf_id uuid REFERENCES turfs(id);

-- ============================================
-- 4. ADD MISSING COLUMNS TO REVIEWS TABLE
-- ============================================

-- Add booking reference (optional linkage)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id);

-- ============================================
-- 5. ADD MISSING COLUMN TO PAYMENTS TABLE
-- ============================================

-- Add payer_id if it doesn't exist (used in bookingController)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_id uuid REFERENCES users(id);

-- ============================================
-- 6. POPULATE COMPUTED FIELDS
-- ============================================

-- Update existing turfs with current ratings and review counts
UPDATE turfs t
SET 
  rating = COALESCE((
    SELECT AVG(rating)::numeric(3,2) 
    FROM reviews 
    WHERE turf_id = t.id
  ), 0),
  reviews_count = COALESCE((
    SELECT COUNT(*) 
    FROM reviews 
    WHERE turf_id = t.id
  ), 0)
WHERE t.rating IS NULL OR t.reviews_count IS NULL;

-- ============================================
-- 7. CREATE TRIGGER FOR AUTO-UPDATING RATINGS
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_turf_rating ON reviews;

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_turf_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE turfs
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0)::numeric(3,2) FROM reviews WHERE turf_id = NEW.turf_id),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE turf_id = NEW.turf_id)
  WHERE id = NEW.turf_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_turf_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_turf_rating();

-- ============================================
-- 8. CREATE/UPDATE HELPER FUNCTIONS
-- ============================================

-- Clean up expired OTPs (if otp_verifications table exists)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions (if user_sessions table exists)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Increment earnings safely (upsert pattern)
CREATE OR REPLACE FUNCTION increment_earning(p_entity_id uuid, p_entity_type text, p_amount numeric)
RETURNS void AS $$
BEGIN
  INSERT INTO earnings (entity_id, entity_type, amount, updated_at)
  VALUES (p_entity_id, p_entity_type, p_amount, now())
  ON CONFLICT (entity_id, entity_type)
  DO UPDATE SET amount = earnings.amount + p_amount, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Turfs indexes
CREATE INDEX IF NOT EXISTS idx_turfs_rating ON turfs(rating);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Count total tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Verify new columns exist in users
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'failed_login_attempts', 'last_failed_login', 'deleted_at')
ORDER BY column_name;

-- Verify new columns exist in turfs
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'turfs' 
AND column_name IN ('rating', 'reviews_count', 'owner_phone')
ORDER BY column_name;

-- Verify trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_turf_rating';

-- Success message
SELECT 'Migration to optimized schema completed successfully! ✅' as message;
