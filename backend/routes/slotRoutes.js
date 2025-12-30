const express = require("express");
const router = express.Router();

const { createSlot, getSlotsByTurf, deleteSlot, updateSlot } = require("../controllers/slotController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.get("/:turfId", getSlotsByTurf);

router.post("/", verifyToken, allowRoles("client"), createSlot);
router.delete("/:id", verifyToken, allowRoles("client"), deleteSlot);
router.put("/:id", verifyToken, allowRoles("client"), updateSlot);

module.exports = router;
