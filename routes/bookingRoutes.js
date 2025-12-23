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

// Create booking (pending) and return Razorpay order for payment
router.post(
  "/create-and-order",
  verifyToken,
  allowRoles("player"),
  require('../controllers/bookingController').createBookingAndOrder
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

// Turf owner cancels a booking (full refund)
router.post(
  "/owner-cancel",
  verifyToken,
  allowRoles("client"),
  require('../controllers/bookingController').ownerCancelBooking
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
