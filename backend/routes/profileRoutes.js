const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
} = require("../controllers/profileController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Multer storage for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/profile");
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      // If directory cannot be created, surface error via callback
      return cb(e, dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get("/me", verifyToken, getMyProfile);
router.put("/", verifyToken, updateMyProfile);
router.post("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);

module.exports = router;