require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const hasServiceKey =
  serviceKey && !serviceKey.includes("your-service-role-key");

// Prefer service role key on the server (bypasses RLS); fall back to anon key
const supabaseKey = hasServiceKey
  ? serviceKey
  : process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!process.env.SUPABASE_URL || !supabaseKey) {
  console.error("❌ Missing required Supabase environment variables:");
  if (!process.env.SUPABASE_URL) console.error("   - SUPABASE_URL is required");
  if (!supabaseKey) {
    console.error(
      "   - SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY) is required",
    );
  }
  console.error("   Please check your .env file and ensure all variables are set.");
  process.exit(1);
}

// Create Supabase client with validated environment variables
const supabase = createClient(process.env.SUPABASE_URL, supabaseKey, {
  auth: {
    persistSession: false, // Server-side, no session persistence needed
  },
});

module.exports = supabase;
