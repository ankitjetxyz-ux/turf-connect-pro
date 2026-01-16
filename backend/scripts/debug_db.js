const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugDB() {
    console.log("🔍 Debugging Database Data...");

    // 1. Count Turfs
    const { count: turfCount, error: countError } = await supabase
        .from('turfs')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("❌ Error counting turfs:", countError.message);
    } else {
        console.log(`✅ Total Turfs in DB: ${turfCount}`);
    }

    // 2. List Top 5 Turfs (any status)
    const { data: turfs, error: turfError } = await supabase
        .from('turfs')
        .select('id, name, verification_status')
        .order('created_at', { ascending: false })
        .limit(5);

    if (turfError) {
        console.error("❌ Error fetching turfs:", turfError.message);
    } else {
        console.log("📝 Latest 5 Turfs:");
        turfs.forEach(t => console.log(`   - ${t.name} [${t.verification_status}] (ID: ${t.id})`));
    }

    // 3. Count Documents
    const { count: docCount, error: docCountError } = await supabase
        .from('turf_verification_documents')
        .select('*', { count: 'exact', head: true });

    if (docCountError) {
        console.error("❌ Error counting documents:", docCountError.message);
    } else {
        console.log(`✅ Total Documents in DB: ${docCount}`);
    }

    // 4. List Top 5 Documents
    const { data: docs, error: docError } = await supabase
        .from('turf_verification_documents')
        .select('id, document_type, document_url, turf_id')
        .limit(5);

    if (docError) {
        console.error("❌ Error fetching documents:", docError.message);
    } else {
        console.log("📝 Sample Documents:");
        docs.forEach(d => console.log(`   - ${d.document_type} (Turf: ${d.turf_id})`));
    }
}

debugDB();
