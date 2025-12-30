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
======================= */
exports.getAllTurfs = async (req, res) => {
  const { search, location } = req.query;

  let query = supabase
    .from("turfs")
    .select("*")
    .eq("is_active", true);

  if (search) {
    // Broaden search to name, location, facilities
    query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%,facilities.ilike.%${search}%`);
  }

  if (location) {
    // If specific location filter is applied (separate from search box)
    query = query.ilike("location", `%${location}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error fetching turfs:", error);
    return res.status(400).json({ error: "Failed to fetch turfs: " + error.message });
  }

  if (!data || data.length === 0) {
    return res.json([]);
  }

  // Enrich with sports derived from text
  const keywords = ["Football", "Cricket", "Badminton", "Tennis", "Basketball", "Hockey"];
  const enriched = data.map(t => {
    const text = `${t.name} ${t.description} ${t.facilities}`.toLowerCase();
    const sports = keywords.filter(k => text.includes(k.toLowerCase()));
    return {
      ...t,
      sports: sports.length > 0 ? sports : ["Football", "Cricket"] // Default fallback
    };
  });

  res.json(enriched);
};

/* =======================
   GET CLIENT'S OWN TURFS
======================= */
exports.getMyTurfs = async (req, res) => {
  const owner_id = req.user.id;

  const { data, error } = await supabase
    .from("turfs")
    .select("*")
    .eq("owner_id", owner_id)
    .eq("is_active", true)
    .order("id", { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
};

/* =======================
   GET TURF BY ID
======================= */
exports.getTurfById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("turfs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Turf not found" });
  }

  res.json(data);
};
