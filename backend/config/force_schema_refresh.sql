-- Force schema update for google_maps_url
DO $$ 
BEGIN 
    -- Check if column exists, if not add it. 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turfs' AND column_name='google_maps_url') THEN 
        ALTER TABLE turfs ADD COLUMN google_maps_url TEXT; 
    END IF;

    -- Also verify images_urls while we are at it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turfs' AND column_name='images_urls') THEN 
        ALTER TABLE turfs ADD COLUMN images_urls TEXT[]; 
    END IF;

    -- Verify verification_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turfs' AND column_name='verification_status') THEN 
        ALTER TABLE turfs ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending'; 
    END IF;
END $$;

-- Force notify Supabase schema cache
NOTIFY pgrst, 'reload schema';
