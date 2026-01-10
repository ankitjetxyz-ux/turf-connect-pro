-- ============================================
-- COMPREHENSIVE DATABASE ALIGNMENT MIGRATION
-- This script aligns the database with the current code
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- ============================================
-- PART 1: ADD GOOGLE MAPS FIELDS TO TURFS
-- ============================================

ALTER TABLE turfs 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_turfs_coordinates ON turfs(latitude, longitude);

-- Add comments for documentation
COMMENT ON COLUMN turfs.google_maps_link IS 'Full Google Maps share link provided by turf owner';
COMMENT ON COLUMN turfs.latitude IS 'Latitude coordinate for exact location (-90 to 90)';
COMMENT ON COLUMN turfs.longitude IS 'Longitude coordinate for exact location (-180 to 180)';
COMMENT ON COLUMN turfs.formatted_address IS 'Full formatted address extracted from Google Maps';

-- ============================================
-- PART 2: CREATE TURF_COMMENTS TABLE
-- Used by TurfDetailPage comment system
-- ============================================

CREATE TABLE IF NOT EXISTS turf_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL CHECK (length(comment) <= 3000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_comments_turf ON turf_comments(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_comments_user ON turf_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_turf_comments_created_at ON turf_comments(created_at DESC);

-- ============================================
-- PART 3: CREATE TURF_GALLERY TABLE
-- Additional turf images beyond main images array
-- ============================================

CREATE TABLE IF NOT EXISTS turf_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_gallery_turf ON turf_gallery(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_gallery_display_order ON turf_gallery(display_order);

-- ============================================
-- PART 4: CREATE TURF_TESTIMONIALS TABLE
-- Video/text testimonials from users
-- ============================================

CREATE TABLE IF NOT EXISTS turf_testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('text', 'video')),
  content text, -- For text testimonials
  video_url text, -- For video testimonials
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_testimonials_turf ON turf_testimonials(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_testimonials_user ON turf_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_turf_testimonials_featured ON turf_testimonials(is_featured);

-- ============================================
-- PART 5: GRANT PERMISSIONS
-- ============================================

GRANT ALL ON turf_comments TO postgres, service_role, anon;
GRANT ALL ON turf_gallery TO postgres, service_role, anon;
GRANT ALL ON turf_testimonials TO postgres, service_role, anon;

-- ============================================
-- PART 6: VERIFY MIGRATION
-- ============================================

-- Check Google Maps columns were added
SELECT 'Google Maps fields in turfs:' as check_type,
       COUNT(*) as columns_found
FROM information_schema.columns 
WHERE table_name = 'turfs' 
AND column_name IN ('google_maps_link', 'latitude', 'longitude', 'formatted_address');

-- Check new tables were created
SELECT 'New tables:' as check_type,
       COUNT(*) as tables_found
FROM information_schema.tables 
WHERE table_name IN ('turf_comments', 'turf_gallery', 'turf_testimonials');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Database alignment migration completed successfully!' as status,
       'Added Google Maps fields + 3 new tables (comments, gallery, testimonials)' as changes;
