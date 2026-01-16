-- ============================================
-- SCHEMA UPDATE FOR ANALYTICS & DELETE LOGIC
-- Adds deleted_at column to turfs table
-- ============================================

DO $$
BEGIN
    -- Add deleted_at column to turfs if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'turfs'
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE turfs ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;

    -- Add index for performance on deleted_at checks
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'turfs'
        AND indexname = 'idx_turfs_deleted_at'
    ) THEN
        CREATE INDEX idx_turfs_deleted_at ON turfs(deleted_at);
    END IF;

END $$;

-- Verify success
SELECT 'Schema updated successfully: Added deleted_at to turfs' as message;
