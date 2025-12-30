const express = require("express");
const router = express.Router();

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

// Public / auth-aware routes
router.get("/", optionalVerifyToken, getAllTournaments);
router.get("/:id", optionalVerifyToken, getTournamentById); // Public/Auth details
router.get("/:id/participants", optionalVerifyToken, getTournamentParticipants);

// Player join routes
router.post("/join", verifyToken, allowRoles("player"), joinTournament); // legacy free join
router.post(
  "/join-and-order",
  verifyToken,
  allowRoles("player"),
  joinTournamentWithOrder,
);
router.post(
  "/verify-payment",
  verifyToken,
  allowRoles("player"),
  verifyTournamentPayment,
);

// Client Routes
router.post("/", verifyToken, allowRoles("client"), createTournament);
router.get("/my", verifyToken, allowRoles("client"), getMyTournaments);
router.put("/:id", verifyToken, allowRoles("client"), updateTournament);
router.delete("/:id", verifyToken, allowRoles("client"), deleteTournament);

// Player Routes
router.get("/player-stats", verifyToken, allowRoles("player"), getPlayerTournaments);

module.exports = router;
