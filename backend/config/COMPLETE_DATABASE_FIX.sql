-- ============================================
-- COMPLETE DATABASE FIX FOR AUTHENTICATION
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- 1. FIX USERS TABLE - Add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Update existing users
UPDATE users SET email_verified = true WHERE email_verified IS NULL;
UPDATE users SET updated_at = now() WHERE updated_at IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- 2. CREATE OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  attempt_count integer DEFAULT 0,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_is_used ON otp_verifications(is_used);

-- 3. CREATE USER SESSIONS TABLE (for refresh tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- 4. CREATE BOOKING VERIFICATION CODES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS booking_verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES tournament_participants(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES slots(id) ON DELETE SET NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('turf', 'tournament')),
  verification_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_codes_booking ON booking_verification_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_codes_participant ON booking_verification_codes(participant_id);
CREATE INDEX IF NOT EXISTS idx_booking_codes_code ON booking_verification_codes(verification_code);

-- 5. ADD MISSING COLUMNS TO OTHER TABLES

-- Chats table additions
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS related_booking_id uuid REFERENCES bookings(id);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS auto_delete_at timestamptz;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Bookings table additions
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_start_time timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_end_time timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Tournaments table additions
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_time time;

-- Tournament participants additions
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS leader_contact_phone text;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Payments table additions  
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payer_id uuid REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 6. GRANT ALL PERMISSIONS
GRANT ALL ON users TO postgres, service_role, anon;
GRANT ALL ON otp_verifications TO postgres, service_role, anon;
GRANT ALL ON user_sessions TO postgres, service_role, anon;
GRANT ALL ON booking_verification_codes TO postgres, service_role, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon;

-- 7. HELPER FUNCTIONS

-- Clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE otp_verifications IS 'Stores hashed OTPs for email verification and password reset';
COMMENT ON TABLE user_sessions IS 'Stores JWT refresh tokens for long-lived user sessions';
COMMENT ON TABLE booking_verification_codes IS 'Stores 6-digit verification codes for booking confirmations';

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify everything was created
-- ============================================

-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if OTP table exists
SELECT COUNT(*) as otp_table_exists FROM information_schema.tables WHERE table_name = 'otp_verifications';

-- Check if sessions table exists
SELECT COUNT(*) as sessions_table_exists FROM information_schema.tables WHERE table_name = 'user_sessions';

-- Success message
SELECT 'All tables created successfully! ✅' as message;
