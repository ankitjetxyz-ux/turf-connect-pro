const supabase = require("../config/db");
const Razorpay = require("razorpay");
const { sendEmail } = require("../services/emailService");

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
    : null;

/* =====================
   CONSTANTS
===================== */
const OWNER_MONTHLY_CANCEL_LIMIT = 10;
const OWNER_CANCEL_PENALTY = 80; // ₹80 total (₹30 penalty + ₹50 platform)
const PLAYER_MONTHLY_CANCEL_LIMIT = 5;
const PLAYER_REFUND_THRESHOLD_HOURS = 2; // 100% refund if cancelled 2+ hours before slot


/* =====================
   BOOK SLOT (LEGACY)
===================== */
exports.bookSlot = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { slot_id } = req.body;

    // Fetch slot with price so we can persist total_amount on the booking
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("id, price, turfs(owner_id, verification_status)")
      .eq("id", slot_id)
      .eq("is_booked", false)
      .eq("turfs.verification_status", "approved")
      .single();

    if (slotError || !slot) {
      if (slotError) {
        console.error("[bookSlot] Slot fetch error:", slotError);
      }
      return res.status(400).json({ error: "Slot not available" });
    }

    const slotPrice = Number(slot.price) || 0;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id,
        slot_id,
        status: "confirmed",
        total_amount: slotPrice,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("[bookSlot] Booking insert error", bookingError);
      return res.status(500).json({ error: "Booking failed" });
    }

    const { error: slotUpdateError } = await supabase
      .from("slots")
      .update({ is_booked: true })
      .eq("id", slot_id);

    if (slotUpdateError) {
      console.error("[bookSlot] Error updating slot:", slotUpdateError);
      // Booking already created, but slot wasn't marked as booked
      // This is a data consistency issue but we still return success
    }

    res.status(201).json({ message: "Slot booked", booking_id: booking.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed" });
  }
};

/* =====================
   CREATE BOOKING + ORDER
===================== */
exports.createBookingAndOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Payments not configured" });
    }

    const user_id = req.user.id;
    const { slot_ids } = req.body;

    if (!Array.isArray(slot_ids) || slot_ids.length === 0) {
      return res.status(400).json({ error: "No slots selected" });
    }

    // Fetch selected slots that are still available
    const { data: allSlots, error: slotsError } = await supabase
      .from("slots")
      .select("id, price, is_booked, status, locked_by, turf_id, turfs(owner_id, verification_status)")
      .in("id", slot_ids)
      .eq("is_booked", false)
      .eq("turfs.verification_status", "approved");

    if (slotsError) {
      console.error("[createBookingAndOrder] Slots fetch error", slotsError);
      return res.status(500).json({ error: "Failed to load slots" });
    }

    // Filter: Slot must be 'available' OR ('held' AND locked_by === user_id)
    const validSlots = (allSlots || []).filter(s => {
      if (s.status === 'available') return true;
      if (s.status === 'held' && s.locked_by === user_id) return true;
      return false;
    });

    if (validSlots.length !== slot_ids.length) {
      return res.status(400).json({ error: "One or more slots are unavailable or held by another user" });
    }

    // Proceed with validSlots
    const slotsToBook = validSlots; // Use this alias to minimize changes below if needed, or just use validSlots
    const slots = validSlots; // Shadowing variable for minimal diff? No, let's just use validSlots. 
    // Actually, I can just update the check below.


    if (!slots || slots.length !== slot_ids.length) {
      return res.status(400).json({ error: "One or more slots unavailable" });
    }

    // All selected slots belong to the same turf owner
    const ownerId = slots[0].turfs.owner_id;
    const totalAmount = slots.reduce((s, x) => s + Number(x.price), 0);

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      payment_capture: 1
    });

    // Create one booking per slot, linked by the same Razorpay order id.
    // We also persist per-booking total_amount so it satisfies the DB NOT NULL constraint
    // defined in the schema and keeps aggregates correct.
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .insert(
        slots.map((s) => ({
          user_id,
          slot_id: s.id,
          status: "pending",
          razorpay_order_id: order.id,
          total_amount: Number(s.price) || 0,
        }))
      )
      .select();

    if (bookingError || !bookings || bookings.length === 0) {
      console.error("[createBookingAndOrder] Booking insert error", bookingError);
      return res.status(500).json({ error: "Failed to create bookings" });
    }

    // Create a payment record used later in /payments/verify.
    // We align with the payments schema used in paymentController (status + payer_id).
    const paymentPayload = {
      booking_id: bookings[0].id,
      booking_ids: bookings.map((b) => b.id),
      turf_id: ownerId, // used as owner entity id in earnings logic
      payer_id: user_id,
      amount: totalAmount,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "pending"
    };

    const { error: paymentError } = await supabase
      .from("payments")
      .insert(paymentPayload);

    if (paymentError) {
      console.error("[createBookingAndOrder] Payment insert error", paymentError);
      // We still return order + bookings so client can attempt payment; backend can reconcile.
    }

    res.json({
      booking_ids: bookings.map((b) => b.id),
      order,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("[createBookingAndOrder] Unexpected error", err);
    res.status(500).json({ error: "Payment order failed" });
  }
};

