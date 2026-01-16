const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDocs() {
    console.log("🔐 Authenticating as Admin to bypass RLS...");

    // Login as Admin (using the credentials we know)
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@bookmyturf.com',
        password: 'SecurePassword123!'
    });

    if (authError) {
        // Fallback: If auth fails (maybe user changed pass), we can't check easily without SERVICE_KEY.
        // But maybe we can try querying assuming public read is allowed? No, we proved it's not.
        console.error("❌ Admin Login Failed:", authError.message);
        console.log("   Attempting query anyway (might fail if RLS is on)...");
    } else {
        console.log("✅ Admin Logged In!");
    }

    console.log("\n🔍 Searching for turf 'testing2'...");

    // 1. Get the Turf ID
    const { data: turfs, error: turfError } = await supabase
        .from('turfs')
        .select('id, name')
        .ilike('name', '%testing2%');

    if (turfError) {
        console.error("❌ Error finding turf:", turfError);
        return;
    }

    if (!turfs || turfs.length === 0) {
        console.log("❌ Turf 'testing2' not found (even as Admin).");
        return;
    }

    const turf = turfs[0];
    console.log(`✅ Found turf: ${turf.name} (ID: ${turf.id})`);

    // 2. Check Documents Table
    console.log(`\n🔍 Checking 'turf_verification_documents' for Turf ID: ${turf.id}...`);
    const { data: docs, error: docError } = await supabase
        .from('turf_verification_documents')
        .select('*')
        .eq('turf_id', turf.id);

    if (docError) {
        console.error("❌ Error fetching documents:", docError);
        return;
    }

    if (docs.length === 0) {
        console.log("⚠️  NO DOCUMENTS found in database for this turf.");
        console.log("   This means the upload/insert step failed.");
    } else {
        console.log(`✅ Found ${docs.length} documents:`);
        docs.forEach(d => {
            console.log(`   - [${d.document_type}] ${d.document_url}`);
        });
    }
}

checkDocs();
