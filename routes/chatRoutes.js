const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.get("/booking/:bookingId", verifyToken, chatController.getChatByBookingId);
router.get("/messages/:chatId", verifyToken, chatController.getMessages);
router.post("/send", verifyToken, chatController.sendMessage);

module.exports = router;