/* =====================
   PLAYER BOOKINGS
===================== */
exports.getMyBookings = async (req, res) => {
  try {
    // Only show upcoming bookings or those from the last 24 hours
    const now = new Date();
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thresholdDate = threshold.toISOString().split("T")[0];

    let query = supabase
      .from("bookings")
      .select(`
        id,
        status,
        slots(date, start_time, end_time,
          turfs(name, location)
        )
      `)
      .eq("user_id", req.user.id)
      .neq("status", "cancelled_by_user")
      .neq("status", "cancelled_by_owner")
      .neq("status", "pending") // Exclude pending bookings
      .order("created_at", { ascending: false })
      .gte("slots.date", thresholdDate);

    const { data, error } = await query;

    if (error) {
      console.error("[getMyBookings] Query error", error);
      return res.status(500).json({ error: "Failed to load bookings" });
    }

    // Fetch verification codes for these bookings
    const bookingIds = (data || []).map(b => b.id);
    let verificationCodesMap = {};
    if (bookingIds.length > 0) {
      const { data: vCodes } = await supabase
        .from("booking_verification_codes")
        .select("booking_id, verification_code, expires_at")
        .in("booking_id", bookingIds)
        .eq("booking_type", "turf");

      if (vCodes) {
        vCodes.forEach(vc => {
          verificationCodesMap[vc.booking_id] = {
            code: vc.verification_code,
            expires_at: vc.expires_at
          };
        });
      }
    }

    // Shape data for PlayerDashboard expectations
    const formatted = (data || []).map((b) => ({
      id: b.id,
      status: b.status,
      turf_name: b.slots?.turfs?.name || null,
      location: b.slots?.turfs?.location || null,
      slot_time:
        b.slots?.date && b.slots?.start_time && b.slots?.end_time
          ? `${b.slots.date} ${b.slots.start_time} - ${b.slots.end_time}`
          : null,
      verification_code: verificationCodesMap[b.id]?.code || null,
      verification_expires_at: verificationCodesMap[b.id]?.expires_at || null
    }));

    res.json(formatted);
  } catch (err) {
    console.error("[getMyBookings] Unexpected error", err);
    res.status(500).json({ error: "Failed to load bookings" });
  }
};

