const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getAllTournaments,
  getTournamentById,
  joinTournament,
  joinTournamentWithOrder,
  verifyTournamentPayment,
  createTournament,
  getMyTournaments,
  deleteTournament,
  updateTournament,
  getPlayerTournaments,
  getTournamentParticipants,
} = require("../controllers/tournamentController");

const { verifyToken, allowRoles, optionalVerifyToken } = require("../middleware/authMiddleware");

// Multer storage for tournament images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/tournaments");
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      return cb(e, dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `tourn-${req.user.id}-${Date.now()}${ext}`);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// Public routes
router.get("/", optionalVerifyToken, getAllTournaments);

// Specific routes must come BEFORE generic /:id routes
router.get("/player-stats", verifyToken, allowRoles("player"), getPlayerTournaments);

// Client routes (specific)
router.get("/my", verifyToken, allowRoles("client"), getMyTournaments);

// Generic /:id routes
router.get("/:id", optionalVerifyToken, getTournamentById);
router.get("/:id/participants", optionalVerifyToken, getTournamentParticipants);

// Player routes (action-based)
router.post("/join", verifyToken, allowRoles("player"), joinTournament);
router.post("/join-and-order", verifyToken, allowRoles("player"), joinTournamentWithOrder);
router.post("/verify-payment", verifyToken, allowRoles("player"), verifyTournamentPayment);

// Client routes (action-based with upload)
router.post("/", verifyToken, allowRoles("client"), upload.single("image"), createTournament);
router.put("/:id", verifyToken, allowRoles("client"), upload.single("image"), updateTournament);
router.delete("/:id", verifyToken, allowRoles("client"), deleteTournament);

module.exports = router;