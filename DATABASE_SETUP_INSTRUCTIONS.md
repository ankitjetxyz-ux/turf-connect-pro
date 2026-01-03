# Database Setup Instructions

## Required Database Queries

You need to run the following SQL queries in your Supabase SQL Editor to support all the new features.

### Step 1: Run the Schema Enhancements (if not already done)

If you haven't run `schema_enhancements.sql` yet, run it first:

```sql
-- This file is located at: backend/config/schema_enhancements.sql
-- It creates all the necessary tables for:
-- - Turf reviews and ratings
-- - Testimonials (text and video)
-- - Gallery images
-- - Chat favorites
-- - Booking verification codes
-- - Promotional videos
-- - Latitude/longitude for Google Maps
```

### Step 2: Run the Tournament Verification Update (REQUIRED)

**This is a critical update** that allows verification codes to work with both turf bookings and tournament bookings.

Run this SQL file in your Supabase SQL Editor:

```sql
-- File: backend/config/schema_update_tournament_verification.sql

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
```

### Step 3: Verify Tables Exist

Run this query to verify all required tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'turf_reviews',
  'turf_testimonials',
  'turf_gallery',
  'chat_favorites',
  'booking_verification_codes',
  'promotional_videos'
)
ORDER BY table_name;
```

You should see all 6 tables listed.

### Step 4: Verify booking_verification_codes Structure

Check that the booking_verification_codes table has the new columns:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'booking_verification_codes'
ORDER BY ordinal_position;
```

You should see:
- `booking_id` (uuid, nullable)
- `booking_type` (text, default 'turf')
- `participant_id` (uuid, nullable)
- `verification_code` (text, not null)
- `expires_at` (timestamptz, not null)
- `slot_id` (uuid, nullable)

## What This Update Does

1. **Removes the strict foreign key constraint** on `booking_id` - This allows the table to store verification codes for both turf bookings (using `booking_id`) and tournament bookings (using `participant_id`).

2. **Adds `booking_type` column** - Distinguishes between 'turf' and 'tournament' bookings.

3. **Adds `participant_id` column** - Properly references tournament participants for tournament bookings.

4. **Maintains backward compatibility** - Existing turf booking verification codes will continue to work.

## Important Notes

- **No data loss**: This migration is safe and won't delete any existing data.
- **Backward compatible**: Existing turf booking verification codes will continue to work.
- **Required for tournament bookings**: Without this update, tournament verification codes will fail to save.

## After Running the Queries

1. Restart your backend server to ensure it picks up the schema changes.
2. Test creating a turf booking - verification code should be generated.
3. Test joining a tournament - verification code should be generated and displayed.

## Troubleshooting

If you encounter any errors:

1. **Foreign key constraint error**: Make sure you ran Step 1 (dropping the constraint) before Step 2.
2. **Column already exists**: The `IF NOT EXISTS` clauses should prevent this, but if you see this error, the column already exists and you can skip that step.
3. **Permission errors**: Make sure you're running these queries as a user with sufficient privileges (usually the postgres user or service_role).

