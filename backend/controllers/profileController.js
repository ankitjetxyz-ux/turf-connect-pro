const supabase = require("../config/db");

/* =========================
   GET MY PROFILE + STATS
========================= */
exports.getMyProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, role, profile_image_url")
      .eq("id", userId)
      .single();

    if (userErr || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Stats
    let turfsBooked = 0;
    let tournamentsParticipated = 0;
    let turfsOwned = 0;
    let tournamentsHosted = 0;

    if (user.role === "player") {
      const [{ data: bookings }, { data: participants }] = await Promise.all([
        supabase
          .from("bookings")
          .select("id")
          .eq("user_id", userId),
        supabase
          .from("tournament_participants")
          .select("id")
          .eq("user_id", userId)
          .eq("payment_status", "paid"),
      ]);

      turfsBooked = bookings?.length || 0;
      tournamentsParticipated = participants?.length || 0;
    }

    if (user.role === "client") {
      // Turfs owned
      const { data: turfs } = await supabase
        .from("turfs")
        .select("id")
        .eq("owner_id", userId);

      const turfIds = turfs?.map((t) => t.id) || [];
      turfsOwned = turfIds.length;

      if (turfIds.length > 0) {
        const { data: tournaments } = await supabase
          .from("tournaments")
          .select("id")
          .in("turf_id", turfIds);
        tournamentsHosted = tournaments?.length || 0;
      }
    }

    res.json({
      user,
      stats: {
        turfs_booked: turfsBooked,
        tournaments_participated: tournamentsParticipated,
        turfs_owned: turfsOwned,
        tournaments_hosted: tournamentsHosted,
      },
    });
  } catch (err) {
    console.error("[getMyProfile] Unexpected error", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
};

/* =========================
   UPDATE MY PROFILE (BASIC FIELDS)
========================= */
exports.updateMyProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, profile_image_url } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (profile_image_url !== undefined) updates.profile_image_url = profile_image_url;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, name, email, role, profile_image_url")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("[updateMyProfile] Unexpected error", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/* =========================
   UPLOAD AVATAR
========================= */
exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const userId = req.user.id;

  // Build public URL relative to backend origin
  const relativePath = `/uploads/profile/${req.file.filename}`;

  try {
    const { error } = await supabase
      .from("users")
      .update({ profile_image_url: relativePath })
      .eq("id", userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ profile_image_url: relativePath });
  } catch (err) {
    console.error("[uploadAvatar] Unexpected error", err);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
};