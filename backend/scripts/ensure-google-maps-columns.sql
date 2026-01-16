-- Script to ensure Google Maps columns exist in the turfs table
-- This is safe to run multiple times (uses IF NOT EXISTS)
-- Run this in your Supabase SQL Editor

-- Add Google Maps columns if they don't exist
DO $$ 
BEGIN
  -- Check and add google_maps_link column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turfs' AND column_name = 'google_maps_link'
  ) THEN
    ALTER TABLE turfs ADD COLUMN google_maps_link TEXT;
    RAISE NOTICE 'Added column: google_maps_link';
  ELSE
    RAISE NOTICE 'Column google_maps_link already exists';
  END IF;

  -- Check and add latitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turfs' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE turfs ADD COLUMN latitude NUMERIC(10, 8);
    RAISE NOTICE 'Added column: latitude';
  ELSE
    RAISE NOTICE 'Column latitude already exists';
  END IF;

  -- Check and add longitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turfs' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE turfs ADD COLUMN longitude NUMERIC(11, 8);
    RAISE NOTICE 'Added column: longitude';
  ELSE
    RAISE NOTICE 'Column longitude already exists';
  END IF;

  -- Check and add formatted_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'turfs' AND column_name = 'formatted_address'
  ) THEN
    ALTER TABLE turfs ADD COLUMN formatted_address TEXT;
    RAISE NOTICE 'Added column: formatted_address';
  ELSE
    RAISE NOTICE 'Column formatted_address already exists';
  END IF;
END $$;

-- Create index for geospatial queries (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_turfs_coordinates ON turfs(latitude, longitude);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'turfs' 
  AND column_name IN ('google_maps_link', 'latitude', 'longitude', 'formatted_address')
ORDER BY column_name;

-- Show success message
SELECT '✅ Google Maps columns verification complete!' as message;
