const supabase = require("../config/db");

/* =======================
   BOOK SLOT (PLAYER)
======================= */
exports.bookSlot = async (req, res) => {
  const user_id = req.user.id;
  const { slot_id } = req.body;

  const { data: slot } = await supabase
    .from("slots")
    .select(`
      id,
      turfs (
        owner_id
      )
    `)
    .eq("id", slot_id)
    .eq("is_available", true)
    .single();

  if (!slot) {
    return res.status(400).json({ error: "Slot not available" });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .insert([
      {
        user_id,
        slot_id,
        status: "confirmed",
      },
    ])
    .select()
    .single();

  await supabase
    .from("slots")
    .update({ is_available: false })
    .eq("id", slot_id);

  await supabase.from("chats").insert([
    {
      booking_id: booking.id,
      player_id: user_id,
      owner_id: slot.turfs.owner_id,
    },
  ]);

  res.status(201).json({
    message: "Slot booked successfully",
    booking_id: booking.id,
  });
};
/* =======================
   GET PLAYER BOOKINGS
======================= */
exports.getMyBookings = async (req, res) => {
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      slots (
        start_time,
        end_time,
        turfs (
          name,
          location
        )
      )
    `)
    .eq("user_id", user_id)
    .order("id", { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const formatted = data.map(b => ({
    id: b.id,
    status: b.status,
    turf_name: b.slots?.turfs?.name || "Unknown Turf",
    location: b.slots?.turfs?.location || "Unknown Location",
    slot_time: b.slots
      ? `${b.slots.start_time} - ${b.slots.end_time}`
      : "N/A",
  }));

  res.json(formatted);
};

/* =======================
   CANCEL BOOKING (PLAYER)
======================= */
exports.cancelBooking = async (req, res) => {
  const user_id = req.user.id;
  const { booking_id } = req.body;

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .eq("user_id", user_id)
    .eq("status", "confirmed")
    .single();

  if (!booking) {
    return res
      .status(400)
      .json({ error: "Booking not found or already cancelled" });
  }

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking_id);

  await supabase
    .from("slots")
    .update({ is_available: true })
    .eq("id", booking.slot_id);

  res.json({ message: "Booking cancelled successfully" });
};

/* =======================
   GET CLIENT BOOKINGS
======================= */
exports.getClientBookings = async (req, res) => {
  const owner_id = req.user.id;

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      users (
        name,
        email
      ),
      slots (
        start_time,
        end_time,
        turfs (
          name,
          owner_id
        )
      )
    `)
    .eq("slots.turfs.owner_id", owner_id)
    .order("id", { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const formatted = data.map(b => ({
    id: b.id,
    status: b.status,
    player_name: b.users?.name || "Unknown",
    player_email: b.users?.email || "N/A",
    turf_name: b.slots?.turfs?.name || "Unknown Turf",
    slot_time: b.slots
      ? `${b.slots.start_time} - ${b.slots.end_time}`
      : "N/A",
  }));

  res.json(formatted);
};
