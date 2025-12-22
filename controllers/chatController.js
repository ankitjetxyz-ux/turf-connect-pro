const getChatByBookingId = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (chatError) {
    return res.status(500).json({ error: chatError.message });
  }

  if (chat) {
    if (![chat.player_id, chat.owner_id].includes(userId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    return res.json(chat);
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      user_id,
      slots (
        turfs ( owner_id )
      )
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (![booking.user_id, booking.slots.turfs.owner_id].includes(userId)) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const { data: newChat, error } = await supabase
    .from("chats")
    .insert({
      booking_id: bookingId,
      player_id: booking.user_id,
      owner_id: booking.slots.turfs.owner_id,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(newChat);
};
