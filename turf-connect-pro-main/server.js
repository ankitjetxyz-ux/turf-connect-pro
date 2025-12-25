require("dotenv").config();

const express = require("express");
const cors = require("cors");

/* ROUTE IMPORTS */
const authRoutes = require("./routes/authRoutes");
const turfRoutes = require("./routes/turfRoutes");
const slotRoutes = require("./routes/slotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// Warn about commonly required environment variables to help local dev
const requiredEnvs = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "JWT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length > 0) {
   console.warn(`⚠️  Missing env vars: ${missing.join(", ")}. See .env.example`);
}

/* =========================
   GLOBAL MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.path}`, req.body);
  next();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

/* =========================
   API ROUTES
========================= */
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working", frontend: "http://localhost:3000" });
});

app.use("/api/auth", authRoutes);
app.use("/api/turfs", turfRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contact", contactRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// FORCE KEEP ALIVE (Debug for premature exit)
setInterval(() => {}, 10000);
