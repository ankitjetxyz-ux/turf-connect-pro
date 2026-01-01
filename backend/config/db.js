const { createClient } = require("@supabase/supabase-js");

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ Missing required Supabase environment variables:");
  if (!process.env.SUPABASE_URL) console.error("   - SUPABASE_URL is required");
  if (!process.env.SUPABASE_ANON_KEY) console.error("   - SUPABASE_ANON_KEY is required");
  console.error("   Please check your .env file and ensure all variables are set.");
  process.exit(1);
}

// Create Supabase client with validated environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // Server-side, no session persistence needed
    },
  }
);

module.exports = supabase;
