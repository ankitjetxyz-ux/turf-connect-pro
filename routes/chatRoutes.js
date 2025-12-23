const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");

// Protected chat routes
router.post("/create", verifyToken, chatController.createConversation);
router.get("/conversations/:userId", verifyToken, chatController.listConversations);
router.get("/:chatId/messages", verifyToken, chatController.getMessages);
router.post("/:chatId/message", verifyToken, chatController.postMessage);

module.exports = router;
