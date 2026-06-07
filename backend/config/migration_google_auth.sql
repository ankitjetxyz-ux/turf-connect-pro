-- Google Sign-In support for users table
-- Run in Supabase → SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

COMMENT ON COLUMN users.google_id IS 'Google account subject ID for OAuth sign-in';
COMMENT ON COLUMN users.auth_provider IS 'email | google';
