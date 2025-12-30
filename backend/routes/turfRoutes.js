const express = require("express");
const router = express.Router();
const {
  createTurf,
  getAllTurfs,
  getMyTurfs,
  getTurfById
} = require("../controllers/turfController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

// Public Routes
router.get("/", getAllTurfs);

// Protected Routes (Client) - MUST BE BEFORE /:id ROUTE
router.post("/", verifyToken, allowRoles("client"), createTurf);
router.get("/my", verifyToken, allowRoles("client"), getMyTurfs);

// Public Routes (specific turf) - MUST BE AFTER /my ROUTE
router.get("/:id", getTurfById);

module.exports = router;
