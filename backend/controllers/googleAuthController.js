const crypto = require("crypto");
const bcrypt = require("bcrypt");
const supabase = require("../config/db");
const { verifyGoogleIdToken, isGoogleAuthConfigured } = require("../utils/googleAuth");
const { issueSessionTokens } = require("../utils/authTokens");
const { sendWelcomeEmail } = require("../services/emailService");
const { validateLoginPassword } = require("../utils/passwordValidation");

const ALLOWED_ROLES = ["player", "client"];

function userNeedsLoginPassword(user) {
  return user?.has_login_password === false;
}

function sanitizeUser(user) {
  if (!user) return user;
  const { password: _password, ...rest } = user;
  return rest;
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

    let { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("google_id", googleId)
      .is("deleted_at", null)
      .maybeSingle();

    if (findError && /google_id/i.test(findError.message || "")) {
      return res.status(503).json({
        error: "Google sign-in requires a database update. Run backend/config/migration_google_auth.sql in Supabase.",
      });
    }

    if (!user) {
      const { data: byEmail, error: emailError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .is("deleted_at", null)
        .maybeSingle();

      if (emailError) {
        console.error("Google auth lookup error:", emailError);
        return res.status(500).json({ error: "Failed to look up account" });
      }

      user = byEmail;

      if (user) {
        const updates = {
          google_id: googleId,
          auth_provider: "google",
          email_verified: true,
          email_verified_at: user.email_verified_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (picture && !user.profile_image_url) {
          updates.profile_image_url = picture;
        }

        const { data: linked, error: linkError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id)
          .select("*")
          .single();

        if (linkError) {
          if (/google_id/i.test(linkError.message || "")) {
            return res.status(503).json({
              error: "Google sign-in requires a database update. Run backend/config/migration_google_auth.sql in Supabase.",
            });
          }
          console.error("Google account link error:", linkError);
          return res.status(500).json({ error: "Failed to link Google account" });
        }

        user = linked;
      }
    }

    if (!user) {
      if (!isRegistration) {
        return res.status(404).json({
          error: "No account found with this Google email. Please register first.",
          code: "ACCOUNT_NOT_FOUND",
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
        if (/google_id/i.test(insertError.message || "")) {
          return res.status(503).json({
            error: "Google sign-in requires a database update. Run backend/config/migration_google_auth.sql in Supabase.",
          });
        }
        console.error("Google registration error:", insertError);
        return res.status(500).json({ error: "Registration failed", details: insertError.message });
      }

      user = created;
      sendWelcomeEmail(email, displayName).catch(() => {});

      const session = await issueSessionTokens(user, req);
      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        isNewUser: true,
        needsLoginPassword: true,
        ...session,
        user: sanitizeUser(session.user),
      });
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
      needsLoginPassword: userNeedsLoginPassword(user),
      ...session,
      user: sanitizeUser(session.user),
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google sign-in failed" });
  }
};

async function updateUserLoginPassword(userId, password) {
  const passwordError = validateLoginPassword(password);
  if (passwordError) {
    return { error: passwordError, status: 400 };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const { data: updated, error } = await supabase
    .from("users")
    .update({
      password: hashedPassword,
      has_login_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, email, name, role, has_login_password")
    .single();

  if (error) {
    if (/has_login_password/i.test(error.message || "")) {
      return {
        error: "Run backend/config/migration_google_auth.sql in Supabase to enable manual login passwords.",
        status: 503,
      };
    }
    console.error("Set login password error:", error);
    return { error: "Failed to save password", status: 500 };
  }

  return { user: updated };
}

/** Set password using Google verification (login page, no session yet). */
exports.setLoginPasswordViaGoogle = async (req, res) => {
  try {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({ error: "Google sign-in is not configured on the server" });
    }

    const credential = String(req.body.credential || "").trim();
    const password = String(req.body.password || "");

    if (!credential || !password) {
      return res.status(400).json({ error: "Google verification and password are required" });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(credential);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired Google sign-in. Please try again." });
    }

    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", googleUser.email)
      .is("deleted_at", null)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({ error: "No account found for this Google email. Register first." });
    }

    const result = await updateUserLoginPassword(user.id, password);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Login password saved. You can now sign in with your email and password.",
      email: user.email,
    });
  } catch (err) {
    console.error("Set login password via Google error:", err);
    res.status(500).json({ error: "Failed to set login password" });
  }
};

/** Set password when already signed in (e.g. right after Google login). */
exports.setLoginPassword = async (req, res) => {
  try {
    const password = String(req.body.password || "");
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await updateUserLoginPassword(userId, password);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Login password saved. You can sign in manually on any device.",
    });
  } catch (err) {
    console.error("Set login password error:", err);
    res.status(500).json({ error: "Failed to set login password" });
  }
};
