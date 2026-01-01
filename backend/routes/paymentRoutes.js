const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

// Payment routes - require authentication
router.post("/create-order", verifyToken, paymentController.createOrder);
router.post("/verify", verifyToken, paymentController.verifyPayment);
router.post("/refund", verifyToken, allowRoles("client"), paymentController.refundPayment);

module.exports = router;
