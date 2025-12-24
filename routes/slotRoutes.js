const express = require("express");
const router = express.Router();

const { createSlot, getSlotsByTurf } = require("../controllers/slotController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.get("/:turfId", getSlotsByTurf);

router.post(
  "/",
  verifyToken,
  allowRoles("client"),
  createSlot
);

module.exports = router;
