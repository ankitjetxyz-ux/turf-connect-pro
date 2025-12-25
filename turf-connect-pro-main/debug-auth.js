require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAuth() {
  console.log("--- STARTING DB DIAGNOSTIC ---");
  console.log("Supabase URL:", process.env.SUPABASE_URL);

  // 1. Test SELECT (Read access)
  console.log("\n1. Testing SELECT from 'users'...");
  const { data: users, error: selectError } = await supabase
    .from("users")
    .select("id, email, role")
    .limit(5);

  if (selectError) {
    console.error("❌ SELECT Failed:", selectError.message);
    console.error("   Hint: RLS might be blocking read access for anon key.");
  } else {
    console.log("✅ SELECT Success. Found", users.length, "users.");
    if (users.length > 0) {
        console.log("   Sample user roles:", users.map(u => u.role));
    }
  }

  // 2. Test INSERT (Write access)
  const testEmail = `test_${Date.now()}@example.com`;
  console.log(`\n2. Testing INSERT into 'users' with email: ${testEmail}...`);
  
  const { data: insertData, error: insertError } = await supabase
    .from("users")
    .insert([
      {
        name: "Test User",
        email: testEmail,
        password: "hashedpassword123", // Dummy hash
        role: "player"
      }
    ])
    .select();

  if (insertError) {
    console.error("❌ INSERT Failed:", insertError.message);
    console.error("   Hint: RLS might be blocking write access for anon key.");
  } else {
    console.log("✅ INSERT Success. New ID:", insertData[0].id);

    // 3. Test DELETE (Cleanup)
    console.log("\n3. Testing DELETE (Cleanup)...");
    const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", insertData[0].id);
    
    if (deleteError) {
        console.error("❌ DELETE Failed:", deleteError.message);
    } else {
        console.log("✅ DELETE Success.");
    }
  }

  console.log("\n--- DIAGNOSTIC COMPLETE ---");
}

testAuth();
