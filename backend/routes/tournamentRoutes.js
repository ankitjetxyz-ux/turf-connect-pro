const express = require("express");
const router = express.Router();

const {
  getAllTournaments,
  getTournamentById,
  joinTournament,
  createTournament,
  getMyTournaments,
  deleteTournament,
  updateTournament,
  getPlayerTournaments
} = require("../controllers/tournamentController");

const { verifyToken, allowRoles, optionalVerifyToken } = require("../middleware/authMiddleware");

router.get("/", optionalVerifyToken, getAllTournaments);
router.get("/:id", optionalVerifyToken, getTournamentById); // Public/Auth details
router.post("/join", verifyToken, allowRoles("player"), joinTournament);

// Client Routes
router.post("/", verifyToken, allowRoles("client"), createTournament);
router.get("/my", verifyToken, allowRoles("client"), getMyTournaments);
router.put("/:id", verifyToken, allowRoles("client"), updateTournament);
router.delete("/:id", verifyToken, allowRoles("client"), deleteTournament);

// Player Routes
router.get("/player-stats", verifyToken, allowRoles("player"), getPlayerTournaments);

module.exports = router;
