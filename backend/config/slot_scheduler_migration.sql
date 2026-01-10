-- ============================================================================
-- RECURRING SLOT SCHEDULER - DATABASE MIGRATION
-- ============================================================================
-- This migration adds support for bulk slot generation with recurring schedules
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Create slot_templates table for storing recurring schedule configurations
CREATE TABLE IF NOT EXISTS slot_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
    name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active_days JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["monday", "tuesday", ...]
    time_blocks JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{start, end, price, label}, ...]
    slot_duration INT NOT NULL, -- in minutes (30, 60, 90, 120)
    conflict_strategy VARCHAR(20) DEFAULT 'skip', -- 'skip', 'overwrite', 'fill_gaps'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_duration CHECK (slot_duration >= 30 AND slot_duration <= 480),
    CONSTRAINT valid_strategy CHECK (conflict_strategy IN ('skip', 'overwrite', 'fill_gaps'))
);

-- 2. Add template_id to slots table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'template_id'
    ) THEN
        ALTER TABLE slots ADD COLUMN template_id UUID REFERENCES slot_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Ensure slots table has all required columns
DO $$ 
BEGIN
    -- Add status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'status'
    ) THEN
        ALTER TABLE slots ADD COLUMN status VARCHAR(20) DEFAULT 'available';
    END IF;
    
    -- Add label column for time block labels (morning, evening, etc.)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'slots' AND column_name = 'label'
    ) THEN
        ALTER TABLE slots ADD COLUMN label VARCHAR(50);
    END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slots_turf_date ON slots(turf_id, date);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_slots_template ON slots(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_slots_date_range ON slots(turf_id, date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_templates_turf ON slot_templates(turf_id);
CREATE INDEX IF NOT EXISTS idx_templates_date_range ON slot_templates(start_date, end_date);

-- 5. Add unique constraint to prevent duplicate slots
CREATE UNIQUE INDEX IF NOT EXISTS idx_slots_unique_time 
ON slots(turf_id, date, start_time, end_time);

-- 6. Create trigger for updating updated_at timestamp
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

-- 7. Add comments for documentation
COMMENT ON TABLE slot_templates IS 'Stores recurring schedule configurations for bulk slot generation';
COMMENT ON COLUMN slot_templates.active_days IS 'Array of active weekdays: ["monday", "tuesday", ...]';
COMMENT ON COLUMN slot_templates.time_blocks IS 'Array of time blocks with pricing: [{start, end, price, label}]';
COMMENT ON COLUMN slot_templates.conflict_strategy IS 'How to handle existing slots: skip, overwrite, or fill_gaps';

COMMENT ON COLUMN slots.template_id IS 'Links slot to the template that generated it (nullable for manual slots)';
COMMENT ON COLUMN slots.status IS 'Slot availability status: available, booked, blocked, cancelled';
COMMENT ON COLUMN slots.label IS 'Optional label from time block (e.g., morning, peak, evening)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Recurring Slot Scheduler migration completed successfully!';
    RAISE NOTICE '📋 Tables created: slot_templates';
    RAISE NOTICE '🔧 Columns added to slots: template_id, status, label';
    RAISE NOTICE '📊 Indexes created for optimal performance';
    RAISE NOTICE '🎯 Ready to use bulk slot generation!';
END $$;
