const supabase = require("../config/db");

/* =======================
   CREATE TURF (CLIENT) - V2 with Verification
======================= */
exports.createTurf = async (req, res) => {
  try {
    const {
      name,
      location,
      description,
      price_per_slot,
      facilities, // Text string (legacy)
      images, // Array of URLs
      google_maps_link,
      verification_documents, // New: Array of { type, url }
    } = req.body;

    console.log("📝 [createTurf] Incoming Request Body:", {
      name,
      location,
      price_per_slot,
      facilities_length: facilities?.length,
      images_count: images?.length,
      docs_count: verification_documents?.length
    });

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
      } catch (err) {
        console.warn("⚠️ Failed to extract coordinates:", err);
      }
    }

    // 1. Insert into 'turfs'
    const turfData = {
      owner_id,
      name,
      location,
      description,
      price_per_slot: Number(price_per_slot),
      facilities, // Keep legacy field for now
      images: imageArray,
      images_urls: imageArray, // New column
      is_active: true,
      verification_status: 'pending', // Default
      submitted_at: new Date(),
      google_maps_url: google_maps_link,
    };

    if (latitude && longitude) {
      turfData.latitude = latitude;
      turfData.longitude = longitude;
    }
    if (formatted_address) turfData.formatted_address = formatted_address;

    const { data: turf, error: turfError } = await supabase
      .from("turfs")
      .insert([turfData])
      .select()
      .single();

    if (turfError) {
      console.error("Create turf error:", turfError);
      return res.status(400).json({ error: turfError.message });
    }

    const turfId = turf.id;

    // 2. Insert Verification Documents
    if (verification_documents && Array.isArray(verification_documents) && verification_documents.length > 0) {
      const docsToInsert = verification_documents.map(doc => ({
        turf_id: turfId,
        document_type: doc.type,
        document_url: doc.url,
        status: 'pending'
      }));

      const { error: docError } = await supabase
        .from('turf_verification_documents')
        .insert(docsToInsert);

      if (docError) {
        console.error("Document insert error:", docError);
        // Note: Turf is already created. We might want to warn or cleanup, but for now just log.
      }
    }

    // 3. Create Initial History Record
    await supabase.from('turf_verification_history').insert({
      turf_id: turfId,
      old_status: null,
      new_status: 'pending',
      changed_by: null, // System/Owner
      change_reason: 'Initial submission'
    });

    console.log("✅ Turf submitted for verification:", turfId);
    res.status(201).json(turf);

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
    .eq("is_active", true)

  // TEMPORARY: Commenting out is_listed check until we verify it works
  // .eq("is_listed", true); 

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,location.ilike.%${search}%,facilities.ilike.%${search}%`,
    );
  }

  if (location) {
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

  // 2) Matches played
  const { data: slots, error: sErr } = await supabase
    .from("slots")
    .select("id, turf_id")
    .in("turf_id", turfIds);

  if (sErr) console.warn("Failed to load slots for turf stats", sErr);

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
  const keywords = ["Football", "Cricket", "Badminton", "Tennis", "Basketball", "Hockey"];
  const enriched = data.map((t) => {
    const text = `${t.name} ${t.description} ${t.facilities}`.toLowerCase();
    const sports = keywords.filter((k) => text.includes(k.toLowerCase()));

    const tournamentsHosted = tournamentsByTurf[t.id] || 0;
    const matchesPlayed = bookingsByTurf[t.id] || 0;
    const isPopular = tournamentsHosted >= 5 || matchesPlayed >= 20;

    return {
      ...t,
      sports: sports.length > 0 ? sports : ["Football", "Cricket"],
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
    const { status } = req.query; // pending, approved, rejected

    let query = supabase
      .from("turfs")
      .select("*")
      .eq("owner_id", owner_id)
      .order("id", { ascending: false });

    // Filter by verification status if requested
    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await query;

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
      .select(`
        *,
        turf_verification_documents (*)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      if (error) console.error("Error fetching turf:", error);
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

    if (error) return res.status(400).json({ error: error.message });
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
      .select(`*, users(id, name, profile_image_url)`)
      .eq("turf_id", id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
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
      .select(`*, users(id, name, profile_image_url)`)
      .eq("turf_id", id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
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
    const { id } = req.params;
    const userId = req.user.id;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment is required" });
    }

    if (comment.length > 3000) {
      return res.status(400).json({ error: "Comment is too long (max ~60 lines)" });
    }

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
    const { id, commentId } = req.params;
    const requesterId = req.user.id;

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
======================= */
exports.deleteTurf = async (req, res) => {
  try {
    const turfId = req.params.id;
    const ownerId = req.user.id;

    if (!turfId) return res.status(400).json({ error: "Turf ID is required" });

    const { data: turf, error: fetchError } = await supabase
      .from("turfs")
      .select("id, owner_id, name")
      .eq("id", turfId)
      .single();

    if (fetchError || !turf) return res.status(404).json({ error: "Turf not found" });

    if (turf.owner_id !== ownerId) {
      return res.status(403).json({ error: "You don't have permission to delete this turf" });
    }

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

/* =======================
   UPLOAD VERIFICATION DOCS
======================= */
exports.uploadTurfDocuments = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No documents uploaded" });
  }

  try {
    const docUrls = req.files.map((file) => `/uploads/turfs/${file.filename}`);
    res.json({
      success: true,
      document_urls: docUrls,
      count: docUrls.length
    });
  } catch (err) {
    console.error("[uploadTurfDocuments] Unexpected error", err);
    res.status(500).json({ error: "Failed to upload documents" });
  }
};
