const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const sqlKeyFix = `
-- Force schema update for google_maps_url (IDEMPOTENT)
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
`;

async function forceRefresh() {
    console.log('🔄 Connecting to DB to force schema refresh...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL is not defined in .env file');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        console.log('📝 Executing schema patch & reload...');
        await client.query(sqlKeyFix);

        console.log('✅ Schema refreshed successfully!');
        console.log('🚀 PostgREST should now recognize the new columns.');

    } catch (err) {
        console.error('❌ Failed:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected');
    }
}

forceRefresh();
