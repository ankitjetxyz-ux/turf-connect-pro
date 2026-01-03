const supabase = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
let razorpay = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
}

/* =========================
   GET ALL TOURNAMENTS
========================= */
exports.getAllTournaments = async (req, res) => {
  const user_id = req.user?.id || null;
  const { search } = req.query;

  try {
    let query = supabase
      .from("tournaments")
      .select("*")
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sport.ilike.%${search}%`);
    }

    const { data: tournaments, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!tournaments || tournaments.length === 0) {
      return res.json([]);
    }

    let joinedIds = [];

    if (user_id) {
      const { data: joins } = await supabase
        .from("tournament_participants")
        .select("tournament_id")
        .eq("user_id", user_id)
        .eq("payment_status", "paid");

      joinedIds = joins?.map((j) => j.tournament_id) || [];
    }

    const tournamentIds = tournaments.map((t) => t.id);
    const { data: participants, error: partErr } = await supabase
      .from("tournament_participants")
      .select("tournament_id")
      .in("tournament_id", tournamentIds)
      .eq("payment_status", "paid");

    if (partErr) {
      console.warn("Failed to load tournament participants for stats", partErr);
    }

    const teamCountByTournament = {};
    (participants || []).forEach((p) => {
      teamCountByTournament[p.tournament_id] =
        (teamCountByTournament[p.tournament_id] || 0) + 1;
    });

    const formatted = tournaments.map((t) => {
      const currentTeams = teamCountByTournament[t.id] || 0;
      const maxTeams = Number(t.max_teams) || 0;
      const spotsLeft = Math.max(0, maxTeams - currentTeams);

      return {
        id: t.id,
        name: t.name,
        sport: t.sport,
        start_date: t.start_date,
        end_date: t.end_date,
        entry_fee: t.entry_fee,
        max_teams: maxTeams,
        current_teams: currentTeams,
        spots_left: spotsLeft,
        image: t.image,
        status: t.status || "upcoming",
        already_joined: joinedIds.includes(t.id),
      };
    });

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
   LEGACY: JOIN TOURNAMENT (NO PAYMENT)
========================= */
exports.joinTournament = async (req, res) => {
  const user_id = req.user.id;
  const { tournament_id, team_name, team_members, leader_contact_phone } = req.body;

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournament_id)
    .single();

  if (tournamentError || !tournament) {
    console.error("[joinTournament] Tournament fetch error:", tournamentError);
    return res.status(404).json({ error: "Tournament not found" });
  }

  if (Number(tournament.entry_fee) > 0) {
    return res
      .status(400)
      .json({ error: "Paid tournaments must be joined via the payment flow" });
  }

  const { data: paidParticipants } = await supabase
    .from("tournament_participants")
    .select("id")
    .eq("tournament_id", tournament_id)
    .eq("payment_status", "paid");

  const maxTeams = Number(tournament.max_teams) || 0;
  if (maxTeams > 0 && (paidParticipants?.length || 0) >= maxTeams) {
    return res.status(400).json({ error: "Tournament full" });
  }

  const { error } = await supabase
    .from("tournament_participants")
    .insert([
      {
        user_id,
        tournament_id,
        team_name,
        team_members,
        leader_contact_phone,
        status: "registered",
        payment_status: "paid",
      },
    ]);

  if (error) {
    return res.status(400).json({ error: "Already joined or registration failed" });
  }

  res.json({ message: "Joined successfully" });
};

/* =========================
   PAID JOIN: CREATE ORDER + PENDING PARTICIPANT
========================= */
exports.joinTournamentWithOrder = async (req, res) => {
  console.log("[DEBUG] joinTournamentWithOrder called", {
    user_id: req.user?.id,
    body: req.body,
    razorpayInitialized: !!razorpay,
    hasRazorpayKeys: !!(razorpayKeyId && razorpayKeySecret)
  });

  if (!req.user || !req.user.id) {
    console.error("[DEBUG] No user found in request");
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!razorpay) {
    console.error("[joinTournamentWithOrder] Razorpay not initialized.");
    return res.status(500).json({
      error: "Payment system temporarily unavailable",
      details: "Razorpay configuration missing"
    });
  }

  const user_id = req.user.id;
  const { tournament_id, team_name, team_members, leader_contact_phone } = req.body;

  if (!tournament_id || !team_name) {
    return res.status(400).json({
      error: "Missing required fields",
      details: "tournament_id and team_name are required"
    });
  }

  try {
    console.log("[DEBUG] Fetching tournament:", tournament_id);
    const { data: tournament, error: tErr } = await supabase
      .from("tournaments")
      .select("id, entry_fee, max_teams")
      .eq("id", tournament_id)
      .single();

    if (tErr || !tournament) {
      console.error("[DEBUG] Tournament fetch error:", tErr);
      return res.status(404).json({ error: "Tournament not found" });
    }

    const maxTeams = Number(tournament.max_teams) || 0;

    const { data: paidParticipants, error: pErr } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournament_id)
      .eq("payment_status", "paid");

    if (pErr) {
      console.error("[joinTournamentWithOrder] participants fetch error", pErr);
      return res.status(500).json({ error: "Failed to validate capacity" });
    }

    if (maxTeams > 0 && (paidParticipants?.length || 0) >= maxTeams) {
      return res.status(400).json({ error: "Tournament is full" });
    }

    const entryFee = Number(tournament.entry_fee) || 0;
    if (entryFee <= 0) {
      return res.status(400).json({ error: "Tournament has no entry fee; use free join" });
    }

    console.log("[DEBUG] Creating Razorpay order for amount:", entryFee * 100);
    const order = await razorpay.orders.create({
      amount: Math.round(entryFee * 100),
      currency: "INR",
      payment_capture: 1,
    });

    console.log("[DEBUG] Razorpay order created:", order.id);

    const { data: participant, error: partErr } = await supabase
      .from("tournament_participants")
      .insert([
        {
          user_id,
          tournament_id,
          team_name,
          team_members,
          leader_contact_phone,
          status: "pending",
          payment_status: "pending",
          razorpay_order_id: order.id,
        },
      ])
      .select()
      .single();

    if (partErr || !participant) {
      console.error("[joinTournamentWithOrder] participant insert error", partErr);
      return res.status(500).json({
        error: "Failed to create participant",
        details: partErr?.message
      });
    }

    console.log("[DEBUG] Participant created:", participant.id);

    res.json({
      participant_id: participant.id,
      order,
      key_id: razorpayKeyId,
    });
  } catch (err) {
    console.error("[joinTournamentWithOrder] Unexpected error", err);

    // Handle Razorpay specific error structure
    if (err.statusCode === 401) {
      return res.status(500).json({
        error: "Payment configuration error",
        details: "Razorpay authentication failed. Please check backend API keys."
      });
    }

    if (err.error && err.error.description) {
      return res.status(500).json({
        error: "Payment provider error",
        details: err.error.description
      });
    }

    res.status(500).json({
      error: "Failed to start payment",
      details: err.message || "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/* =========================
   VERIFY TOURNAMENT PAYMENT
========================= */
exports.verifyTournamentPayment = async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ error: "Payments not configured" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, participant_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !participant_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const generated_signature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("[verifyTournamentPayment] Signature mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { data: participant, error: partErr } = await supabase
      .from("tournament_participants")
      .select(
        `id, user_id, tournament_id, payment_status, status,
         tournaments (
           id, entry_fee, turf_id,
           turfs ( owner_id )
         )`
      )
      .eq("id", participant_id)
      .maybeSingle();

    if (partErr || !participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    if (participant.payment_status === "paid") {
      return res.json({ success: true });
    }

    const tournament = participant.tournaments;
    if (!tournament) {
      return res.status(400).json({ error: "Tournament data missing" });
    }

    const entryFee = Number(tournament.entry_fee) || 0;
    const ownerId = tournament.turfs?.owner_id || null;

    const maxTeams = Number(tournament.max_teams) || 0;
    const { data: paidParticipants } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournament.id)
      .eq("payment_status", "paid");

    if (maxTeams > 0 && (paidParticipants?.length || 0) >= maxTeams) {
      return res.status(400).json({ error: "Tournament is full" });
    }

    const { error: updateErr } = await supabase
      .from("tournament_participants")
      .update({
        payment_status: "paid",
        status: "registered",
        razorpay_order_id,
      })
      .eq("id", participant_id);

    if (updateErr) {
      console.error("[verifyTournamentPayment] participant update failed", updateErr);
      return res.status(500).json({ error: "Failed to update participant" });
    }

    // Earnings distribution - simplified for now
    if (entryFee > 0) {
      const adminCut = 50.0;
      const ownerCut = Math.max(0, entryFee - adminCut);
      console.log(`[DEBUG] Earnings: Admin ${adminCut}, Owner ${ownerCut}`);
    }

    // Generate verification code
    let verificationCode = null;
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const { data: tournamentDetails } = await supabase
        .from("tournaments")
        .select("end_date")
        .eq("id", tournament.id)
        .single();

      if (tournamentDetails) {
        const tournamentDate = new Date(tournamentDetails.end_date);
        tournamentDate.setHours(23, 59, 59, 999);
        const expiresAt = tournamentDate.toISOString();

        const { data: vCode, error: vCodeErr } = await supabase
          .from("booking_verification_codes")
          .insert({
            booking_id: null,
            participant_id: participant_id,
            booking_type: 'tournament',
            verification_code: code,
            expires_at: expiresAt
          })
          .select()
          .single();

        if (!vCodeErr && vCode) {
          verificationCode = code;
        } else {
          console.warn("[verifyTournamentPayment] Verification code creation skipped:", vCodeErr?.message);
        }
      }
    } catch (vCodeErr) {
      console.warn("[verifyTournamentPayment] Verification code generation skipped:", vCodeErr.message);
    }

    return res.json({
      success: true,
      verification_code: verificationCode,
      participant_id: participant_id
    });
  } catch (err) {
    console.error("[verifyTournamentPayment] Unexpected error", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

/* =========================
   GET TOURNAMENT PARTICIPANTS (PAID)
========================= */
exports.getTournamentParticipants = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("tournament_participants")
      .select(
        `id, user_id, team_name, team_members, leader_contact_phone, created_at,
         users ( name, profile_image_url )`
      )
      .eq("tournament_id", id)
      .eq("payment_status", "paid");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const participants = (data || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      team_name: p.team_name,
      team_members: p.team_members,
      leader_contact_phone: p.leader_contact_phone,
      created_at: p.created_at,
      user: p.users || null,
    }));

    res.json(participants);
  } catch (err) {
    console.error("[getTournamentParticipants] Unexpected error", err);
    res.status(500).json({ error: "Failed to load participants" });
  }
};

/* =========================
   CREATE TOURNAMENT (CLIENT)
========================= */
exports.createTournament = async (req, res) => {
  const owner_id = req.user.id;
  const { name, sport, start_date, end_date, entry_fee, max_teams, turf_id, description } = req.body;

  let imagePath = req.body.image; // fallback
  if (req.file) {
    imagePath = `/uploads/tournaments/${req.file.filename}`;
  }

  try {
    const { data: turf, error: turfError } = await supabase
      .from("turfs")
      .select("id, owner_id")
      .eq("id", turf_id)
      .single();

    if (turfError || !turf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    if (turf.owner_id !== owner_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("tournaments")
      .insert([
        {
          name,
          sport,
          start_date,
          end_date,
          entry_fee,
          max_teams,
          turf_id,
          description,
          image: imagePath,
        },
      ])
      .select()
      .single();

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
    const { data: turfs } = await supabase
      .from("turfs")
      .select("id")
      .eq("owner_id", owner_id);
    const turfIds = turfs?.map((t) => t.id) || [];

    if (turfIds.length === 0) return res.json([]);

    if (turf_id && !turfIds.includes(turf_id)) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this turf" });
    }

    let query = supabase.from("tournaments").select("*");

    if (turf_id) {
      query = query.eq("turf_id", turf_id);
    } else {
      query = query.in("turf_id", turfIds);
    }

    query = query.order("start_date", { ascending: true });

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
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("turf_id, turfs!inner(owner_id)")
      .eq("id", id)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (!tournament.turfs || tournament.turfs.owner_id !== owner_id) {
      return res.status(403).json({ error: "Unauthorized" });
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
========================= */
exports.updateTournament = async (req, res) => {
  const owner_id = req.user.id;
  const { id } = req.params;
  const {
    name,
    sport,
    start_date,
    end_date,
    entry_fee,
    max_teams,
    description,
    status,
  } = req.body;

  let imagePath = req.body.image;
  if (req.file) {
    imagePath = `/uploads/tournaments/${req.file.filename}`;
  }

  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("turf_id, turfs!inner(owner_id)")
      .eq("id", id)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    if (!tournament.turfs || tournament.turfs.owner_id !== owner_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (sport) updates.sport = sport;
    if (start_date) updates.start_date = start_date;
    if (end_date) updates.end_date = end_date;
    if (entry_fee !== undefined) updates.entry_fee = entry_fee;
    if (max_teams !== undefined) updates.max_teams = max_teams;
    if (description) updates.description = description;
    if (imagePath) updates.image = imagePath;
    if (status) updates.status = status;

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
      .select(
        `
        id,
        tournament_id,
        team_name,
        tournaments (
          id, name, sport, start_date, end_date, status, image, entry_fee
        )
      `
      )
      .eq("user_id", user_id)
      .eq("payment_status", "paid");

    if (error) throw error;

    const participantIds = (participants || []).map(p => p.id);
    let verificationCodesMap = {};
    if (participantIds.length > 0) {
      const { data: vCodes } = await supabase
        .from("booking_verification_codes")
        .select("participant_id, verification_code, expires_at")
        .in("participant_id", participantIds)
        .eq("booking_type", "tournament");

      if (vCodes) {
        vCodes.forEach(vc => {
          verificationCodesMap[vc.participant_id] = {
            code: vc.verification_code,
            expires_at: vc.expires_at
          };
        });
      }
    }

    const tournaments = (participants || [])
      .map((p) => ({
        ...p.tournaments,
        participant_id: p.id,
        team_name: p.team_name,
        verification_code: verificationCodesMap[p.id]?.code || null,
        verification_expires_at: verificationCodesMap[p.id]?.expires_at || null
      }))
      .filter(Boolean);
    res.json(tournaments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};