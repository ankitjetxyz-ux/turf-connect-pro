require("dotenv").config();
const supabase = require("../config/db");

async function testSupabase() {
  console.log("Testing Supabase Connection...");
  try {
    const start = Date.now();
    const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true });
    const duration = Date.now() - start;

    if (error) {
      console.error("❌ Supabase Error:", error.message);
    } else {
      console.log(`✅ Supabase Connected! Duration: ${duration}ms`);
      console.log("Data:", data);
    }
  } catch (err) {
    console.error("❌ Exception:", err.message);
  }
}

testSupabase();
