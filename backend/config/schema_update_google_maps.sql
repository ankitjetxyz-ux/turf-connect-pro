-- Add Google Maps fields to turfs table for exact location tracking
-- Run this in Supabase SQL Editor

-- Add new columns for Google Maps integration
ALTER TABLE turfs 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Create index for geospatial queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_turfs_coordinates ON turfs(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN turfs.google_maps_link IS 'Full Google Maps share link provided by turf owner';
COMMENT ON COLUMN turfs.latitude IS 'Latitude coordinate for exact location (-90 to 90)';
COMMENT ON COLUMN turfs.longitude IS 'Longitude coordinate for exact location (-180 to 180)';
COMMENT ON COLUMN turfs.formatted_address IS 'Full formatted address extracted from Google Maps';

-- Note: The 'location' column will still exist for backward compatibility
-- and can be used for city/district level filtering
