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

// Public list route
router.get("/", optionalVerifyToken, getAllTournaments);

// Player join routes (static paths before :id)
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

// Client Routes (static paths before :id)
router.post("/", verifyToken, allowRoles("client"), createTournament);
router.get("/my", verifyToken, allowRoles("client"), getMyTournaments);

// Player Routes (static paths before :id)
router.get("/player-stats", verifyToken, allowRoles("player"), getPlayerTournaments);

// Parameterized routes MUST come AFTER static routes
router.get("/:id", optionalVerifyToken, getTournamentById);
router.get("/:id/participants", optionalVerifyToken, getTournamentParticipants);
router.put("/:id", verifyToken, allowRoles("client"), updateTournament);
router.delete("/:id", verifyToken, allowRoles("client"), deleteTournament);

module.exports = router;
