-- ADD MISSING LOGIN-RELATED COLUMNS TO USERS TABLE
-- Run this in Supabase SQL Editor

-- Add last login tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login timestamptz;

-- Update comment
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';
COMMENT ON COLUMN users.last_failed_login IS 'Timestamp of last failed login attempt';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('last_login', 'last_failed_login');
