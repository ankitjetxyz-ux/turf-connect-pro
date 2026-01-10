-- ============================================================================
-- RECURRING SLOT SCHEDULER - SAFE MIGRATION (HANDLES BOOKED DUPLICATES)
-- ============================================================================
-- This migration safely handles duplicates that have bookings
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- STEP 1: Transfer bookings from duplicate slots to the kept slot
-- ============================================================================
DO $$
DECLARE
    transferred_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting duplicate cleanup...';
    
    -- First, identify and transfer bookings from duplicate slots to the kept slot
    WITH duplicates AS (
        SELECT 
            id,
            turf_id,
            date,
            start_time,
            end_time,
            ROW_NUMBER() OVER (
                PARTITION BY turf_id, date, start_time, end_time 
                ORDER BY created_at ASC, id ASC
            ) AS rn,
            FIRST_VALUE(id) OVER (
                PARTITION BY turf_id, date, start_time, end_time 
                ORDER BY created_at ASC, id ASC
            ) AS keep_id
        FROM slots
    ),
    duplicate_ids AS (
        SELECT id, keep_id 
        FROM duplicates 
        WHERE rn > 1
    )
    -- Update bookings to reference the kept slot
    UPDATE bookings
    SET slot_id = duplicate_ids.keep_id
    FROM duplicate_ids
    WHERE bookings.slot_id = duplicate_ids.id;
    
    GET DIAGNOSTICS transferred_count = ROW_COUNT;
    RAISE NOTICE '✅ Transferred % bookings from duplicate slots', transferred_count;
    
    -- Now delete duplicate slots (which no longer have bookings)
    WITH duplicates AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY turf_id, date, start_time, end_time 
                ORDER BY created_at ASC, id ASC
            ) AS rn
        FROM slots
    )
    DELETE FROM slots
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Cleaned up % duplicate slots', deleted_count;
END $$;

-- ============================================================================
-- STEP 2: Create slot_templates table
-- ============================================================================
CREATE TABLE IF NOT EXISTS slot_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    slot_duration INT NOT NULL,
    conflict_strategy VARCHAR(20) DEFAULT 'skip',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_duration CHECK (slot_duration >= 30 AND slot_duration <= 480),
    CONSTRAINT valid_strategy CHECK (conflict_strategy IN ('skip', 'overwrite', 'fill_gaps'))
);

-- ============================================================================
-- STEP 3: Add new columns to slots table
-- ============================================================================
DO $$ 
BEGIN
    -- Add template_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'template_id'
    ) THEN
        ALTER TABLE slots ADD COLUMN template_id UUID REFERENCES slot_templates(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added template_id column';
    END IF;
    
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'status'
    ) THEN
        ALTER TABLE slots ADD COLUMN status VARCHAR(20) DEFAULT 'available';
        RAISE NOTICE '✅ Added status column';
    END IF;
    
    -- Add label column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'label'
    ) THEN
        ALTER TABLE slots ADD COLUMN label VARCHAR(50);
        RAISE NOTICE '✅ Added label column';
    END IF;
    
    -- Update status based on is_booked for existing rows
    UPDATE slots SET status = 'booked' WHERE is_booked = true AND status = 'available';
    UPDATE slots SET status = 'available' WHERE is_booked = false AND status != 'available';
    
    RAISE NOTICE '✅ Updated status values';
END $$;

-- ============================================================================
-- STEP 4: Create performance indexes
-- ============================================================================

-- Drop the unique index if it exists (in case of retry)
DROP INDEX IF EXISTS idx_slots_unique_time;

-- Create regular indexes first
CREATE INDEX IF NOT EXISTS idx_slots_turf_date ON slots(turf_id, date);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_slots_template ON slots(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slots_date_range ON slots(turf_id, date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_templates_turf ON slot_templates(turf_id);
CREATE INDEX IF NOT EXISTS idx_templates_date_range ON slot_templates(start_date, end_date);

-- Now create the unique index (after duplicates are removed)
CREATE UNIQUE INDEX idx_slots_unique_time 
ON slots(turf_id, date, start_time, end_time);

-- ============================================================================
-- STEP 5: Create trigger for updating updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_slot_templates_updated_at ON slot_templates;
CREATE TRIGGER update_slot_templates_updated_at
    BEFORE UPDATE ON slot_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================
COMMENT ON TABLE slot_templates IS 'Stores recurring schedule configurations for bulk slot generation';
COMMENT ON COLUMN slot_templates.active_days IS 'Array of active weekdays: ["monday", "tuesday", ...]';
COMMENT ON COLUMN slot_templates.time_blocks IS 'Array of time blocks with pricing: [{start, end, price, label}]';
COMMENT ON COLUMN slot_templates.conflict_strategy IS 'How to handle existing slots: skip, overwrite, or fill_gaps';

COMMENT ON COLUMN slots.template_id IS 'Links slot to the template that generated it (nullable for manual slots)';
COMMENT ON COLUMN slots.status IS 'Slot availability status: available, booked, blocked, cancelled';
COMMENT ON COLUMN slots.label IS 'Optional label from time block (e.g., morning, peak, evening)';

-- ============================================================================
-- STEP 7: Verify migration success
-- ============================================================================
DO $$
DECLARE
    slot_count INTEGER;
    duplicate_check INTEGER;
    template_count INTEGER;
    has_template_id BOOLEAN;
    has_status BOOLEAN;
    has_label BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO slot_count FROM slots;
    SELECT COUNT(*) INTO template_count FROM slot_templates;
    
    -- Check for remaining duplicates
    SELECT COUNT(*) INTO duplicate_check FROM (
        SELECT turf_id, date, start_time, end_time, COUNT(*) as cnt
        FROM slots
        GROUP BY turf_id, date, start_time, end_time
        HAVING COUNT(*) > 1
    ) AS dups;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'template_id'
    ) INTO has_template_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'status'
    ) INTO has_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'label'
    ) INTO has_label;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ RECURRING SLOT SCHEDULER MIGRATION COMPLETE!';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database State:';
    RAISE NOTICE '   • Total slots: %', slot_count;
    RAISE NOTICE '   • Remaining duplicates: %', duplicate_check;
    RAISE NOTICE '   • Templates table: ✅ Created';
    RAISE NOTICE '   • template_id column: %', CASE WHEN has_template_id THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   • status column: %', CASE WHEN has_status THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   • label column: %', CASE WHEN has_label THEN '✅' ELSE '❌' END;
    RAISE NOTICE '   • Unique index: ✅ Created';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Features Enabled:';
    RAISE NOTICE '   ✅ Bulk slot generation';
    RAISE NOTICE '   ✅ Recurring schedules';
    RAISE NOTICE '   ✅ Template management';
    RAISE NOTICE '   ✅ Calendar view';
    RAISE NOTICE '   ✅ Conflict prevention';
    RAISE NOTICE '';
    IF duplicate_check = 0 THEN
        RAISE NOTICE '✨ No duplicates found - database is clean!';
    ELSE
        RAISE WARNING '⚠️  Warning: % duplicate groups still exist', duplicate_check;
        RAISE NOTICE 'This should not happen - please report this.';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE '📖 Next: Test the API endpoints!';
    RAISE NOTICE 'POST /api/slots/bulk/generate';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
