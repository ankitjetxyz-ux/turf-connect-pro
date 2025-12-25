const express = require("express");
const router = express.Router();

const {
  getAllTournaments,
  joinTournament,
} = require("../controllers/tournamentController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getAllTournaments);
router.post("/join", verifyToken, allowRoles("player"), joinTournament);

module.exports = router;
