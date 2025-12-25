const supabase = require("../config/db");

exports.createSlot = async (req, res) => {
  const { turf_id, start_time, end_time, price } = req.body;

  const { data, error } = await supabase
    .from("slots")
    .insert([
      {
        turf_id,
        start_time,
        end_time,
        price,
        is_available: true,
      },
    ])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
};

exports.getSlotsByTurf = async (req, res) => {
  const { turfId } = req.params;

  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .eq("turf_id", turfId)
    .order("start_time");

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
};
