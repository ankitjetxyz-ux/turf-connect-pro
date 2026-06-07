const supabase = require("../config/db");
const { sendMail, isSmtpConfigured } = require("../utils/mailTransport");
const { hashOTP, verifyOTPValue } = require("../utils/otpHash");
const crypto = require("crypto");

const OTP_CONFIG = {
  EXPIRY_MINUTES: 10,
};

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const invalidatePreviousOTPs = async (email, purpose) => {
  const { error } = await supabase
    .from("otp_verifications")
    .update({ is_used: true })
    .eq("email", email)
    .eq("purpose", purpose)
    .eq("is_used", false);

  if (error) {
    console.error("Invalidate OTPs error:", error);
  }
};

const buildOtpEmail = (otp, purpose) => {
  const isReset = purpose === "password_reset";
  const subject = isReset
    ? "Your TurfBook password reset code"
    : "Your TurfBook verification code";

  const text = `Your TurfBook verification code is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #2563eb;">${isReset ? "Password reset code" : "Verify your email"}</h2>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; text-align: center;">${otp}</p>
      <p style="color: #64748b; font-size: 14px; text-align: center;">Expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.</p>
    </div>
  `;

  return { subject, text, html };
};

const sendOTPEmail = async (email, otp, purpose) => {
  if (!isSmtpConfigured()) {
    return { success: false, error: "SMTP is not configured on the server" };
  }

  try {
    const template = buildOtpEmail(otp, purpose);
    await sendMail({
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    if (!["email_verification", "password_reset"].includes(purpose)) {
      return res.status(400).json({ error: "Invalid purpose" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!isSmtpConfigured()) {
      return res.status(503).json({
        error: "Email service is not configured. Please contact support.",
      });
    }

    if (purpose === "password_reset") {
      const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (!user) {
        return res.json({
          message: "If an account exists with this email, a code has been sent",
          purpose,
        });
      }
    }

    if (purpose === "email_verification") {
      const { data: existingUser } = await supabase
        .from("users")
        .select("email_verified")
        .eq("email", email)
        .maybeSingle();

      if (existingUser?.email_verified) {
        return res.status(400).json({
          error: "Email already registered. Please sign in instead.",
        });
      }
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    await invalidatePreviousOTPs(email, purpose);

    const { error: dbError } = await supabase.from("otp_verifications").insert({
      email,
      otp_hash: otpHash,
      purpose,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("Database error storing OTP:", dbError);
      return res.status(500).json({ error: "Failed to generate verification code" });
    }

    const emailResult = await sendOTPEmail(email, otp, purpose);

    if (!emailResult.success) {
      return res.status(503).json({
        error:
          "Could not send verification email. The mail server rejected the request — please try again shortly.",
        details:
          process.env.NODE_ENV === "development" ? emailResult.error : undefined,
      });
    }

    res.json({
      message:
        purpose === "password_reset"
          ? "If an account exists with this email, a code has been sent"
          : "Verification code sent — check your inbox and spam folder",
      purpose,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const { purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ error: "Email, code, and purpose are required" });
    }

    const { data: otpRecord, error: findError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !otpRecord) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);
      return res.status(400).json({ error: "Code expired. Click resend to get a new one." });
    }

    const isValid = await verifyOTPValue(otp, otpRecord.otp_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Incorrect code. Check your email and try again." });
    }

    if (purpose === "password_reset") {
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);

      await supabase
        .from("users")
        .update({
          password_reset_required: true,
          last_password_reset: new Date().toISOString(),
        })
        .eq("email", email);
    }

    res.json({ success: true, message: "Code verified successfully", purpose });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Failed to verify code" });
  }
};

exports.checkOTPStatus = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const { purpose } = req.query;

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    const { data: otpRecord, error } = await supabase
      .from("otp_verifications")
      .select("created_at, expires_at, is_used")
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return res.json({ hasActiveOTP: false });
    }

    const expiresIn = Math.max(
      0,
      Math.floor((new Date(otpRecord.expires_at) - Date.now()) / 1000 / 60),
    );

    return res.json({
      hasActiveOTP: true,
      expiresIn,
      createdAt: otpRecord.created_at,
    });
  } catch (err) {
    console.error("Check OTP status error:", err);
    res.status(500).json({ error: "Failed to check code status" });
  }
};
