-- SCHEMA UPDATE: Support Tournament Verification Codes
-- This allows booking_verification_codes to work with both turf bookings and tournament participants

-- Step 1: Drop the foreign key constraint on booking_id
ALTER TABLE booking_verification_codes 
  DROP CONSTRAINT IF EXISTS booking_verification_codes_booking_id_fkey;

-- Step 2: Add a booking_type column to distinguish between turf bookings and tournament bookings
ALTER TABLE booking_verification_codes 
  ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'turf' CHECK (booking_type IN ('turf', 'tournament'));

-- Step 3: Add a participant_id column for tournament bookings (optional, for better clarity)
ALTER TABLE booking_verification_codes 
  ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES tournament_participants(id) ON DELETE CASCADE;

-- Step 4: Update existing records to have booking_type = 'turf'
UPDATE booking_verification_codes 
SET booking_type = 'turf' 
WHERE booking_type IS NULL;

-- Step 5: Create index on participant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_participant ON booking_verification_codes(participant_id);

-- Note: booking_id will still be used for turf bookings, but won't have a foreign key constraint
-- This allows flexibility to store either booking_id (for turfs) or participant_id (for tournaments)

