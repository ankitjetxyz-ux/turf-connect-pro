const supabase = require("../config/db");

/* =======================
   CREATE TURF (CLIENT)
======================= */
exports.createTurf = async (req, res) => {
  const {
    name,
    location,
    description,
    price_per_slot,
    facilities,
    images,
  } = req.body;

  const owner_id = req.user.id;

  const { data, error } = await supabase
    .from("turfs")
    .insert([
      {
        owner_id,
        name,
        location,
        description,
        price_per_slot,
        facilities,
        images,
        is_active: true,
      },
    ])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
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
    query = query.ilike("name", `%${search}%`);
  }

  if (location) {
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
