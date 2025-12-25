const express = require("express");
const router = express.Router();
const { submitContactForm } = require("../controllers/contactController");
const { verifyToken } = require("../middleware/authMiddleware");

// Optional: verifyToken if we want to track user_id, but usually contact is public.
// We'll make it public but attach user if token exists (middleware needs to be flexible)
// For now, let's just make it public. Frontend sends token if available? 
// Let's keep it simple: Public route.

router.post("/", submitContactForm);

module.exports = router;