/* =====================
   PLAYER CANCEL (Enhanced with refund logic)
===================== */
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const userId = req.user.id;

    // 1. Get booking with slot and turf details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id, slot_id, total_amount, status, turf_id,
        slots(date, start_time, turf_id, turfs(name, owner_id, users:owner_id(email, name)))
      `)
      .eq("id", booking_id)
      .eq("user_id", userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return res.status(400).json({ error: "This booking cannot be cancelled" });
    }

    // 2. Check if slot has already started
    const slotDate = booking.slots?.date;
    const slotStartTime = booking.slots?.start_time;
    if (slotDate && slotStartTime) {
      const slotDateTime = new Date(`${slotDate}T${slotStartTime}`);
      if (new Date() >= slotDateTime) {
        return res.status(400).json({ error: "Cannot cancel after slot start time" });
      }
    }

    // 3. Check monthly cancellation limit
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { count: monthlyCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "cancelled_by_player")
      .gte("created_at", `${currentMonth}-01`);

    if (monthlyCount >= PLAYER_MONTHLY_CANCEL_LIMIT) {
      return res.status(400).json({
        error: "Monthly cancellation limit reached. You cannot cancel more bookings this month.",
        limit_reached: true
      });
    }

    // 4. Calculate refund amount
    let refundAmount = 0;
    let refundPercent = 0;
    if (slotDate && slotStartTime) {
      const slotDateTime = new Date(`${slotDate}T${slotStartTime}`);
      const hoursUntilSlot = (slotDateTime - new Date()) / (1000 * 60 * 60);

      if (hoursUntilSlot >= PLAYER_REFUND_THRESHOLD_HOURS) {
        refundAmount = booking.total_amount || 0;
        refundPercent = 100;
      } else {
        refundAmount = 0;
        refundPercent = 0;
      }
    }

    // 5. Update booking status
    await supabase
      .from("bookings")
      .update({
        status: "cancelled_by_player",
        refund_amount: refundAmount,
        cancelled_at: new Date().toISOString()
      })
      .eq("id", booking_id);

    // 6. Free the slot
    await supabase.from("slots").update({ is_booked: false, status: "available" }).eq("id", booking.slot_id);

    // 7. Notify turf owner via email
    const ownerEmail = booking.slots?.turfs?.users?.email;
    const ownerName = booking.slots?.turfs?.users?.name || "Owner";
    const turfName = booking.slots?.turfs?.name || "Your turf";
    const playerName = req.user.name || "A player";

    if (ownerEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Booking Cancelled by Player</h2>
          <p>Dear ${ownerName},</p>
          <p>${playerName} has cancelled their booking for <strong>${turfName}</strong>.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Slot:</strong> ${slotDate} at ${slotStartTime}</p>
            <p>The slot is now available for other bookings.</p>
          </div>
          <p>Best regards,<br/>Turf Connect Team</p>
        </div>
      `;
      sendEmail({ to: ownerEmail, subject: "Booking Cancelled - Turf Connect", html }).catch(console.error);
    }

    res.json({
      message: "Booking cancelled successfully",
      refund_amount: refundAmount,
      refund_percent: refundPercent,
      cancellations_remaining: PLAYER_MONTHLY_CANCEL_LIMIT - monthlyCount - 1
    });
  } catch (err) {
    console.error("[cancelBooking] Error:", err);
    res.status(500).json({ error: "Cancellation failed" });
  }
};

/* =====================
   GET CANCELLATION INFO (for modal preview)
===================== */
exports.getCancellationInfo = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const userId = req.user.id;

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, total_amount, slots(date, start_time)")
      .eq("id", booking_id)
      .eq("user_id", userId)
      .single();

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Calculate time until slot
    const slotDate = booking.slots?.date;
    const slotStartTime = booking.slots?.start_time;
    let hoursUntilSlot = 999;
    let refundAmount = 0;
    let refundPercent = 0;

    if (slotDate && slotStartTime) {
      const slotDateTime = new Date(`${slotDate}T${slotStartTime}`);
      hoursUntilSlot = Math.max(0, (slotDateTime - new Date()) / (1000 * 60 * 60));

      if (hoursUntilSlot >= PLAYER_REFUND_THRESHOLD_HOURS) {
        refundAmount = booking.total_amount || 0;
        refundPercent = 100;
      }
    }

    // Check monthly count
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { count: monthlyCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "cancelled_by_player")
      .gte("created_at", `${currentMonth}-01`);

    res.json({
      booking_amount: booking.total_amount || 0,
      refund_amount: refundAmount,
      refund_percent: refundPercent,
      hours_until_slot: Math.round(hoursUntilSlot * 10) / 10,
      monthly_cancellations: monthlyCount || 0,
      monthly_limit: PLAYER_MONTHLY_CANCEL_LIMIT,
      can_cancel: (monthlyCount || 0) < PLAYER_MONTHLY_CANCEL_LIMIT && hoursUntilSlot > 0
    });
  } catch (err) {
    console.error("[getCancellationInfo] Error:", err);
    res.status(500).json({ error: "Failed to get cancellation info" });
  }
};

