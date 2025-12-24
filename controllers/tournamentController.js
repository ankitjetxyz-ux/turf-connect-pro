const supabase = require("../config/db");

/* =========================
   GET ALL TOURNAMENTS
========================= */
exports.getAllTournaments = async (req, res) => {
  const user_id = req.user?.id || null;

  try {
    // 1. Fetch tournaments
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 2. Fetch joined tournaments (player only)
    let joinedIds = [];

    if (user_id) {
      const { data: joins } = await supabase
        .from("tournament_participants")
        .select("tournament_id")
        .eq("user_id", user_id);

      joinedIds = joins?.map(j => j.tournament_id) || [];
    }

    // 3. Shape response safely
    const formatted = tournaments.map(t => ({
      id: t.id,
      name: t.name,
      sport: t.sport,
      city: t.city,
      date: t.date,
      time: t.time,
      location: t.location,
      image: t.image,
      entry_fee: t.entry_fee,
      spots_left: t.spots_left,
      status: t.spots_left > 0 ? "Registering" : "Closed",
      already_joined: joinedIds.includes(t.id),
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to load tournaments" });
  }
};

/* =========================
   JOIN TOURNAMENT
========================= */
exports.joinTournament = async (req, res) => {
  const user_id = req.user.id;
  const { tournament_id } = req.body;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournament_id)
    .single();

  if (!tournament || tournament.spots_left <= 0) {
    return res.status(400).json({ error: "Tournament full" });
  }

  const { error } = await supabase
    .from("tournament_participants")
    .insert([{ user_id, tournament_id }]);

  if (error) {
    return res.status(400).json({ error: "Already joined" });
  }

  await supabase
    .from("tournaments")
    .update({ spots_left: tournament.spots_left - 1 })
    .eq("id", tournament_id);

  res.json({ message: "Joined successfully" });
};
