const supabase = require("../config/db");

/* =========================
   CREATE CONVERSATION
   (Player ↔ Turf Owner)
========================= */
exports.createConversation = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { owner_id, client_id, player_id } = req.body;

    const targetOwnerId = owner_id || client_id;

    if (!targetOwnerId || !player_id) {
      return res.status(400).json({ error: "owner_id and player_id are required" });
    }

    // Security: requester must be part of chat
    if (requesterId !== targetOwnerId && requesterId !== player_id) {
      return res.status(403).json({ error: "You can only create chats for yourself" });
    }

    // Ensure confirmed booking exists
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select(`slots!inner(turfs!inner(owner_id))`)
      .eq("user_id", player_id)
      .eq("status", "confirmed")
      .eq("slots.turfs.owner_id", targetOwnerId)
      .limit(1);

    if (bookingError) {
      console.error("Booking verification error:", bookingError);
      return res.status(500).json({ error: "Failed to verify booking" });
    }

    if (!bookings || bookings.length === 0) {
      return res.status(403).json({
        error: "Chat allowed only after confirmed booking"
      });
    }

    // Return existing chat if present
    const { data: existing, error: existingError } = await supabase
      .from("chats")
      .select("*")
      .match({ owner_id: targetOwnerId, player_id })
      .maybeSingle();

    // If error occurs but it's not a "not found" error, log it
    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error checking existing chat:", existingError);
    }

    if (existing) return res.json(existing);

    const { data, error } = await supabase
      .from("chats")
      .insert({ owner_id: targetOwnerId, player_id })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("createConversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

/* =========================
   LIST USER CONVERSATIONS
========================= */
exports.listConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    let { data: conversations, error } = await supabase
      .from("chats")
      .select("*")
      .or(`owner_id.eq.${userId},player_id.eq.${userId}`)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Get favorites for this user
    const { data: favorites } = await supabase
      .from("chat_favorites")
      .select("chat_id")
      .eq("user_id", userId);

    const favoriteChatIds = new Set((favorites || []).map((f) => f.chat_id));

    // Enrich with other user details and favorite status
    const enriched = await Promise.all(
      (conversations || []).map(async (chat) => {
        const otherUserId =
          chat.owner_id === userId ? chat.player_id : chat.owner_id;

        const { data: user } = await supabase
          .from("users")
          .select("id, name, email, profile_image_url")
          .eq("id", otherUserId)
          .single();

        return {
          ...chat,
          other_user: user || { name: "Unknown", email: "" },
          is_favorite: favoriteChatIds.has(chat.id),
        };
      })
    );

    // Sort: favorites first, then by updated_at
    enriched.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    res.json(enriched);
  } catch (err) {
    console.error("listConversations error:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
};

/* =========================
   GET CHAT MESSAGES
========================= */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    // Verify access to this chat for the current user
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (chatErr || !chat || (chat.owner_id !== userId && chat.player_id !== userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    // Mark unread messages from the other user as read.
    // Support both possible schemas:
    // - older:  messages.read (boolean)
    // - newer:  messages.is_read (boolean)
    const unreadIds = (messages || [])
      .filter((m) => {
        const otherUser = m.sender_id !== userId;
        const isReadFlag =
          Object.prototype.hasOwnProperty.call(m, "is_read")
            ? m.is_read
            : Object.prototype.hasOwnProperty.call(m, "read")
              ? m.read
              : false;
        return otherUser && !isReadFlag;
      })
      .map((m) => m.id);

    if (unreadIds.length > 0 && messages && messages.length > 0) {
      const first = messages[0];
      const hasIsRead = Object.prototype.hasOwnProperty.call(first, "is_read");
      const hasRead = Object.prototype.hasOwnProperty.call(first, "read");

      const updatePayload = hasIsRead
        ? { is_read: true }
        : hasRead
          ? { read: true }
          : null;

      if (updatePayload) {
        await supabase.from("messages").update(updatePayload).in("id", unreadIds);
      }
    }

    res.json(messages || []);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "Failed to load messages", details: err.message });
  }
};

/* =========================
   SEND MESSAGE
========================= */
exports.postMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify access to this chat for the current user
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (chatErr || !chat || (chat.owner_id !== userId && chat.player_id !== userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Insert message according to actual `messages` table schema (complete_schema.sql)
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: userId,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Update chat metadata (last_message/updated_at)
    await supabase
      .from("chats")
      .update({
        last_message: content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId);

    // Realtime: broadcast the new message to everyone in this chat room
    const io = req.app.get("io");
    if (io) io.to(chatId).emit("receive_message", message);

    res.status(201).json(message);
  } catch (err) {
    console.error("postMessage error:", err);
    res.status(500).json({ error: "Failed to send message", details: err.message });
  }
};

/* =========================
   DELETE CHAT (Turf Owner only)
========================= */
exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    // Verify chat exists and user is the owner
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Only turf owner can delete chat
    if (chat.owner_id !== userId) {
      return res.status(403).json({ error: "Only turf owner can delete chat" });
    }

    // Soft delete: mark as deleted instead of hard delete
    const { error: updateError } = await supabase
      .from("chats")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq("id", chatId);

    if (updateError) {
      console.error("Error deleting chat:", updateError);
      return res.status(500).json({ error: "Failed to delete chat" });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("deleteChat error:", err);
    res.status(500).json({ error: "Failed to delete chat", details: err.message });
  }
};

/* =========================
   TOGGLE CHAT FAVORITE
========================= */
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    // Verify chat exists and user has access
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.owner_id !== userId && chat.player_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from("chat_favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("chat_id", chatId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking favorite:", checkError);
      return res.status(500).json({ error: "Failed to check favorite status" });
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from("chat_favorites")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        console.error("Error removing favorite:", deleteError);
        return res.status(500).json({ error: "Failed to remove favorite" });
      }

      res.json({ is_favorite: false, message: "Removed from favorites" });
    } else {
      // Add favorite
      const { data, error: insertError } = await supabase
        .from("chat_favorites")
        .insert({ user_id: userId, chat_id: chatId })
        .select()
        .single();

      if (insertError) {
        console.error("Error adding favorite:", insertError);
        return res.status(500).json({ error: "Failed to add favorite" });
      }

      res.json({ is_favorite: true, message: "Added to favorites" });
    }
  } catch (err) {
    console.error("toggleFavorite error:", err);
    res.status(500).json({ error: "Failed to toggle favorite", details: err.message });
  }
};
