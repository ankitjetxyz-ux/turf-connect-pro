-- SCHEMA UPDATES FOR NEW FEATURES (Run in Supabase SQL Editor)

-- 1. Add chat expiration support - link chats to bookings for auto-deletion
ALTER TABLE chats ADD COLUMN IF NOT EXISTS related_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS auto_delete_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chats_auto_delete ON chats(auto_delete_at);

-- 2. Add columns to store booking start/end times for chat expiration calculation
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_start_time timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_end_time timestamptz;

-- 3. Create turf comments table (for turf detail page comments)
CREATE TABLE IF NOT EXISTS turf_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL CHECK (length(comment) <= 3000), -- ~50-60 lines max
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_comments_turf ON turf_comments(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_comments_user ON turf_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_turf_comments_created_at ON turf_comments(created_at DESC);

-- 4. Function to auto-delete expired chats (call this via cron or scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_chats()
RETURNS void AS $$
BEGIN
  UPDATE chats
  SET is_deleted = true, deleted_at = now()
  WHERE auto_delete_at IS NOT NULL 
    AND auto_delete_at < now() 
    AND is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- 5. Add profile image column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url text;

-- 6. Add stats tracking columns to turfs
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS tournaments_hosted integer DEFAULT 0;
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS matches_played integer DEFAULT 0;
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
