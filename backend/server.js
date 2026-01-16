require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

/* ROUTE IMPORTS */
const authRoutes = require("./routes/authRoutes");
const turfRoutes = require("./routes/turfRoutes");
const slotRoutes = require("./routes/slotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contactRoutes = require("./routes/contactRoutes");
const profileRoutes = require("./routes/profileRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

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
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Static file serving for profile uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads")),
);

// Request logging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.path}`);
    next();
  });
}

/* =========================
   DIAGNOSTIC ECHO ROUTE
========================= */
app.post("/api/echo", (req, res) => {
  res.json({ ok: true, body: req.body });
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
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/promotional-videos", require("./routes/promotionalVideoRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

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
  res.status(500).json({ error: "Internal Server Error" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 8080;

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as needed for production
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  // Room for a specific chat (used by ChatPage / MessageWindow)
  socket.on('join_chat', (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat room ${chatId}`);
  });

  // Typing indicator relay inside a chat room
  socket.on('typing', ({ chatId, userId }) => {
    if (!chatId) return;
    // notify everyone else in the same chat room
    socket.to(chatId).emit('typing', { chatId, userId });
  });

  // Room for a specific user (used for booking notifications to turf owners)
  socket.on('join_user', (userId) => {
    if (!userId) return;
    socket.join(userId);
    console.log(`User ${socket.id} joined user room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server (with Socket.IO) running on port ${PORT}`);
});

