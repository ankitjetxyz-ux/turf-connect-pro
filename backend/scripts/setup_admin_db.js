require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Note: For schema changes, we ideally need SERVICE_ROLE_KEY or direct SQL access.
// Since we are using supabase-js client which uses PostgREST, we can't execute raw SQL directly 
// unless we use the .rpc() method with a stored procedure that executes SQL (if one exists),
// OR if we are just inserting data.
// However, standard supabase-js client doesn't support generic raw SQL execution for migrations 
// unless a specific stored procedure is set up.
//
// CHECK: Does the user have a way to run raw SQL? 
// The project uses `pg` package in package.json. We should use that for migrations if connection string is available.
// If not, we might fail. Let's check environment variables for connection string.
//
// Fallback: We will try to assume there is a DATABASE_URL or we can construct it if not present,
// but Supabase usually provides a connection string.

const { Client } = require('pg');

async function runMigration() {
    console.log('🚀 Starting Admin DB Setup...');

    if (!process.env.DATABASE_URL && (!process.env.SUPABASE_DB_PASSWORD || !process.env.SUPABASE_URL)) {
        console.error('❌ Error: DATABASE_URL or Supabase DB credentials not found in .env');
        console.log('   We need a direct PostgreSQL connection string to run schema migrations.');
        console.log('   Format: postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');

        // Attempt to construct if pieces are available (common with some setups)
        // console.log('   Attempting to continue with limited access or checking if tables exist...');
        process.exit(1);
    }

    // Use DATABASE_URL if available, otherwise try to check if we can construct it
    // For now, let's assume DATABASE_URL is in .env or the user has provided it.
    // If not, we'll try to use the `pg` client with typical Supabase connection params.

    let connectionString = process.env.DATABASE_URL;

    if (!connectionString && process.env.SUPABASE_URL) {
        // Try to extract project ref from URL to hint at connection string
        // https://[ref].supabase.co
        const ref = process.env.SUPABASE_URL.split('//')[1].split('.')[0];
        console.log(`ℹ️  Project Ref seems to be: ${ref}`);
        console.log('   Please ensure DATABASE_URL is set in .env for migrations.');
        // We can't easily guess the password.
    }

    if (!connectionString) {
        console.error('❌ DATABASE_URL is missing. Cannot run SQL migrations via pg client.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase/AWS RDS usually
    });

    try {
        await client.connect();
        console.log('✅ Connected to Database');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../config/admin_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL
        console.log('📦 Applying Schema Changes...');
        await client.query(sql);
        console.log('✅ Schema Applied Successfully');

        // Seed Admin User
        console.log('🌱 Seeding Admin User...');
        const adminEmail = 'admin@bookmyturf.com';
        const initialPassword = 'SecurePassword123!';

        // Check if admin exists
        const checkRes = await client.query('SELECT id FROM admins WHERE email = $1', [adminEmail]);

        if (checkRes.rows.length === 0) {
            const hash = await bcrypt.hash(initialPassword, 10);
            await client.query(
                `INSERT INTO admins (email, password_hash, name, role, is_active) 
             VALUES ($1, $2, $3, $4, $5)`,
                [adminEmail, hash, 'System Administrator', 'admin', true]
            );
            console.log(`✅ Admin user created: ${adminEmail}`);
            console.log(`🔑 Password: ${initialPassword}`);
        } else {
            console.log('ℹ️  Admin user already exists. Skipping seed.');
        }

        await client.end();
        console.log('✨ Admin DB Setup Complete!');

    } catch (err) {
        console.error('❌ Error executing migration:', err);
        if (client) await client.end();
        process.exit(1);
    }
}

runMigration();
