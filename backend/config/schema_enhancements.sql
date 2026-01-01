-- SCHEMA ENHANCEMENTS FOR NEW FEATURES
-- Run this in Supabase SQL Editor after complete_schema.sql

-- 1. Add owner_phone to turfs table (if not exists)
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS owner_phone text;

-- 2. Add rating and reviews count to turfs table
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0.0;
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0;

-- 3. TURF REVIEWS TABLE
CREATE TABLE IF NOT EXISTS turf_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id), -- Link to specific booking
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(turf_id, user_id, booking_id) -- One review per booking
);

CREATE INDEX IF NOT EXISTS idx_reviews_turf ON turf_reviews(turf_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON turf_reviews(user_id);

-- 4. TURF TESTIMONIALS TABLE (Video and Text)
CREATE TABLE IF NOT EXISTS turf_testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id),
  type text NOT NULL CHECK (type IN ('text', 'video')),
  content text, -- Text testimonial or video URL
  video_url text, -- For video testimonials
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_turf ON turf_testimonials(turf_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_user ON turf_testimonials(user_id);

-- 5. TURF GALLERY TABLE (Additional images)
CREATE TABLE IF NOT EXISTS turf_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_turf ON turf_gallery(turf_id);

-- 6. CHAT FAVORITES TABLE
CREATE TABLE IF NOT EXISTS chat_favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_favorites_user ON chat_favorites(user_id);

-- 7. BOOKING VERIFICATION CODES TABLE
CREATE TABLE IF NOT EXISTS booking_verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  verification_code text NOT NULL UNIQUE,
  slot_id uuid REFERENCES slots(id),
  expires_at timestamptz NOT NULL, -- Auto-delete after turf completion
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_code ON booking_verification_codes(verification_code);
CREATE INDEX IF NOT EXISTS idx_verification_booking ON booking_verification_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON booking_verification_codes(expires_at);

-- 8. PROMOTIONAL VIDEOS TABLE (Admin)
CREATE TABLE IF NOT EXISTS promotional_videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  video_url text NOT NULL,
  thumbnail_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotional_videos_active ON promotional_videos(is_active, display_order);

-- 9. Add latitude and longitude to turfs for Google Maps
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS latitude numeric(10, 8);
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);

-- 10. Update chats table to add is_favorite (alternative approach, or use separate table)
-- We're using separate chat_favorites table above, but adding this for quick access
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id);

-- Function to update turf rating when review is added/updated
CREATE OR REPLACE FUNCTION update_turf_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE turfs
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM turf_reviews
      WHERE turf_id = NEW.turf_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM turf_reviews
      WHERE turf_id = NEW.turf_id
    )
  WHERE id = NEW.turf_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update rating on review insert/update
DROP TRIGGER IF EXISTS trigger_update_turf_rating ON turf_reviews;
CREATE TRIGGER trigger_update_turf_rating
  AFTER INSERT OR UPDATE OR DELETE ON turf_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_turf_rating();

-- Function to cleanup expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_verification_codes
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Note: You can schedule this cleanup function via pg_cron or application cron job

