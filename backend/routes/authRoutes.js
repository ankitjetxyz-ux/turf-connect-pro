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

const { googleAuth } = require("../controllers/googleAuthController");

const {
  sendOTP,
  verifyOTP,
  checkOTPStatus
} = require("../controllers/otpController");

// Import middleware from authMiddleware.js
const { verifyToken } = require("../middleware/authMiddleware");

const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: "Too many login attempts. Please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Routes (no rate limiter — registration should stay simple)
router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);
router.post("/otp/resend", sendOTP);
router.get("/otp/status", checkOTPStatus);

// Auth Routes
router.post("/google", googleAuth);
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