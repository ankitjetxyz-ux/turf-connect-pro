const express = require("express");
const router = express.Router();

const {
  createTurf,
  getAllTurfs,
  getTurfById,
  getMyTurfs,
} = require("../controllers/turfController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

// Create turf (client only)
router.post("/", verifyToken, allowRoles("client"), createTurf);

// Get all turfs
router.get("/", verifyToken, getAllTurfs);

// ✅ CLIENT'S TURFS
router.get("/my", verifyToken, allowRoles("client"), getMyTurfs);

// Get turf by ID (KEEP LAST)
router.get("/:id", verifyToken, getTurfById);

module.exports = router;
