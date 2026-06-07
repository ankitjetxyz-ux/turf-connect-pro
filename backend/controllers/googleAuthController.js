const crypto = require("crypto");
const bcrypt = require("bcrypt");
const supabase = require("../config/db");
const { verifyGoogleIdToken, isGoogleAuthConfigured } = require("../utils/googleAuth");
const { issueSessionTokens } = require("../utils/authTokens");
const { sendWelcomeEmail } = require("../services/emailService");

const ALLOWED_ROLES = ["player", "client"];

function sanitizeUser(user) {
  if (!user) return user;
  const { password: _password, ...rest } = user;
  return rest;
}

function isDuplicateKeyError(error) {
  const message = String(error?.message || error?.details || "");
  return error?.code === "23505" || /duplicate key|unique constraint/i.test(message);
}

async function findUserByGoogleId(googleId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("google_id", googleId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error && /google_id/i.test(error.message || "")) {
    return { user: null, schemaError: error };
  }

  return { user: data, error };
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  return { user: data, error };
}

async function linkGoogleToUser(user, googleId, picture) {
  const updates = {
    google_id: googleId,
    auth_provider: user.auth_provider === "email" ? "email" : "google",
    email_verified: true,
    email_verified_at: user.email_verified_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (picture && !user.profile_image_url) {
    updates.profile_image_url = picture;
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  return { user: data, error };
}

exports.googleAuth = async (req, res) => {
  try {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({
        error: "Google sign-in is not configured on the server",
      });
    }

    const credential = String(req.body.credential || req.body.idToken || "").trim();
    const name = String(req.body.name || "").trim();
    const role = req.body.role;
    const isRegistration = Boolean(req.body.register);

    if (!credential) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(credential);
    } catch (err) {
      console.error("Google token verification failed:", err.message);
      return res.status(401).json({ error: "Invalid or expired Google sign-in. Please try again." });
    }

    const { googleId, email, name: googleName, picture } = googleUser;
    const displayName = name || googleName;

    const byGoogle = await findUserByGoogleId(googleId);
    if (byGoogle.schemaError) {
      return res.status(503).json({
        error: "Google sign-in requires a database update. Run backend/config/migration_google_auth.sql in Supabase.",
      });
    }

    const byEmail = await findUserByEmail(email);
    if (byEmail.error) {
      console.error("Google auth email lookup error:", byEmail.error);
      return res.status(500).json({ error: "Failed to look up account" });
    }

    // One Gmail = one account — block duplicate registration
    if (isRegistration) {
      if (byGoogle.user || byEmail.user) {
        return res.status(409).json({
          error: "An account with this Gmail already exists. Please sign in instead.",
          code: "EMAIL_ALREADY_REGISTERED",
        });
      }

      if (!displayName || displayName.length < 2) {
        return res.status(400).json({ error: "Full name is required (at least 2 characters)" });
      }

      const userRole = role || "player";
      if (!ALLOWED_ROLES.includes(userRole)) {
        return res.status(400).json({ error: "Invalid role. Choose Player or Turf Owner." });
      }

      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        12,
      );

      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            name: displayName,
            email,
            password: randomPassword,
            role: userRole,
            google_id: googleId,
            auth_provider: "google",
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            profile_image_url: picture,
            has_login_password: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (insertError) {
        if (isDuplicateKeyError(insertError)) {
          return res.status(409).json({
            error: "An account with this Gmail already exists. Please sign in instead.",
            code: "EMAIL_ALREADY_REGISTERED",
          });
        }
        if (/google_id/i.test(insertError.message || "")) {
          return res.status(503).json({
            error: "Google sign-in requires a database update. Run backend/config/migration_google_auth.sql in Supabase.",
          });
        }
        console.error("Google registration error:", insertError);
        return res.status(500).json({ error: "Registration failed", details: insertError.message });
      }

      sendWelcomeEmail(email, displayName).catch(() => {});

      const session = await issueSessionTokens(created, req);
      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        isNewUser: true,
        ...session,
        user: sanitizeUser(session.user),
      });
    }

    // Login — find existing account by Google ID or email
    let user = byGoogle.user || byEmail.user;

    if (!user) {
      return res.status(404).json({
        error: "No account found with this Gmail. Please register first.",
        code: "ACCOUNT_NOT_FOUND",
      });
    }

    if (user.google_id && user.google_id !== googleId) {
      return res.status(409).json({
        error: "This Gmail is linked to a different Google account.",
        code: "GOOGLE_ACCOUNT_MISMATCH",
      });
    }

    if (!user.google_id) {
      const { user: linked, error: linkError } = await linkGoogleToUser(user, googleId, picture);
      if (linkError) {
        if (isDuplicateKeyError(linkError)) {
          return res.status(409).json({
            error: "An account with this Gmail already exists. Please sign in instead.",
            code: "EMAIL_ALREADY_REGISTERED",
          });
        }
        console.error("Google account link error:", linkError);
        return res.status(500).json({ error: "Failed to link Google account" });
      }
      user = linked;
    }

    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const session = await issueSessionTokens(user, req);

    res.json({
      success: true,
      message: "Signed in with Google",
      isNewUser: false,
      ...session,
      user: sanitizeUser(session.user),
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google sign-in failed" });
  }
};
