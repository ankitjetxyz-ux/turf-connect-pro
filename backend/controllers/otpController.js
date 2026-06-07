const supabase = require("../config/db");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// OTP Configuration — kept simple for registration
const OTP_CONFIG = {
  EXPIRY_MINUTES: 10,
  OTP_LENGTH: 6,
};

// Generate secure 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Hash OTP for secure storage
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

// Verify OTP against hash
const verifyOTP = async (otp, hash) => {
  try {
    return await bcrypt.compare(otp, hash);
  } catch (error) {
    return false;
  }
};

// Invalidate previous OTPs for same email and purpose
const invalidatePreviousOTPs = async (email, purpose) => {
  try {
    const { error } = await supabase
      .from("otp_verifications")
      .update({ is_used: true })
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Invalidate OTPs error:", error);
    return false;
  }
};

const generateEmailTemplate = (otp, purpose) => {
  const isReset = purpose === "password_reset";
  const subject = isReset
    ? "Reset Your Password - TurfBook"
    : "Your Verification Code - TurfBook";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #2563eb; margin-bottom: 8px;">${isReset ? "Password reset code" : "Verify your email"}</h2>
      <p style="color: #666; margin-bottom: 24px;">Use this code to continue on TurfBook:</p>
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px; margin-top: 16px; text-align: center;">
        Expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes. If you did not request this, you can ignore this email.
      </p>
    </div>
  `;

  return { subject, html };
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP credentials not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const template = generateEmailTemplate(otp, purpose);

    const mailOptions = {
      from: `"TurfBook" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: `Your OTP code is: ${otp}. This code will expire in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CONTROLLER METHODS
// ============================================

// Send OTP (for both email verification and password reset)
exports.sendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required" });
    }

    if (!["email_verification", "password_reset"].includes(purpose)) {
      return res.status(400).json({
        error: "Invalid purpose. Must be 'email_verification' or 'password_reset'",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (purpose === "password_reset") {
      const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      // Don't reveal if user doesn't exist for security
      if (!user) {
        // Still return success to prevent email enumeration
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay
        return res.json({
          message: "If an account exists with this email, an OTP has been sent",
          purpose: purpose
        });
      }
    }

    if (purpose === "email_verification") {
      const { data: existingUser } = await supabase
        .from("users")
        .select("email, email_verified")
        .eq("email", email)
        .maybeSingle();

      if (existingUser?.email_verified) {
        return res.status(400).json({
          error: "Email already registered. Please sign in instead.",
        });
      }
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.EXPIRY_MINUTES);

    await invalidatePreviousOTPs(email, purpose);

    const { error: dbError } = await supabase.from("otp_verifications").insert({
      email,
      otp_hash: otpHash,
      purpose,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("Database error storing OTP:", dbError);
      return res.status(500).json({ error: "Failed to generate OTP" });
    }

    const emailResult = await sendOTPEmail(email, otp, purpose);

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      return res.status(500).json({
        error: "Could not send verification email. Please try again in a moment.",
      });
    }

    res.json({
      message:
        purpose === "password_reset"
          ? "If an account exists with this email, a code has been sent"
          : "Verification code sent to your email",
      purpose,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES,
    });

  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({
      error: "Failed to send OTP",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({
        error: "Email, OTP, and purpose are required"
      });
    }

    if (!['email_verification', 'password_reset'].includes(purpose)) {
      return res.status(400).json({
        error: "Invalid purpose"
      });
    }

    // Find active OTP record
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
      return res.status(400).json({
        error: "Invalid or expired OTP"
      });
    }

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);

      return res.status(400).json({
        error: "Code expired. Click resend to get a new one.",
      });
    }

    const isValid = await verifyOTP(otp, otpRecord.otp_hash);

    if (!isValid) {
      return res.status(400).json({
        error: "Incorrect code. Check your email and try again.",
      });
    }

    if (purpose === "password_reset") {
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);

      const { error: resetError } = await supabase
        .from("users")
        .update({
          password_reset_required: true,
          last_password_reset: new Date().toISOString(),
        })
        .eq("email", email);

      if (resetError) {
        console.error("Failed to set password reset flag:", resetError);
      }
    }

    res.json({
      success: true,
      message: "Code verified successfully",
      purpose,
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({
      error: "Failed to verify code",
    });
  }
};

// Check OTP status
exports.checkOTPStatus = async (req, res) => {
  try {
    const { email, purpose } = req.query;

    if (!email || !purpose) {
      return res.status(400).json({
        error: "Email and purpose are required"
      });
    }

    const { data: otpRecord, error } = await supabase
      .from("otp_verifications")
      .select("created_at, expires_at, attempt_count, is_used")
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return res.json({
        hasActiveOTP: false
      });
    }

    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000 / 60)); // minutes

    return res.json({
      hasActiveOTP: true,
      expiresIn,
      createdAt: otpRecord.created_at,
    });

  } catch (err) {
    console.error("Check OTP status error:", err);
    res.status(500).json({
      error: "Failed to check OTP status"
    });
  }
};