const supabase = require("../config/db");

/* =========================
   GET ALL PROMOTIONAL VIDEOS (PUBLIC)
   - Only returns active videos, ordered by display_order
========================= */
exports.getAllPromotionalVideos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("promotional_videos")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error("[getAllPromotionalVideos] Unexpected error", err);
    res.status(500).json({ error: "Failed to load promotional videos" });
  }
};

/* =========================
   CREATE PROMOTIONAL VIDEO (ADMIN)
========================= */
exports.createPromotionalVideo = async (req, res) => {
  try {
    const { title, video_url, thumbnail_url, display_order, is_active } = req.body;
    const created_by = req.user.id;

    if (!video_url) {
      return res.status(400).json({ error: "video_url is required" });
    }

    const { data, error } = await supabase
      .from("promotional_videos")
      .insert([
        {
          title,
          video_url,
          thumbnail_url,
          display_order: display_order || 0,
          is_active: is_active !== undefined ? is_active : true,
          created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("[createPromotionalVideo] Unexpected error", err);
    res.status(500).json({ error: "Failed to create promotional video" });
  }
};

/* =========================
   UPDATE PROMOTIONAL VIDEO (ADMIN)
========================= */
exports.updatePromotionalVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, video_url, thumbnail_url, display_order, is_active } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (video_url !== undefined) updates.video_url = video_url;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("promotional_videos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("[updatePromotionalVideo] Unexpected error", err);
    res.status(500).json({ error: "Failed to update promotional video" });
  }
};

/* =========================
   DELETE PROMOTIONAL VIDEO (ADMIN)
========================= */
exports.deletePromotionalVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("promotional_videos")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Promotional video deleted" });
  } catch (err) {
    console.error("[deletePromotionalVideo] Unexpected error", err);
    res.status(500).json({ error: "Failed to delete promotional video" });
  }
};

