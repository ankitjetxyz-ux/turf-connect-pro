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

// Get all turfs (Public access, no token required for viewing)
router.get("/", getAllTurfs);

// ✅ CLIENT'S TURFS
router.get("/my", verifyToken, allowRoles("client"), getMyTurfs);

// Get turf by ID (Public access)
router.get("/:id", getTurfById);

module.exports = router;
