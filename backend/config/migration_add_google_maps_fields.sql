-- ============================================
-- ADD GOOGLE MAPS FIELDS TO TURFS TABLE
-- Run this in Supabase SQL Editor if you haven't already
-- This ensures the database schema aligns with the code
-- ============================================

-- Add new columns for Google Maps integration
ALTER TABLE turfs 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Create index for geospatial queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_turfs_coordinates ON turfs(latitude, longitude);

-- Add comments for documentation
COMMENT ON COLUMN turfs.google_maps_link IS 'Full Google Maps share link provided by turf owner';
COMMENT ON COLUMN turfs.latitude IS 'Latitude coordinate for exact location (-90 to 90)';
COMMENT ON COLUMN turfs.longitude IS 'Longitude coordinate for exact location (-180 to 180)';
COMMENT ON COLUMN turfs.formatted_address IS 'Full formatted address extracted from Google Maps';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'turfs' 
AND column_name IN ('google_maps_link', 'latitude', 'longitude', 'formatted_address')
ORDER BY column_name;

-- Success message
SELECT '✅ Google Maps fields added successfully to turfs table!' as message;
