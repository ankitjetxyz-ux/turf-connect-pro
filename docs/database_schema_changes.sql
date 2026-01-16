-- Database Schema Changes for Turf Connect Pro
-- This file contains all database schema modifications

-- ============================================
-- 1. Add Google Maps Link to Turfs Table
-- ============================================
-- Add google_maps_link column to store Google Maps URLs for turfs

ALTER TABLE turfs 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

COMMENT ON COLUMN turfs.google_maps_link IS 'Full Google Maps URL for the turf location';

-- ============================================
-- 2. Add OTP Verification Tables
-- ============================================
-- Create table to store OTP verification codes for email verification during registration

CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email_otp UNIQUE (email, otp_code)
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

COMMENT ON TABLE email_otps IS 'Stores OTP codes for email verification during user registration';

-- ============================================
-- 3. Update Contact Messages Table (if needed)
-- ============================================
-- Ensure contact_messages table has proper email handling

-- Check if contact_messages table exists, if not create it
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

COMMENT ON TABLE contact_messages IS 'Stores contact form submissions with user email for real email handling';

-- ============================================
-- 4. Add Email Verification Status to Users
-- ============================================
-- Track if user's email has been verified via OTP

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.email_verified IS 'Indicates if the user email has been verified via OTP';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when email was verified';

-- ============================================
-- 5. Cleanup Function for Expired OTPs
-- ============================================
-- Function to clean up expired OTP codes (optional, can be run periodically)

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM email_otps 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND verified = FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_otps() IS 'Removes expired and unverified OTP codes from the database';

-- ============================================
-- 6. Indexes for Performance
-- ============================================
-- Additional indexes for better query performance

CREATE INDEX IF NOT EXISTS idx_turfs_google_maps_link ON turfs(google_maps_link) WHERE google_maps_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = FALSE;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Run these migrations in order
-- 2. The OTP table will store temporary verification codes
-- 3. OTP codes should expire after 10-15 minutes
-- 4. Contact messages will use the user's registered email
-- 5. Google Maps links should be validated to ensure they are valid Google Maps URLs
-- 6. Consider adding a scheduled job to run cleanup_expired_otps() periodically

