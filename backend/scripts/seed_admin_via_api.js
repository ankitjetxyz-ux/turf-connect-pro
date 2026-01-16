require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabaseUrl = process.env.SUPABASE_URL;
// Try to use service role key if available for bypassing RLS, otherwise anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
    console.log('🌱 Attempting to seed Admin user via Supabase Client...');

    const adminEmail = 'admin@bookmyturf.com';
    const plainPassword = 'SecurePassword123!';

    try {
        // 1. Check if table exists by trying to select
        const { data: existing, error: selectError } = await supabase
            .from('admins')
            .select('id')
            .eq('email', adminEmail)
            .maybeSingle();

        if (selectError) {
            if (selectError.code === '42P01') { // Undefined table (Postgres) or similar from Supabase
                console.error('❌ Error: The "admins" table does not exist.');
                console.error('   Please run the SQL migration manually or add DATABASE_URL to .env');
                process.exit(1);
            }
            // If other error (e.g. permission denied), we might be blocked by RLS
            console.error('⚠️  Error checking admin:', selectError.message);
            // Fall through to try insert anyway, maybe we just can't read
        }

        if (existing) {
            console.log('ℹ️  Admin user already exists. Skipping seed.');
            return;
        }

        // 2. Insert Admin
        const hash = await bcrypt.hash(plainPassword, 10);

        const { data, error: insertError } = await supabase
            .from('admins')
            .insert([{
                email: adminEmail,
                password_hash: hash,
                name: 'System Administrator',
                role: 'admin',
                is_active: true
            }])
            .select();

        if (insertError) {
            console.error('❌ Failed to insert admin:', insertError.message);
            if (insertError.message.includes('permission denied')) {
                console.error('   (This is likely due to RLS policies. Make sure to use SERVICE_ROLE_KEY or disable RLS for admins table)');
            }
        } else {
            console.log('✅ Admin user created successfully!');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${plainPassword}`);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

seedAdmin();
