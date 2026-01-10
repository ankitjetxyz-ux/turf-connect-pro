const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");

// Protected chat routes
router.route("/conversations")
    .post(verifyToken, chatController.createConversation)   // Create/retrieve conversation
    .get(verifyToken, chatController.listConversations);     // List all conversations

router.get("/:chatId/messages", verifyToken, chatController.getMessages);
router.post("/:chatId/message", verifyToken, chatController.postMessage);
router.delete("/:chatId", verifyToken, chatController.deleteChat);
router.post("/:chatId/favorite", verifyToken, chatController.toggleFavorite);

module.exports = router;
