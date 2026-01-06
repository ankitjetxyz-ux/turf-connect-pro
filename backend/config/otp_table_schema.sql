-- OTP VERIFICATIONS TABLE
-- This table stores secure OTP codes for email verification and password reset
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_hash text NOT NULL,  -- Bcrypt hashed OTP (never store plain text)
  purpose text NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  attempt_count integer DEFAULT 0,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_is_used ON otp_verifications(is_used);

-- Clean up expired OTPs automatically (optional but recommended)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON otp_verifications TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

COMMENT ON TABLE otp_verifications IS 'Stores hashed OTPs for email verification and password reset with security features';
