import api from "./api";

// Send OTP with purpose (email_verification or password_reset)
export const sendOTP = (email: string, purpose: string) => {
  return api.post("/auth/otp/send", { email, purpose });
};

// Verify OTP with purpose
export const verifyOTP = (email: string, otp: string, purpose: string) => {
  return api.post("/auth/otp/verify", { email, otp, purpose });
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
