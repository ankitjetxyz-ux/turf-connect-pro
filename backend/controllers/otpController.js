const supabase = require("../config/db");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// OTP Configuration
const OTP_CONFIG = {
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 5,
  MAX_REQUESTS_PER_10MIN: 3,
  OTP_LENGTH: 6,
  RESEND_WAIT_MINUTES: 1
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

// Check rate limiting
const checkRateLimit = async (email, purpose) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const { data: recentRequests, error } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("email", email)
      .eq("purpose", purpose)
      .gte("created_at", tenMinutesAgo.toISOString());

    if (error) throw error;

    return recentRequests.length < OTP_CONFIG.MAX_REQUESTS_PER_10MIN;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return false;
  }
};

// Check resend eligibility
const canResendOTP = async (email, purpose) => {
  try {
    const oneMinuteAgo = new Date(Date.now() - OTP_CONFIG.RESEND_WAIT_MINUTES * 60 * 1000);

    const { data: recentOTP, error } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("email", email)
      .eq("purpose", purpose)
      .gte("created_at", oneMinuteAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    return recentOTP.length === 0;
  } catch (error) {
    console.error("Resend check error:", error);
    return true;
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

// Generate email template based on purpose
const generateEmailTemplate = (otp, purpose, userAgent = "", ipAddress = "") => {
  const templates = {
    email_verification: {
      subject: "Verify Your Email - Turf Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2563eb; margin-bottom: 10px;">Welcome to Turf Connect!</h2>
            <p style="color: #666;">Please verify your email address to complete your registration</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #2563eb; margin-bottom: 15px;">
              ${otp}
            </div>
            <div style="color: #64748b; font-size: 14px;">
              This code will expire in ${OTP_CONFIG.EXPIRY_MINUTES} minutes
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #64748b; font-size: 12px; margin-bottom: 10px;">
              <strong>Security Notice:</strong> This OTP was requested from:
            </p>
            <p style="color: #64748b; font-size: 12px; margin-bottom: 5px;">
              Device: ${userAgent || 'Unknown'}
            </p>
            <p style="color: #64748b; font-size: 12px;">
              IP Address: ${ipAddress || 'Not available'}
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px;">
              If you didn't request this verification, please ignore this email or contact support.
            </p>
            <p style="color: #94a3b8; font-size: 12px;">
              Do not share this code with anyone.
            </p>
          </div>
        </div>
      `
    },
    password_reset: {
      subject: "Reset Your Password - Turf Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #dc2626; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="color: #666;">You requested to reset your password</p>
          </div>
          
          <div style="background: #fef2f2; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #dc2626; margin-bottom: 15px;">
              ${otp}
            </div>
            <div style="color: #64748b; font-size: 14px;">
              Use this code to reset your password (expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes)
            </div>
          </div>
          
          <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⚠️ Important:</strong> If you didn't request a password reset, your account may be compromised. 
              Please secure your account immediately.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #64748b; font-size: 12px; margin-bottom: 10px;">
              <strong>Request Details:</strong>
            </p>
            <p style="color: #64748b; font-size: 12px; margin-bottom: 5px;">
              Device: ${userAgent || 'Unknown'}
            </p>
            <p style="color: #64748b; font-size: 12px;">
              IP Address: ${ipAddress || 'Not available'}
            </p>
          </div>
        </div>
      `
    }
  };

  return templates[purpose] || templates.email_verification;
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose, userAgent = "", ipAddress = "") => {
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

    const template = generateEmailTemplate(otp, purpose, userAgent, ipAddress);

    const mailOptions = {
      from: `"Turf Connect" <${process.env.SMTP_USER}>`,
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
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Validate input
    if (!email || !purpose) {
      return res.status(400).json({
        error: "Email and purpose are required",
        purpose: purpose
      });
    }

    if (!['email_verification', 'password_reset'].includes(purpose)) {
      return res.status(400).json({
        error: "Invalid purpose. Must be 'email_verification' or 'password_reset'"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check rate limiting
    const canProceed = await checkRateLimit(email, purpose);
    if (!canProceed) {
      return res.status(429).json({
        error: "Too many OTP requests. Please try again later.",
        retryAfter: "10 minutes"
      });
    }

    // Check resend eligibility
    const canResend = await canResendOTP(email, purpose);
    if (!canResend) {
      return res.status(429).json({
        error: `Please wait ${OTP_CONFIG.RESEND_WAIT_MINUTES} minute(s) before requesting a new OTP`,
        retryAfter: `${OTP_CONFIG.RESEND_WAIT_MINUTES} minute(s)`
      });
    }

    // For password reset, check if user exists (without revealing)
    if (purpose === 'password_reset') {
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

    // For email verification, check if user already exists
    if (purpose === 'email_verification') {
      const { data: existingUser } = await supabase
        .from("users")
        .select("email, email_verified")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.email_verified) {
          return res.status(400).json({
            error: "Email already registered and verified"
          });
        }
        // Allow resending verification for unverified emails
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.EXPIRY_MINUTES);

    // Invalidate previous OTPs
    await invalidatePreviousOTPs(email, purpose);

    // Store new OTP
    const { error: dbError } = await supabase
      .from("otp_verifications")
      .insert({
        email,
        otp_hash: otpHash,
        purpose,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress
      });

    if (dbError) {
      console.error("Database error storing OTP:", dbError);
      return res.status(500).json({ error: "Failed to generate OTP" });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, purpose, userAgent, ipAddress);

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      // Still return success to frontend but log the error
    }

    res.json({
      message: purpose === 'password_reset'
        ? "If an account exists with this email, an OTP has been sent"
        : "OTP sent to your email",
      purpose: purpose,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES,
      maxAttempts: OTP_CONFIG.MAX_ATTEMPTS
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
      // Mark as used to prevent further attempts
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);

      return res.status(400).json({
        error: "OTP has expired. Please request a new one."
      });
    }

    // Check attempt count
    if (otpRecord.attempt_count >= OTP_CONFIG.MAX_ATTEMPTS) {
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);

      return res.status(400).json({
        error: "Too many failed attempts. OTP has been invalidated."
      });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otp_hash);

    if (!isValid) {
      // Increment attempt count
      await supabase
        .from("otp_verifications")
        .update({
          attempt_count: otpRecord.attempt_count + 1
        })
        .eq("id", otpRecord.id);

      const attemptsLeft = OTP_CONFIG.MAX_ATTEMPTS - (otpRecord.attempt_count + 1);

      return res.status(400).json({
        error: "Invalid OTP",
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
      });
    }

    // OTP is valid
    // For password_reset: mark as used immediately (one-time use for password reset)
    // For email_verification: DON'T mark as used yet - registration endpoint will mark it
    if (purpose === 'password_reset') {
      await supabase
        .from("otp_verifications")
        .update({
          is_used: true,
          attempt_count: otpRecord.attempt_count + 1
        })
        .eq("id", otpRecord.id);
    } else {
      // For email_verification, just increment attempt count but keep is_used = false
      await supabase
        .from("otp_verifications")
        .update({
          attempt_count: otpRecord.attempt_count + 1
        })
        .eq("id", otpRecord.id);
    }

    // DO NOT update user record here for email verification
    // The registration endpoint will handle that after successful registration

    // For password reset: generate reset token (or we can just return success)
    if (purpose === 'password_reset') {
      // Set flag for password reset
      const { error: resetError } = await supabase
        .from("users")
        .update({
          password_reset_required: true,
          last_password_reset: new Date().toISOString()
        })
        .eq("email", email);

      if (resetError) {
        console.error("Failed to set password reset flag:", resetError);
      }
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
      purpose: purpose,
      verifiedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({
      error: "Failed to verify OTP"
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        error: "Email and purpose are required"
      });
    }

    // Check if we can resend
    const canResend = await canResendOTP(email, purpose);

    if (!canResend) {
      return res.status(429).json({
        error: `Please wait ${OTP_CONFIG.RESEND_WAIT_MINUTES} minute(s) before requesting a new OTP`
      });
    }

    // Call the sendOTP function
    return this.sendOTP(req, res);

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({
      error: "Failed to resend OTP"
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
      expiresIn: expiresIn,
      attemptsUsed: otpRecord.attempt_count,
      attemptsLeft: OTP_CONFIG.MAX_ATTEMPTS - otpRecord.attempt_count,
      createdAt: otpRecord.created_at
    });

  } catch (err) {
    console.error("Check OTP status error:", err);
    res.status(500).json({
      error: "Failed to check OTP status"
    });
  }
};