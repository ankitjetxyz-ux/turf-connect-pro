const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const {
  createTurf,
  getAllTurfs,
  getMyTurfs,
  getTurfById,
  getTurfGallery,
  getTurfReviews,
  getTurfTestimonials,
  getTurfComments,
  addTurfComment,
  deleteTurfComment,
  uploadTurfImages,
  deleteTurf
} = require("../controllers/turfController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

// Multer storage for turf images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/turfs");
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      return cb(e, dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// Public Routes
router.get("/", getAllTurfs);

// Protected Routes (Client) - MUST BE BEFORE /:id ROUTE
router.post("/upload-images", verifyToken, allowRoles("client"), upload.array("images", 10), uploadTurfImages);
router.post("/", verifyToken, allowRoles("client"), createTurf);
router.get("/my", verifyToken, allowRoles("client"), getMyTurfs);

// Public Routes (specific turf) - MUST BE AFTER /my ROUTE
router.get("/:id", getTurfById);
router.get("/:id/gallery", getTurfGallery);
router.get("/:id/reviews", getTurfReviews);
router.get("/:id/testimonials", getTurfTestimonials);
router.get("/:id/comments", getTurfComments);
router.post("/:id/comments", verifyToken, addTurfComment);
router.delete("/:id/comments/:commentId", verifyToken, allowRoles("client"), deleteTurfComment);

// Delete turf (owner only)
router.delete("/:id", verifyToken, allowRoles("client"), deleteTurf);

module.exports = router;
