const supabase = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ============================================
// REGISTER USER
// ============================================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    // Validation
    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        error: "Name, email, password, and OTP are required"
      });
    }

    // Validate role
    const allowedRoles = ["player", "client", "admin"];
    const userRole = role || "player";
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        error: "Invalid role. Must be 'player' or 'client'."
      });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    // Check password complexity (optional but recommended)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        error: "Password must contain uppercase, lowercase, and numbers"
      });
    }

    // Verify OTP before registration (using new otp_verifications table)
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("purpose", "email_verification")
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return res.status(400).json({
        error: "No valid OTP found. Please request a new verification code."
      });
    }

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (now > expiresAt) {
      // Mark as used
      await supabase
        .from("otp_verifications")
        .update({ is_used: true })
        .eq("id", otpRecord.id);

      return res.status(400).json({
        error: "OTP has expired. Please request a new verification code."
      });
    }

    // Verify OTP matches
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValidOTP) {
      // Increment attempt count
      await supabase
        .from("otp_verifications")
        .update({
          attempt_count: otpRecord.attempt_count + 1
        })
        .eq("id", otpRecord.id);

      const attemptsLeft = 5 - (otpRecord.attempt_count + 1);

      return res.status(400).json({
        error: "Invalid OTP",
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email, email_verified")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Check user error:", checkError);
      return res.status(500).json({
        error: "Database error checking user"
      });
    }

    if (existingUser) {
      if (existingUser.email_verified) {
        return res.status(400).json({
          error: "User already exists with this email"
        });
      } else {
        // If user exists but email not verified, delete old record
        await supabase
          .from("users")
          .delete()
          .eq("email", email);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{
        name,
        email,
        password: hashedPassword,
        role: userRole,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id, name, email, role, email_verified, created_at');

    if (insertError) {
      console.error("User creation error:", insertError);
      return res.status(500).json({
        error: "Registration failed",
        details: insertError.message
      });
    }

    // Mark OTP as used
    await supabase
      .from("otp_verifications")
      .update({
        is_used: true,
        attempt_count: otpRecord.attempt_count + 1
      })
      .eq("id", otpRecord.id);

    // Send welcome email
    await sendWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser[0],
      note: "You can now sign in with your credentials"
    });

  } catch (err) {
    console.error("Register exception:", err);
    res.status(500).json({
      error: "Registration failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// LOGIN USER
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format"
      });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("deleted_at", null) // Exclude soft-deleted users
      .single();

    if (userError || !user) {
      // Use consistent error message for security (don't reveal if user exists)
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Check if email is verified (for new registrations)
    if (!user.email_verified) {
      return res.status(401).json({
        error: "Please verify your email before logging in"
      });
    }

    // Check if account is locked (for too many failed attempts)
    if (user.failed_login_attempts >= 5) {
      const lockTime = new Date(user.last_failed_login);
      const unlockTime = new Date(lockTime.getTime() + 15 * 60 * 1000); // 15 minutes

      if (new Date() < unlockTime) {
        return res.status(401).json({
          error: "Account temporarily locked. Try again in 15 minutes."
        });
      } else {
        // Reset failed attempts after lock period
        await supabase
          .from("users")
          .update({ failed_login_attempts: 0 })
          .eq("id", user.id);
      }
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment failed login attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;

      await supabase
        .from("users")
        .update({
          failed_login_attempts: newAttempts,
          last_failed_login: new Date().toISOString()
        })
        .eq("id", user.id);

      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Reset failed login attempts on successful login
    await supabase
      .from("users")
      .update({
        failed_login_attempts: 0,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: "7d" } // Longer expiry for better UX
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
      { expiresIn: "30d" }
    );

    // Store refresh token in database (optional)
    await supabase
      .from("user_sessions")
      .insert({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        user_agent: req.headers['user-agent'],
        ip_address: req.ip
      });

    // Remove password from response
    const { password: _, failed_login_attempts, ...userWithoutSensitiveData } = user;

    res.json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: userWithoutSensitiveData,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    });

  } catch (err) {
    console.error("Login exception:", err);
    res.status(500).json({
      error: "Login failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// FORGOT PASSWORD
// ============================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    // Always return success to prevent email enumeration
    // The actual OTP sending is handled by the OTP controller

    res.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset OTP",
      note: "Check your email for the verification code"
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      error: "Failed to process password reset request",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// RESET PASSWORD
// ============================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        error: "Email, OTP, and new password are required"
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        error: "Password must contain uppercase, lowercase, and numbers"
      });
    }

    // Verify OTP using the OTP controller logic
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("purpose", "password_reset")
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return res.status(400).json({
        error: "Invalid or expired OTP. Please request a new one."
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
        error: "OTP has expired. Please request a new one."
      });
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValidOTP) {
      // Increment attempt count
      await supabase
        .from("otp_verifications")
        .update({
          attempt_count: otpRecord.attempt_count + 1
        })
        .eq("id", otpRecord.id);

      const attemptsLeft = 5 - (otpRecord.attempt_count + 1);

      return res.status(400).json({
        error: "Invalid OTP",
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
      });
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !user) {
      // Don't reveal if user doesn't exist
      return res.status(400).json({
        error: "Invalid request"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        password_reset_required: false,
        last_password_reset: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    // Mark OTP as used
    await supabase
      .from("otp_verifications")
      .update({
        is_used: true,
        attempt_count: otpRecord.attempt_count + 1
      })
      .eq("id", otpRecord.id);

    // Send password change confirmation email
    await sendPasswordChangeEmail(email);

    res.json({
      success: true,
      message: "Password has been reset successfully",
      note: "You can now sign in with your new password"
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      error: "Failed to reset password",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token is required"
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production'
    );

    // Check if refresh token exists in database
    const { data: session, error } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !session) {
      return res.status(401).json({
        error: "Invalid refresh token"
      });
    }

    // Check if session is expired
    if (new Date() > new Date(session.expires_at)) {
      // Delete expired session
      await supabase
        .from("user_sessions")
        .delete()
        .eq("refresh_token", refreshToken);

      return res.status(401).json({
        error: "Refresh token expired"
      });
    }

    // Get user data
    const { data: user } = await supabase
      .from("users")
      .select("id, role, email")
      .eq("id", session.user_id)
      .single();

    if (!user) {
      return res.status(401).json({
        error: "User not found"
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token: newToken,
      expiresIn: 7 * 24 * 60 * 60
    });

  } catch (err) {
    console.error("Refresh token error:", err);

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: "Invalid refresh token"
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: "Refresh token expired"
      });
    }

    res.status(500).json({
      error: "Failed to refresh token"
    });
  }
};

