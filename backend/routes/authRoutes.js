const express = require("express");
const router = express.Router();

// Import controllers
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  changePassword
} = require("../controllers/authController");

const {
  sendOTP,
  verifyOTP,
  resendOTP,
  checkOTPStatus
} = require("../controllers/otpController");

// Import middleware from authMiddleware.js
const { verifyToken } = require("../middleware/authMiddleware");

// Rate limiting
const rateLimit = require("express-rate-limit");

const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 requests per windowMs
  message: {
    success: false,
    error: "Too many OTP requests. Please try again later.",
    retryAfter: "10 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per windowMs
  message: {
    success: false,
    error: "Too many login attempts. Please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// PUBLIC ROUTES
// ============================================

// OTP Routes
router.post("/otp/send", otpRateLimiter, sendOTP);
router.post("/otp/verify", verifyOTP);
router.post("/otp/resend", otpRateLimiter, resendOTP);
router.get("/otp/status", checkOTPStatus);

// Auth Routes
router.post("/register", register);
router.post("/login", authRateLimiter, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================
router.post("/logout", verifyToken, logout);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;