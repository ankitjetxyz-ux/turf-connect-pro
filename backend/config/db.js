require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

function cleanEnv(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = cleanEnv(process.env.SUPABASE_URL);

// Accept common env var names used across scripts / hosting panels
const serviceKey = cleanEnv(
  process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const anonKey = cleanEnv(
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY,
);

const hasServiceKey =
  serviceKey &&
  !serviceKey.includes("your-service-role-key") &&
  !serviceKey.includes("your-service-key") &&
  !serviceKey.includes("your-anon-key") &&
  serviceKey.length > 40;

const hasAnonKey =
  anonKey &&
  !anonKey.includes("your-anon-key") &&
  anonKey.length > 40;

// Prefer service role key on the server (bypasses RLS); fall back to anon key
const supabaseKey = hasServiceKey ? serviceKey : anonKey;

function buildConfigHints() {
  const hints = [];

  if (!supabaseUrl) {
    hints.push("Set SUPABASE_URL on Render (Supabase → Settings → API → Project URL).");
  } else if (/^postgres(ql)?:\/\//i.test(supabaseUrl)) {
    hints.push(
      "SUPABASE_URL is a Postgres connection string. Use the HTTPS API URL instead: https://YOUR_REF.supabase.co",
    );
  } else if (supabaseUrl.includes("pooler.supabase.com")) {
    hints.push(
      "SUPABASE_URL looks like a database pooler host. Use the Project URL: https://YOUR_REF.supabase.co",
    );
  } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)) {
    hints.push(
      `SUPABASE_URL looks wrong: "${supabaseUrl}". Expected https://YOUR_REF.supabase.co`,
    );
  }

  if (!supabaseKey) {
    hints.push(
      "Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_KEY on Render (Supabase → Settings → API).",
    );
  } else if (!hasServiceKey) {
    hints.push(
      "SUPABASE_SERVICE_KEY is missing or looks like a placeholder — add the service_role key on Render.",
    );
  }

  hints.push(
    "Open Supabase Dashboard and confirm the project is not Paused (free tier pauses after inactivity).",
  );

  return hints;
}

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required Supabase environment variables:");
  buildConfigHints().forEach((hint) => console.error(`   - ${hint}`));
  process.exit(1);
}

if (!hasServiceKey) {
  console.warn(
    "⚠️  SUPABASE_SERVICE_KEY not set — using anon key. Set the service_role key on Render to bypass RLS.",
  );
}

const normalizedUrl = supabaseUrl.replace(/\/$/, "");

const supabase = createClient(normalizedUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

/** Quick connectivity check for health endpoints and startup logs. */
async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from("turfs").select("id").limit(1);
    if (error) {
      return {
        ok: false,
        error: error.message,
        code: error.code || null,
        hints: buildConfigHints(),
      };
    }
    return { ok: true };
  } catch (err) {
    const cause = err.cause?.message || err.cause?.code || null;
    return {
      ok: false,
      error: err.message,
      code: cause,
      hints: buildConfigHints(),
    };
  }
}

module.exports = supabase;
module.exports.testSupabaseConnection = testSupabaseConnection;
module.exports.supabaseConfig = {
  url: normalizedUrl,
  usingServiceKey: hasServiceKey,
  hasAnonKey,
  hints: buildConfigHints(),
};
