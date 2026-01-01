const supabase = require("../config/db");

/* =======================
   CREATE TURF (CLIENT)
======================= */
exports.createTurf = async (req, res) => {
  try {
    const {
      name,
      location,
      description,
      price_per_slot,
      facilities,
      images,
    } = req.body;

    const owner_id = req.user.id;

    if (!name || !location || !price_per_slot) {
      return res.status(400).json({
        error: "Name, location and price are required",
      });
    }

    // ✅ FORCE images to be TEXT[]
    const imageArray = Array.isArray(images)
      ? images
      : typeof images === "string"
        ? images.split(",").map((s) => s.trim())
        : [];

    const { data, error } = await supabase
      .from("turfs")
      .insert([
        {
          owner_id,
          name,
          location,
          description,
          price_per_slot: Number(price_per_slot),
          facilities,
          images: imageArray, // ✅ CLEAN ARRAY
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Create turf error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Create turf crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =======================
   GET ALL TURFS (PUBLIC)
   - Includes lightweight stats for tournaments and matches
======================= */
exports.getAllTurfs = async (req, res) => {
  const { search, location } = req.query;

  let query = supabase
    .from("turfs")
    .select("*")
    .eq("is_active", true);

  if (search) {
    // Broaden search to name, location, facilities
    query = query.or(
      `name.ilike.%${search}%,location.ilike.%${search}%,facilities.ilike.%${search}%`,
    );
  }

  if (location) {
    // If specific location filter is applied (separate from search box)
    query = query.ilike("location", `%${location}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error fetching turfs:", error);
    return res
      .status(400)
      .json({ error: "Failed to fetch turfs: " + error.message });
  }

  if (!data || data.length === 0) {
    return res.json([]);
  }

  const turfIds = data.map((t) => t.id);

  // 1) Tournaments per turf
  const { data: tournaments, error: tErr } = await supabase
    .from("tournaments")
    .select("id, turf_id")
    .in("turf_id", turfIds);

  if (tErr) {
    console.warn("Failed to load tournaments for turf stats", tErr);
  }

  const tournamentsByTurf = {};
  (tournaments || []).forEach((t) => {
    tournamentsByTurf[t.turf_id] = (tournamentsByTurf[t.turf_id] || 0) + 1;
  });

  // 2) Matches played: count bookings per turf via slots
  const { data: slots, error: sErr } = await supabase
    .from("slots")
    .select("id, turf_id")
    .in("turf_id", turfIds);

  if (sErr) {
    console.warn("Failed to load slots for turf stats", sErr);
  }

  const slotToTurf = {};
  const slotIds = [];
  (slots || []).forEach((s) => {
    slotToTurf[s.id] = s.turf_id;
    slotIds.push(s.id);
  });

  let bookingsByTurf = {};
  if (slotIds.length > 0) {
    const { data: bookings, error: bErr } = await supabase
      .from("bookings")
      .select("slot_id")
      .in("slot_id", slotIds);

    if (bErr) {
      console.warn("Failed to load bookings for turf stats", bErr);
    } else {
      (bookings || []).forEach((b) => {
        const turfId = slotToTurf[b.slot_id];
        if (!turfId) return;
        bookingsByTurf[turfId] = (bookingsByTurf[turfId] || 0) + 1;
      });
    }
  }

  // Enrich with sports derived from text + stats
  const keywords = [
    "Football",
    "Cricket",
    "Badminton",
    "Tennis",
    "Basketball",
    "Hockey",
  ];
  const enriched = data.map((t) => {
    const text = `${t.name} ${t.description} ${t.facilities}`.toLowerCase();
    const sports = keywords.filter((k) => text.includes(k.toLowerCase()));

    const tournamentsHosted = tournamentsByTurf[t.id] || 0;
    const matchesPlayed = bookingsByTurf[t.id] || 0;
    const isPopular = tournamentsHosted >= 5 || matchesPlayed >= 20;

    return {
      ...t,
      sports: sports.length > 0 ? sports : ["Football", "Cricket"], // Default fallback
      tournaments_hosted: tournamentsHosted,
      matches_played: matchesPlayed,
      is_popular: isPopular,
    };
  });

  res.json(enriched);
};

/* =======================
   GET CLIENT'S OWN TURFS
======================= */
exports.getMyTurfs = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const { data, error } = await supabase
      .from("turfs")
      .select("*")
      .eq("owner_id", owner_id)
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching my turfs:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Get my turfs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =======================
   GET TURF BY ID
======================= */
exports.getTurfById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Turf ID is required" });
    }

    const { data, error } = await supabase
      .from("turfs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      if (error) {
        console.error("Error fetching turf:", error);
      }
      return res.status(404).json({ error: "Turf not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Get turf by ID error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
