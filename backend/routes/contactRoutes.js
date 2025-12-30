const express = require("express");
const router = express.Router();
const { submitContactForm } = require("../controllers/contactController");
const { optionalVerifyToken } = require("../middleware/authMiddleware");

// Use optionalVerifyToken so we can log user_id if they are logged in, but allow guests too.
router.post("/", optionalVerifyToken, submitContactForm);

module.exports = router;
