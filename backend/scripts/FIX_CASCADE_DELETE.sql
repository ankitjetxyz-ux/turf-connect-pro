-- ============================================================================
-- FIX FOREIGN KEY CONSTRAINTS FOR CASCADE DELETE
-- ============================================================================
-- This SQL will update your foreign key constraints to allow CASCADE deletion
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Drop existing foreign key constraints
-- ============================================================================

-- Drop bookings -> slots constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_slot_id_fkey;

-- Drop bookings -> turfs constraint  
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_turf_id_fkey;

-- Drop slots -> turfs constraint
ALTER TABLE slots
DROP CONSTRAINT IF EXISTS slots_turf_id_fkey;

-- Drop reviews -> turfs constraint
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_turf_id_fkey;

-- Drop tournaments -> turfs constraint
ALTER TABLE tournaments
DROP CONSTRAINT IF EXISTS tournaments_turf_id_fkey;


-- STEP 2: Re-create constraints WITH CASCADE DELETE
-- ============================================================================

-- Bookings -> Slots (CASCADE: when slot is deleted, delete bookings)
ALTER TABLE bookings
ADD CONSTRAINT bookings_slot_id_fkey 
FOREIGN KEY (slot_id) 
REFERENCES slots(id) 
ON DELETE CASCADE;

-- Bookings -> Turfs (CASCADE: when turf is deleted, delete bookings)
ALTER TABLE bookings
ADD CONSTRAINT bookings_turf_id_fkey 
FOREIGN KEY (turf_id) 
REFERENCES turfs(id) 
ON DELETE CASCADE;

-- Slots -> Turfs (CASCADE: when turf is deleted, delete slots)
ALTER TABLE slots
ADD CONSTRAINT slots_turf_id_fkey 
FOREIGN KEY (turf_id) 
REFERENCES turfs(id) 
ON DELETE CASCADE;

-- Reviews -> Turfs (CASCADE: when turf is deleted, delete reviews)
ALTER TABLE reviews
ADD CONSTRAINT reviews_turf_id_fkey 
FOREIGN KEY (turf_id) 
REFERENCES turfs(id) 
ON DELETE CASCADE;

-- Tournaments -> Turfs (CASCADE: when turf is deleted, delete tournaments)
ALTER TABLE tournaments
ADD CONSTRAINT tournaments_turf_id_fkey 
FOREIGN KEY (turf_id) 
REFERENCES turfs(id) 
ON DELETE CASCADE;


-- STEP 3: Verify constraints were created
-- ============================================================================

SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action
FROM pg_constraint
WHERE contype = 'f' 
  AND conrelid::regclass::text IN ('bookings', 'slots', 'reviews', 'tournaments')
ORDER BY table_name, constraint_name;

-- Expected output:
-- confdeltype = 'c' means CASCADE
-- confdeltype = 'a' means NO ACTION
-- confdeltype = 'r' means RESTRICT

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this, you can delete turfs from the backend without errors
-- The database will automatically cascade delete all related records
-- ============================================================================
