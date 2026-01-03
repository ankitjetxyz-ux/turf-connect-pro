const express = require("express");
const router = express.Router();

const {
  getAllPromotionalVideos,
  createPromotionalVideo,
  updatePromotionalVideo,
  deletePromotionalVideo,
} = require("../controllers/promotionalVideoController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

// Public route
router.get("/", getAllPromotionalVideos);

// Admin routes
router.post("/", verifyToken, allowRoles("admin"), createPromotionalVideo);
router.put("/:id", verifyToken, allowRoles("admin"), updatePromotionalVideo);
router.delete("/:id", verifyToken, allowRoles("admin"), deletePromotionalVideo);

module.exports = router;

