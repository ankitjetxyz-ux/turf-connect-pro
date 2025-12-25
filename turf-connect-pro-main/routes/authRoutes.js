const express = require("express");
const authController = require("../controllers/authController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get(
  "/admin-only",
  verifyToken,
  allowRoles("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

module.exports = router;
