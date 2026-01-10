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
      google_maps_link,
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

    // ✅ Extract coordinates from Google Maps link if provided
    let latitude = null;
    let longitude = null;
    let formatted_address = null;

    if (google_maps_link) {
      try {
        // Extract coordinates from various Google Maps URL formats
        const coordMatch = google_maps_link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const placeMatch = google_maps_link.match(/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const qMatch = google_maps_link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (coordMatch) {
          latitude = parseFloat(coordMatch[1]);
          longitude = parseFloat(coordMatch[2]);
        } else if (placeMatch) {
          formatted_address = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
          latitude = parseFloat(placeMatch[2]);
          longitude = parseFloat(placeMatch[3]);
        } else if (qMatch) {
          latitude = parseFloat(qMatch[1]);
          longitude = parseFloat(qMatch[2]);
        }

        console.log(`📍 Extracted coordinates: lat=${latitude}, lng=${longitude}`);
        if (formatted_address) {
          console.log(`📍 Extracted address: ${formatted_address}`);
        }
      } catch (err) {
        console.warn("⚠️ Failed to extract coordinates from Google Maps link:", err);
        // Continue without coordinates - not a fatal error
      }
    }

    // Build the turf data object
    const turfData = {
      owner_id,
      name,
      location,
      description,
      price_per_slot: Number(price_per_slot),
      facilities,
      images: imageArray,
      is_active: true,
    };

    // Add Google Maps fields only if they exist
    if (google_maps_link) {
      turfData.google_maps_link = google_maps_link;
    }
    if (latitude !== null && longitude !== null) {
      turfData.latitude = latitude;
      turfData.longitude = longitude;
    }
    if (formatted_address) {
      turfData.formatted_address = formatted_address;
    }

    const { data, error } = await supabase
      .from("turfs")
      .insert([turfData])
      .select()
      .single();

    if (error) {
      console.error("Create turf error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Turf created successfully with ID:", data.id);
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

/* =======================
   GET TURF GALLERY
======================= */
exports.getTurfGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("turf_gallery")
      .select("*")
      .eq("turf_id", id)
      .order("display_order", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to load gallery" });
  }
};

/* =======================
   GET TURF REVIEWS
======================= */
exports.getTurfReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("turf_reviews")
      .select(`
        *,
        users(id, name, profile_image_url)
      `)
      .eq("turf_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to load reviews" });
  }
};

/* =======================
   GET TURF TESTIMONIALS
======================= */
exports.getTurfTestimonials = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("turf_testimonials")
      .select(`
        *,
        users(id, name, profile_image_url)
      `)
      .eq("turf_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to load testimonials" });
  }
};

/* =======================
   TURF COMMENTS (TEXT)
======================= */
exports.getTurfComments = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("turf_comments")
      .select(`
        id,
        turf_id,
        user_id,
        comment,
        created_at,
        updated_at,
        users(id, name, profile_image_url)
      `)
      .eq("turf_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getTurfComments] error", error);
      return res.status(400).json({ error: "Failed to load comments" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("[getTurfComments] unexpected", err);
    res.status(500).json({ error: "Failed to load comments" });
  }
};

exports.addTurfComment = async (req, res) => {
  try {
    const { id } = req.params; // turf_id
    const userId = req.user.id;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment is required" });
    }

    if (comment.length > 3000) {
      return res.status(400).json({ error: "Comment is too long (max ~60 lines)" });
    }

    // Ensure turf exists (and is active) before inserting
    const { data: turf, error: turfErr } = await supabase
      .from("turfs")
      .select("id")
      .eq("id", id)
      .single();

    if (turfErr || !turf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    const { data, error } = await supabase
      .from("turf_comments")
      .insert({
        turf_id: id,
        user_id: userId,
        comment: comment.trim(),
      })
      .select(
        "id, turf_id, user_id, comment, created_at, updated_at, users(id, name, profile_image_url)"
      )
      .single();

    if (error) {
      console.error("[addTurfComment] error", error);
      return res.status(400).json({ error: "Failed to add comment" });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("[addTurfComment] unexpected", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

exports.deleteTurfComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; // turf_id, comment id
    const requesterId = req.user.id;

    // Ensure requester is the turf owner
    const { data: turf, error: turfErr } = await supabase
      .from("turfs")
      .select("id, owner_id")
      .eq("id", id)
      .single();

    if (turfErr || !turf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    if (turf.owner_id !== requesterId) {
      return res.status(403).json({ error: "Only the turf owner can delete comments" });
    }

    const { error } = await supabase
      .from("turf_comments")
      .delete()
      .eq("id", commentId)
      .eq("turf_id", id);

    if (error) {
      console.error("[deleteTurfComment] error", error);
      return res.status(400).json({ error: "Failed to delete comment" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[deleteTurfComment] unexpected", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

/* =======================
   DELETE TURF
   - Only owner can delete their own turf
======================= */
exports.deleteTurf = async (req, res) => {
  try {
    const turfId = req.params.id;
    const ownerId = req.user.id;

    if (!turfId) {
      return res.status(400).json({ error: "Turf ID is required" });
    }

    // First, verify that this turf belongs to the requesting user
    const { data: turf, error: fetchError } = await supabase
      .from("turfs")
      .select("id, owner_id, name")
      .eq("id", turfId)
      .single();

    if (fetchError || !turf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    // Check ownership
    if (turf.owner_id !== ownerId) {
      return res.status(403).json({ error: "You don't have permission to delete this turf" });
    }

    // Delete the turf (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from("turfs")
      .delete()
      .eq("id", turfId);

    if (deleteError) {
      console.error("[deleteTurf] Delete error:", deleteError);
      return res.status(400).json({ error: deleteError.message });
    }

    console.log(`✅ Turf deleted: ${turf.name} (ID: ${turfId})`);
    res.json({
      message: "Turf deleted successfully",
      turf_id: turfId,
      turf_name: turf.name
    });
  } catch (err) {
    console.error("[deleteTurf] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* =======================
   UPLOAD TURF IMAGES
======================= */
exports.uploadTurfImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    // Build public URLs for uploaded images
    const imageUrls = req.files.map((file) => `/uploads/turfs/${file.filename}`);

    res.json({
      success: true,
      image_urls: imageUrls,
      count: imageUrls.length
    });
  } catch (err) {
    console.error("[uploadTurfImages] Unexpected error", err);
    res.status(500).json({ error: "Failed to upload images" });
  }
};

