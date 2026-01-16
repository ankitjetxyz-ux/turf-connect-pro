const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// Public route for now, or add verifyToken if it should be protected
router.post("/chat", aiController.chatWithAi);

module.exports = router;
