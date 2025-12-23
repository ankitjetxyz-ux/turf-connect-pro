const supabase = require("../config/db");

/** Create or return existing conversation between client and player */
exports.createConversation = async (req, res, next) => {
  try {
    const { client_id, owner_id, player_id } = req.body;
    // Support both owner_id (schema correct) and client_id (legacy)
    const targetOwnerId = owner_id || client_id;

    if (!targetOwnerId || !player_id) return res.status(400).json({ error: "owner_id and player_id required" });

    // 1. Check for existing booking (confirmed)
    // We need to ensure the player has booked at least one slot with this owner
    // We query bookings -> slots -> turfs -> owner_id
    // Supabase filtering on related tables:
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        slots!inner (
          turfs!inner (
            owner_id
          )
        )
      `)
      .eq("user_id", player_id)
      .eq("status", "confirmed")
      .eq("slots.turfs.owner_id", targetOwnerId)
      .limit(1);

    if (bookingError) {
      console.error("Booking check error:", bookingError);
      return res.status(500).json({ error: "Failed to verify booking status" });
    }

    // STRICT: Allow chat ONLY if booking exists
    if (!bookings || bookings.length === 0) {
      return res.status(403).json({ 
        error: "Chat is allowed only after a confirmed booking with this turf owner." 
      });
    }

    // Check existing conversation where both match
    const { data: existing, error: exErr } = await supabase
      .from("chats")
      .select("*")
      .match({ owner_id: targetOwnerId, player_id })
      .limit(1);

    if (exErr) return next(exErr);
    if (existing && existing.length > 0) return res.json(existing[0]);

    const { data, error } = await supabase.from("chats").insert({ owner_id: targetOwnerId, player_id }).select().single();
    if (error) return next(error);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.listConversations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Fetch conversations where user is owner or player
    const { data: conversations, error } = await supabase
      .from("chats")
      .select("*")
      .or(`owner_id.eq.${userId},player_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) return next(error);

    // Fetch user details for each conversation
    const enrichedConversations = await Promise.all(
      conversations.map(async (chat) => {
        const otherUserId = chat.owner_id === userId ? chat.player_id : chat.owner_id;
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", otherUserId)
          .single();
        
        return {
          ...chat,
          other_user: user || { name: "Unknown User", email: "" }
        };
      })
    );

    res.json(enrichedConversations);
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(100); // Limit to last 100 messages for performance

    if (error) return next(error);
    // mark unread messages as read for this user
    if (req.user && data && data.length > 0) {
      const toMark = data.filter(m => m.sender_id !== req.user.id && !m.read).map(m => m.id);
      if (toMark.length > 0) {
        await supabase.from("messages").update({ read: true }).in("id", toMark);
        // optionally reset unread_count on chats
        await supabase.from("chats").update({ unread_count: 0 }).eq("id", chatId);
      }
    }
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

exports.postMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { sender_id, sender_role, content, metadata } = req.body;
    if (!sender_id || !sender_role || !content) return res.status(400).json({ error: "missing fields" });

    const { data: message, error: insertErr } = await supabase
      .from("messages")
      .insert({ chat_id: chatId, sender_id, sender_role, content, metadata })
      .select()
      .single();

    if (insertErr) return next(insertErr);

    // update chat last_message and updated_at
    await supabase.from("chats").update({ last_message: content, updated_at: new Date().toISOString() }).eq("id", chatId);

    res.json(message);
  } catch (err) {
    next(err);
  }
};
