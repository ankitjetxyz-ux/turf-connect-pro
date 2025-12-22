const express = require("express");
const router = express.Router();

const {
  bookSlot,
  getMyBookings,
  getClientBookings,
  cancelBooking,
} = require("../controllers/bookingController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

/* =========================
   PLAYER ROUTES
========================= */

// Book a slot
router.post(
  "/book",
  verifyToken,
  allowRoles("player"),
  bookSlot
);

// Get player's own bookings
router.get(
  "/my",
  verifyToken,
  allowRoles("player"),
  getMyBookings
);

// Cancel booking
router.post(
  "/cancel",
  verifyToken,
  allowRoles("player"),
  cancelBooking
);

/* =========================
   CLIENT ROUTES
========================= */

// Get bookings for client's turfs
router.get(
  "/client",
  verifyToken,
  allowRoles("client"),
  getClientBookings
);

module.exports = router;
