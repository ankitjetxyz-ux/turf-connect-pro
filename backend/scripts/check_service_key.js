require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log("🔍 Checking Environment Variables...");

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("✅ SUPABASE_SERVICE_ROLE_KEY is Present.");
    console.log("   (First 5 chars): " + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + "...");
} else {
    console.log("❌ SUPABASE_SERVICE_ROLE_KEY is MISSING.");
    console.log("   The Admin Dashboard needs this to bypass Row Level Security (RLS).");
}

if (process.env.SUPABASE_ANON_KEY) {
    console.log("✅ SUPABASE_ANON_KEY is Present.");
} else {
    console.log("❌ SUPABASE_ANON_KEY is MISSING.");
}