// ============================================
// LOGOUT
// ============================================
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete the session from database
      await supabase
        .from("user_sessions")
        .delete()
        .eq("refresh_token", refreshToken);
    }

    res.json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      error: "Failed to logout"
    });
  }
};

// ============================================
// CHANGE PASSWORD (for logged-in users)
// ============================================
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required"
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters long"
      });
    }

    // Get user with current password
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("password")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Current password is incorrect"
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        error: "New password cannot be same as current password"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    // Send password change email
    await sendPasswordChangeEmail(req.user.email);

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      error: "Failed to change password"
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    await transporter.sendMail({
      from: `"Turf Connect" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to Turf Connect! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Turf Connect, ${name}!</h2>
          <p>Thank you for registering with Turf Connect. Your account has been successfully created.</p>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Get Started:</h3>
            <ul style="color: #374151;">
              <li>Browse and book sports turfs in your area</li>
              <li>Manage your bookings from your dashboard</li>
              <li>Connect with other players and turf owners</li>
              <li>Receive special offers and discounts</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #6b7280; font-size: 12px;">
              If you have any questions, contact our support team at support@turfconnect.com
            </p>
          </div>
        </div>
      `
    });

  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // Don't throw error - registration should still succeed
  }
};

// Send password change confirmation email
const sendPasswordChangeEmail = async (email) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    await transporter.sendMail({
      from: `"Turf Connect" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Changed Successfully - Turf Connect",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Password Changed Successfully</h2>
          <p>Your Turf Connect account password was recently changed.</p>
          
          <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              <strong>✅ Change confirmed:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact our support team immediately.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #6b7280; font-size: 12px;">
              This is an automated security notification from Turf Connect.
            </p>
          </div>
        </div>
      `
    });

  } catch (error) {
    console.error("Failed to send password change email:", error);
  }
};

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

// Verify JWT middleware
exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token required"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: "Token expired"
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: "Invalid token"
      });
    }

    res.status(500).json({
      error: "Token verification failed"
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions"
      });
    }

    next();
  };
};

// Check email verification middleware
exports.requireEmailVerification = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email_verified")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: "Email verification required"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      error: "Verification check failed"
    });
  }
};