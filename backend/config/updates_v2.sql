-- =============================================
-- STEP 1: REMOVE EXISTING TURF DATA
-- =============================================
TRUNCATE TABLE turfs CASCADE;

-- =============================================
-- STEP 2: SCHEMA UPDATES FOR TOURNAMENTS
-- =============================================
-- Ensure tournaments has an image column (text for URL/path)
-- It likely exists, but we want to make sure the user knows we are using it for file paths now
ALTER TABLE tournaments ALTER COLUMN image TYPE text;


-- =============================================
-- STEP 3: SCHEMA UPDATES FOR PARTICIPANTS (Leader Contact)
-- =============================================
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS leader_contact_phone text;

-- =============================================
-- STEP 4: STORAGE (Implicit)
-- =============================================
-- We are using local storage (multer) in the backend 'uploads' folder for now, so no Supabase Storage Bucket changes needed.
