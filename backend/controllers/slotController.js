const supabase = require("../config/db");

exports.createSlot = async (req, res) => {
  try {
    const { turf_id, date, start_time, end_time, price } = req.body;

    if (!turf_id || !start_time || !end_time || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Ensure we always have a valid date (schema requires NOT NULL)
    // Accept explicit date from client; otherwise default to today's date (UTC)
    const slotDate =
      date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("slots")
      .insert([
        {
          turf_id,
          date: slotDate,
          start_time,
          end_time,
          price,
          is_booked: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating slot:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(500).json({ error: "Slot created but no data returned" });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Create slot crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSlotsByTurf = async (req, res) => {
  try {
    const { turfId } = req.params;

    if (!turfId) {
      return res.status(400).json({ error: "Turf ID is required" });
    }

    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("turf_id", turfId)
      .order("start_time");

    if (error) {
      console.error("Error fetching slots:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Get slots by turf error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, start_time, end_time } = req.body;

    // Verify ownership (or relies on client-side check + RLS, but controller verification is safer)
    // For now, assuming middleware checks role permissions or simple direct update.
    // Ideally: check if slot belongs to turf owned by user.

    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("turf_id, turfs(owner_id)")
      .eq("id", id)
      .single();
    
    if (slotError || !slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    if (!slot.turfs || slot.turfs.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("slots")
      .update({ price, start_time, end_time })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating slot:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Slot not found after update" });
    }

    res.json(data);
  } catch (err) {
    console.error("Update slot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("turf_id, turfs(owner_id)")
      .eq("id", id)
      .single();
    
    if (slotError || !slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    if (!slot.turfs || slot.turfs.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) {
      console.error("Error deleting slot:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Slot deleted" });
  } catch (err) {
    console.error("Delete slot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
