const express = require("express");
const router = express.Router();

const {
   createSlot,
   getSlotsByTurf,
   deleteSlot,
   updateSlot,
   bulkGenerateSlots,
   bulkUpdateSlots,
   bulkDeleteSlots,
   getCalendarView,
   getTemplates,
   applyTemplate
} = require("../controllers/slotController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

/* ============================================================================
   PUBLIC ROUTES - Anyone can view slots
   ============================================================================ */

// Get slots for a turf (with optional filters)
router.get("/:turfId", getSlotsByTurf);

// Get calendar view for date range
router.get("/calendar/:turfId", getCalendarView);

// Hold slot (Authenticated users)
router.post("/hold", verifyToken, require("../controllers/slotController").holdSlot);

/* ============================================================================
   PROTECTED ROUTES - Client (Turf Owner) Only
   ============================================================================ */

// Create single slot
router.post("/", verifyToken, allowRoles("client"), createSlot);

// Update single slot
router.put("/:id", verifyToken, allowRoles("client"), updateSlot);

// Delete single slot
router.delete("/:id", verifyToken, allowRoles("client"), deleteSlot);

/* ============================================================================
   BULK OPERATIONS - Client Only
   ============================================================================ */

// Bulk generate slots with recurring schedule
router.post("/bulk/generate", verifyToken, allowRoles("client"), bulkGenerateSlots);

// Bulk update slots
router.patch("/bulk/update", verifyToken, allowRoles("client"), bulkUpdateSlots);

// Bulk delete slots
router.post("/bulk/delete", verifyToken, allowRoles("client"), bulkDeleteSlots);

/* ============================================================================
   TEMPLATES - Client Only
   ============================================================================ */

// Get saved templates for a turf
router.get("/templates/list", verifyToken, allowRoles("client"), getTemplates);

// Apply  saved template to generate slots
router.post("/templates/apply", verifyToken, allowRoles("client"), applyTemplate);

// Cleanup expired holds (can be called by cron or on demand)
// router.post("/cleanup-holds", cleanupExpiredHolds);

module.exports = router;