/* =====================
   OWNER CANCEL (Enhanced with penalty and limits)
===================== */
exports.ownerCancelBooking = async (req, res) => {
  try {
    const { booking_id, reason } = req.body;
    const ownerId = req.user.id;

    // 1. Require cancellation reason
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: "Cancellation reason is required (min 5 characters)" });
    }

    // 2. Get booking with all necessary details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id, slot_id, total_amount, user_id,
        slots(date, start_time, turfs(owner_id, name)),
        users:user_id(email, name)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!booking.slots || !booking.slots.turfs || booking.slots.turfs.owner_id !== ownerId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 3. Check monthly cancellation limit for owner
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { count: monthlyCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled_by_owner")
      .eq("slots.turfs.owner_id", ownerId)
      .gte("cancelled_at", `${currentMonth}-01`);

    // Alternative: count from owner's turfs bookings
    const { data: ownerTurfs } = await supabase
      .from("turfs")
      .select("id")
      .eq("owner_id", ownerId);

    const turfIds = (ownerTurfs || []).map(t => t.id);

    let ownerCancelCount = 0;
    if (turfIds.length > 0) {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "cancelled_by_owner")
        .in("turf_id", turfIds)
        .gte("cancelled_at", `${currentMonth}-01T00:00:00`);
      ownerCancelCount = count || 0;
    }

    if (ownerCancelCount >= OWNER_MONTHLY_CANCEL_LIMIT) {
      return res.status(400).json({
        error: "Monthly cancellation limit reached. You cannot cancel more bookings this month.",
        limit_reached: true
      });
    }

    // 4. Update booking with cancellation details
    await supabase
      .from("bookings")
      .update({
        status: "cancelled_by_owner",
        cancellation_reason: reason.trim(),
        penalty_applied: OWNER_CANCEL_PENALTY,
        refund_amount: booking.total_amount || 0, // 100% refund to player
        cancelled_at: new Date().toISOString()
      })
      .eq("id", booking_id);

    // 5. Free the slot
    await supabase.from("slots").update({ is_booked: false, status: "available" }).eq("id", booking.slot_id);

    // 6. Send email to player about cancellation and refund
    const playerEmail = booking.users?.email;
    const playerName = booking.users?.name || "Player";
    const turfName = booking.slots?.turfs?.name || "the turf";
    const slotDate = booking.slots?.date;
    const slotTime = booking.slots?.start_time;

    if (playerEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Booking Cancelled by Turf Owner</h2>
          <p>Dear ${playerName},</p>
          <p>We regret to inform you that your booking at <strong>${turfName}</strong> has been cancelled by the owner.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Slot:</strong> ${slotDate} at ${slotTime}</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Full Refund</h3>
            <p>You will receive a <strong>100% refund</strong> of ₹${booking.total_amount || 0}.</p>
            <p>The refund will be processed within 5-7 business days.</p>
          </div>
          <p>We apologize for any inconvenience.</p>
          <p>Best regards,<br/>Turf Connect Team</p>
        </div>
      `;
      sendEmail({ to: playerEmail, subject: "Booking Cancelled - Full Refund Initiated", html }).catch(console.error);
    }

    res.json({
      message: "Booking cancelled. ₹80 penalty has been applied. Player will receive a full refund.",
      penalty_applied: OWNER_CANCEL_PENALTY,
      refund_to_player: booking.total_amount || 0,
      cancellations_remaining: OWNER_MONTHLY_CANCEL_LIMIT - ownerCancelCount - 1
    });
  } catch (err) {
    console.error("[ownerCancelBooking] Error:", err);
    res.status(500).json({ error: "Cancellation failed" });
  }
};

/* =====================
   GET OWNER CANCELLATION STATS
===================== */
exports.getOwnerCancellationStats = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: ownerTurfs } = await supabase
      .from("turfs")
      .select("id")
      .eq("owner_id", ownerId);

    const turfIds = (ownerTurfs || []).map(t => t.id);

    let cancelCount = 0;
    let totalPenalty = 0;

    if (turfIds.length > 0) {
      const { data: cancelledBookings } = await supabase
        .from("bookings")
        .select("penalty_applied")
        .eq("status", "cancelled_by_owner")
        .in("turf_id", turfIds)
        .gte("cancelled_at", `${currentMonth}-01T00:00:00`);

      cancelCount = cancelledBookings?.length || 0;
      totalPenalty = cancelledBookings?.reduce((sum, b) => sum + (b.penalty_applied || 0), 0) || 0;
    }

    res.json({
      month: currentMonth,
      cancellation_count: cancelCount,
      monthly_limit: OWNER_MONTHLY_CANCEL_LIMIT,
      cancellations_remaining: Math.max(0, OWNER_MONTHLY_CANCEL_LIMIT - cancelCount),
      total_penalty: totalPenalty
    });
  } catch (err) {
    console.error("[getOwnerCancellationStats] Error:", err);
    res.status(500).json({ error: "Failed to get stats" });
  }
};

/* =====================
CLIENT BOOKINGS (Enhanced with pagination and date filter)
===================== */
exports.getClientBookings = async (req, res) => {
  try {
    const { limit = 5, offset = 0, date, show_all = false } = req.query;
    const parsedLimit = parseInt(limit) || 5;
    const parsedOffset = parseInt(offset) || 0;

    // Step 1: Get all turf IDs owned by this client
    const { data: turfs, error: turfsError } = await supabase
      .from("turfs")
      .select("id")
      .eq("owner_id", req.user.id);

    if (turfsError) {
      console.error("[getClientBookings] Turfs fetch error", turfsError);
      return res.status(500).json({ error: "Failed to load turfs" });
    }

    if (!turfs || turfs.length === 0) {
      return res.json({ bookings: [], total: 0, has_more: false });
    }

    const turfIds = turfs.map(t => t.id);

    // Step 2: Build query with filters
    let query = supabase
      .from("bookings")
      .select(`
        id,
        status,
        turf_id,
        slot_id,
        total_amount,
        created_at,
        users!bookings_user_id_fkey(id, name, email),
        slots(date, start_time, end_time,
          turfs(name, location)
        )
      `, { count: "exact" })
      .in("turf_id", turfIds)
      .neq("status", "cancelled_by_player")
      .neq("status", "cancelled_by_owner")
      .neq("status", "pending");

    // Filter by date logic
    if (date) {
      // Specific date provided
      query = query.eq("slots.date", date);
    } else {
      const { date_filter } = req.query;
      const today = new Date().toISOString().split("T")[0];

      if (date_filter === 'all' || show_all === 'true') {
        // No date filter - show everything
      } else if (date_filter === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const weekAgo = d.toISOString().split("T")[0];
        query = query.gte("slots.date", weekAgo);
      } else if (date_filter === 'month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const monthAgo = d.toISOString().split("T")[0];
        query = query.gte("slots.date", monthAgo);
      } else if (date_filter === 'today') {
        query = query.eq("slots.date", today);
      } else {
        // Default: todays bookings
        query = query.eq("slots.date", today);
      }
    }

    // Apply pagination and sorting
    query = query
      .order("created_at", { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    const { data, error, count } = await query;

    // DEBUG: Log first booking to see structure
    if (data && data.length > 0) {
      console.log("[getClientBookings] Sample booking data:", JSON.stringify(data[0], null, 2));
    }

    if (error) {
      console.error("[getClientBookings] Query error", error);
      return res.status(500).json({ error: "Failed to load client bookings" });
    }

    // Fetch verification codes
    const bookingIds = (data || []).map(b => b.id);
    let verificationCodesMap = {};
    if (bookingIds.length > 0) {
      const { data: vCodes } = await supabase
        .from("booking_verification_codes")
        .select("booking_id, verification_code, expires_at")
        .in("booking_id", bookingIds)
        .eq("booking_type", "turf");

      if (vCodes) {
        vCodes.forEach(vc => {
          verificationCodesMap[vc.booking_id] = {
            code: vc.verification_code,
            expires_at: vc.expires_at
          };
        });
      }
    }

    // Shape data
    const formatted = (data || []).map((b) => ({
      id: b.id,
      status: b.status,
      turf_name: b.slots?.turfs?.name || null,
      turf_location: b.slots?.turfs?.location || null,
      player_name: b.users?.name || null,
      player_email: b.users?.email || null,
      player_id: b.users?.id || null,
      total_amount: b.total_amount || 0,
      slot_date: b.slots?.date || null,
      slot_start_time: b.slots?.start_time || null,
      slot_end_time: b.slots?.end_time || null,
      slot_time:
        b.slots?.date && b.slots?.start_time && b.slots?.end_time
          ? `${b.slots.date} ${b.slots.start_time} - ${b.slots.end_time}`
          : null,
      created_at: b.created_at,
      verification_code: verificationCodesMap[b.id]?.code || null,
      verification_expires_at: verificationCodesMap[b.id]?.expires_at || null
    }));

    // For backward compatibility, check if old format expected
    if (req.query.legacy === "true") {
      return res.json(formatted);
    }

    res.json({
      bookings: formatted,
      total: count || 0,
      has_more: (parsedOffset + parsedLimit) < (count || 0),
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (err) {
    console.error("[getClientBookings] Unexpected error", err);
    res.status(500).json({ error: "Failed to load client bookings" });
  }
};
