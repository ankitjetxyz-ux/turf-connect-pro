/**
 * Deletes ALL row data from public app tables (preserves schema).
 * Run: node scripts/truncate_all_data.js
 */
require("dotenv").config();
const supabase = require("../config/db");

const TABLES_IN_DELETE_ORDER = [
  "messages",
  "chat_favorites",
  "chats",
  "booking_verification_codes",
  "payments",
  "bookings",
  "slots",
  "slot_templates",
  "tournament_participants",
  "tournaments",
  "turf_comments",
  "turf_gallery",
  "turf_testimonials",
  "reviews",
  "turf_reviews",
  "turf_verification_history",
  "turf_verification_documents",
  "owner_notifications",
  "activity_logs",
  "bookmarks",
  "promotional_videos",
  "turfs",
  "earnings",
  "contact_messages",
  "user_sessions",
  "otp_verifications",
  "admins",
  "users",
];

async function clearTable(table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    if (
      error.message.includes("Could not find the table") ||
      error.code === "PGRST205"
    ) {
      console.log(`⏭️  Skipped ${table} (table not found)`);
      return 0;
    }
    throw new Error(`${table}: ${error.message}`);
  }

  console.log(`✅ Cleared ${table} (${count ?? 0} rows)`);
  return count ?? 0;
}

async function main() {
  console.log("🗑️  Deleting all users and app data...\n");

  let total = 0;
  for (const table of TABLES_IN_DELETE_ORDER) {
    total += await clearTable(table);
  }

  console.log(`\n✨ Done. Removed approximately ${total} rows.`);
  console.log("Tables and schema are unchanged — only data was deleted.");
  console.log("\nTo restore admin access, run:");
  console.log("  node scripts/setup_admin_db.js");
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
