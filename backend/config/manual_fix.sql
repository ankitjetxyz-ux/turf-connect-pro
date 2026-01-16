-- =====================================================
-- 🛠️ MANUAL FIX FOR SCHEMA ERROR
-- Run this script in your Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. Ensure the columns exist (Safe to run multiple times)
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS images_urls TEXT[];
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';

-- 2. Force PostgREST to refresh its schema cache
-- This fixes the "Could not find column ... in schema cache" error
NOTIFY pgrst, 'reload schema';

-- 3. Verify it worked
SELECT 'Schema Refreshed' as status;
