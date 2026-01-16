const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrationFile = path.join(__dirname, '../config/owner_verification_migration.sql');

async function runMigration() {
    console.log('Starting Owner Verification System Migration...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL is not defined in .env file');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase/most cloud DBs
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log('📝 Reading migration file...');

        await client.query(sql);
        console.log('✅ Migration executed successfully!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected');
    }
}

runMigration();
