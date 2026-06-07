/**
 * Run locally to verify Supabase credentials before deploying to Render:
 *   cd backend && node scripts/test_supabase_connection.js
 */
require("dotenv").config();
const {
  testSupabaseConnection,
  supabaseConfig,
} = require("../config/db");

(async () => {
  console.log("Supabase URL:", supabaseConfig.url);
  console.log("Using service key:", supabaseConfig.usingServiceKey);
  console.log("");

  const result = await testSupabaseConnection();
  if (result.ok) {
    console.log("✅ Supabase connected successfully");
    process.exit(0);
  }

  console.error("❌ Supabase connection failed");
  console.error("Error:", result.error);
  if (result.code) console.error("Code:", result.code);
  console.error("");
  console.error("Hints:");
  (result.hints || []).forEach((hint) => console.error(`  - ${hint}`));
  process.exit(1);
})();
