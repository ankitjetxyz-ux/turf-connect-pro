const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");

// Public Admin Route
router.post("/login", adminController.login);

// Protected Admin Routes
router.get("/dashboard/stats", adminAuth, adminController.getDashboardStats);
router.get("/dashboard/pending-preview", adminAuth, adminController.getPendingTurfsPreview);
router.get("/activity/recent", adminAuth, adminController.getRecentActivity);

// Verification Panel
router.get("/turfs/status/:status", adminAuth, adminController.getTurfsByStatus); // status: pending, approved, rejected
router.get("/turfs/:id", adminAuth, adminController.getTurfVerificationDetails);
router.post("/turfs/:id/approve", adminAuth, adminController.approveTurf);
router.post("/turfs/:id/reject", adminAuth, adminController.rejectTurf);

module.exports = router;
