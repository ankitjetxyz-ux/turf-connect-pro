-- USER SESSIONS TABLE (for JWT refresh tokens)
-- Run this in Supabase SQL Editor

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Clean up expired sessions automatically (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON user_sessions TO postgres, service_role, anon;

COMMENT ON TABLE user_sessions IS 'Stores JWT refresh tokens for long-lived user sessions';
