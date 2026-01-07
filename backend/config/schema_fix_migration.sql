-- ============================================
-- DATABASE SCHEMA FIX - Missing Tables & Columns
-- Run this migration to align database with controllers
-- ============================================

-- 1. Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_reset timestamptz;

-- 2. Create turf_comments table (supports turf detail page comments)
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

-- 3. Create turf_gallery table (additional turf images)
CREATE TABLE IF NOT EXISTS turf_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_gallery_turf ON turf_gallery(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_gallery_display_order ON turf_gallery(display_order);

-- 4. Create turf_reviews table (separate from main reviews table)
CREATE TABLE IF NOT EXISTS turf_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_reviews_turf ON turf_reviews(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_reviews_user ON turf_reviews(user_id);

-- 5. Create turf_testimonials table
CREATE TABLE IF NOT EXISTS turf_testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  testimonial text NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turf_testimonials_turf ON turf_testimonials(turf_id);
CREATE INDEX IF NOT EXISTS idx_turf_testimonials_user ON turf_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_turf_testimonials_featured ON turf_testimonials(is_featured);

-- 6. Grant permissions
GRANT ALL ON turf_comments TO postgres, service_role, anon;
GRANT ALL ON turf_gallery TO postgres, service_role, anon;
GRANT ALL ON turf_reviews TO postgres, service_role, anon;
GRANT ALL ON turf_testimonials TO postgres, service_role, anon;

-- Success message
SELECT 'Database schema fix applied successfully! ✅' as message,
       'Added 4 missing tables and 2 user columns' as details;
