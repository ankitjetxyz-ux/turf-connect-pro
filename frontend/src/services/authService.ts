import api from "./api";

function normalizeEmail(email?: string) {
  return (email ?? "").trim().toLowerCase();
}

function normalizeOtp(otp?: string) {
  return (otp ?? "").trim();
}

// Send OTP with purpose (email_verification or password_reset)
export const sendOTP = (email: string, purpose: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return Promise.reject(new Error("Email is required"));
  }

  return api.post(
    "/auth/otp/send",
    { email: normalizedEmail, purpose },
    { timeout: 45_000 },
  );
};

// Verify OTP with purpose
export const verifyOTP = (email: string, otp: string, purpose: string) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = normalizeOtp(otp);
  if (!normalizedEmail || !normalizedOtp) {
    return Promise.reject(new Error("Email and verification code are required"));
  }

  return api.post(
    "/auth/otp/verify",
    { email: normalizedEmail, otp: normalizedOtp, purpose },
    { timeout: 30_000 },
  );
};

// Forgot password endpoint
export const forgotPassword = (email: string) => {
  return api.post("/auth/forgot-password", { email });
};

// Reset password endpoint
export const resetPassword = (email: string, otp: string, newPassword: string) => {
  return api.post("/auth/reset-password", { email, otp, newPassword });
};

// Register user
export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  otp: string;
}) => {
  const payload = new URLSearchParams();
  payload.append("name", data.name);
  payload.append("email", data.email);
  payload.append("password", data.password);
  payload.append("role", data.role);
  payload.append("otp", data.otp);
  return api.post("/auth/register", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// Google sign-in / sign-up (no SMTP required)
export const googleAuth = (data: {
  credential: string;
  name?: string;
  role?: "player" | "client";
  register?: boolean;
}) => {
  return api.post("/auth/google", data, { timeout: 30_000 });
};

// Login user
export const loginUser = (data: {
  email: string;
  password: string;
}) => {
  const payload = new URLSearchParams();
  payload.append("email", data.email);
  payload.append("password", data.password);
  return api.post("/auth/login", payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
