-- ADD MISSING COLUMNS TO USERS TABLE
-- Run this in Supabase SQL Editor to fix registration errors

-- Add email verification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add other useful columns for authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Update existing users to have email_verified = true (if any exist)
UPDATE users SET email_verified = true WHERE email_verified IS NULL;

COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email via OTP';
COMMENT ON COLUMN users.failed_login_attempts IS 'Track failed login attempts for account lockout';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp after too many failed logins';
