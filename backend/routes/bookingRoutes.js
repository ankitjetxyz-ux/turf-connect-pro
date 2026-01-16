const express = require("express");
const router = express.Router();

const {
  bookSlot,
  createBookingAndOrder,
  getMyBookings,
  getClientBookings,
  cancelBooking,
  ownerCancelBooking
} = require("../controllers/bookingController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

/* =====================
   PLAYER ROUTES
===================== */

// Book slot (direct / legacy)
router.post(
  "/book",
  verifyToken,
  allowRoles("player"),
  bookSlot
);

// Create booking + Razorpay order
router.post(
  "/create-and-order",
  verifyToken,
  allowRoles("player"),
  createBookingAndOrder
);

// Get player's bookings (also used by clients for their own bookings)
router.get(
  "/my",
  verifyToken,
  allowRoles("player", "client"),
  getMyBookings
);

// Player cancels booking
router.post(
  "/cancel",
  verifyToken,
  allowRoles("player"),
  cancelBooking
);

/* =====================
   CLIENT ROUTES
===================== */

// Owner cancels booking
router.post(
  "/owner-cancel",
  verifyToken,
  allowRoles("client"),
  ownerCancelBooking
);

// Get bookings for owner's turfs
router.get(
  "/client",
  verifyToken,
  allowRoles("client"),
  getClientBookings
);

module.exports = router;
