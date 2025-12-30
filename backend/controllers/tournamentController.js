const supabase = require("../config/db");

/* =========================
   GET ALL TOURNAMENTS
   - Filters out expired tournaments (end_date < today)
   - Supports search by name, sport
========================= */
exports.getAllTournaments = async (req, res) => {
  const user_id = req.user?.id || null;
  const { search } = req.query;

  try {
    // 1. Fetch tournaments
    let query = supabase
      .from("tournaments")
      .select("*")
      .gte("end_date", new Date().toISOString().split("T")[0]) // Filter expired (show until tournament ends)
      .order("start_date", { ascending: true }); // Show nearest first

    // Search filter
    if (search) {
      // search across name, sport
      query = query.or(`name.ilike.%${search}%,sport.ilike.%${search}%`);
    }

    const { data: tournaments, error } = await query;

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
      start_date: t.start_date,
      end_date: t.end_date,
      entry_fee: t.entry_fee,
      max_teams: t.max_teams,
      image: t.image,
      status: t.status || "upcoming",
      already_joined: joinedIds.includes(t.id),
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Tournament fetch error:", err);
    res.status(500).json({ error: "Failed to load tournaments" });
  }
};

/* =========================
   GET TOURNAMENT BY ID
========================= */
exports.getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(tournament);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =========================
   JOIN TOURNAMENT
========================= */
exports.joinTournament = async (req, res) => {
  const user_id = req.user.id;
  const { tournament_id, team_name, team_members } = req.body;

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournament_id)
    .single();

  if (!tournament || tournament.max_teams <= 0) {
    return res.status(400).json({ error: "Tournament full or not found" });
  }

  const { error } = await supabase
    .from("tournament_participants")
    .insert([{ user_id, tournament_id, team_name, team_members }]);

  if (error) {
    return res.status(400).json({ error: "Already joined or registration failed" });
  }

  // Decrement max_teams
  await supabase
    .from("tournaments")
    .update({ max_teams: tournament.max_teams - 1 })
    .eq("id", tournament_id);

  res.json({ message: "Joined successfully" });
};

/* =========================
   CREATE TOURNAMENT (CLIENT)
========================= */
exports.createTournament = async (req, res) => {
  const owner_id = req.user.id;
  const { name, sport, start_date, end_date, entry_fee, max_teams, turf_id, description, image } = req.body;

  try {
    // 1. Verify turf belongs to owner
    const { data: turf } = await supabase.from("turfs").select("id, owner_id").eq("id", turf_id).single();
    if (!turf || turf.owner_id !== owner_id) {
      return res.status(403).json({ error: "Unauthorized or Turf not found" });
    }

    // 2. Insert
    const { data, error } = await supabase.from("tournaments").insert([{
      name, sport, start_date, end_date, entry_fee, max_teams, turf_id, description, image
    }]).select().single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =========================
   GET MY TOURNAMENTS (CLIENT)
========================= */
exports.getMyTournaments = async (req, res) => {
  const owner_id = req.user.id;
  const { turf_id } = req.query;

  try {
    // Fetch turfs owned by user
    const { data: turfs } = await supabase.from("turfs").select("id").eq("owner_id", owner_id);
    const turfIds = turfs?.map(t => t.id) || [];

    if (turfIds.length === 0) return res.json([]);

    // If specific turf requested, verify ownership
    if (turf_id && !turfIds.includes(turf_id)) {
      return res.status(403).json({ error: "Unauthorized access to this turf" });
    }

    let query = supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: true });

    if (turf_id) {
      query = query.eq("turf_id", turf_id);
    } else {
      query = query.in("turf_id", turfIds);
    }

    const { data: tournaments, error } = await query;

    if (error) throw error;
    res.json(tournaments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =========================
   DELETE TOURNAMENT (CLIENT)
========================= */
exports.deleteTournament = async (req, res) => {
  const owner_id = req.user.id;
  const { id } = req.params;

  try {
    // Verify ownership via turf
    // Note: This relies on foreign key `turf_id` references `turfs(id)`
    const { data: tournament } = await supabase.from("tournaments").select("turf_id, turfs!inner(owner_id)").eq("id", id).single();

    if (!tournament || tournament.turfs?.owner_id !== owner_id) {
      return res.status(403).json({ error: "Unauthorized or Tournament not linked to your turf" });
    }

    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Tournament deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =========================
   UPDATE TOURNAMENT (CLIENT)
   - Allows owner to edit tournament details
========================= */
exports.updateTournament = async (req, res) => {
  const owner_id = req.user.id;
  const { id } = req.params;
  const { name, sport, start_date, end_date, entry_fee, max_teams, description, image, status } = req.body;

  try {
    // 1. Verify ownership (via turf)
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("turf_id, turfs!inner(owner_id)")
      .eq("id", id)
      .single();

    if (!tournament || tournament.turfs?.owner_id !== owner_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 2. Update fields
    const updates = {};
    if (name) updates.name = name;
    if (sport) updates.sport = sport;
    if (start_date) updates.start_date = start_date;
    if (end_date) updates.end_date = end_date;
    if (entry_fee) updates.entry_fee = entry_fee;
    if (max_teams) updates.max_teams = max_teams;
    if (description) updates.description = description;
    if (image) updates.image = image;
    if (status) updates.status = status; // cancel/complete etc.

    const { data, error } = await supabase
      .from("tournaments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =========================
   GET PLAYER TOURNAMENTS (STATS)
========================= */
exports.getPlayerTournaments = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { data: participants, error } = await supabase
      .from("tournament_participants")
      .select(`
        tournament_id,
        tournaments (
          id, name, sport, start_date, end_date, status, image
        )
      `)
      .eq("user_id", user_id);

    if (error) throw error;

    // Flatten structure
    const tournaments = participants.map(p => p.tournaments);
    res.json(tournaments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
