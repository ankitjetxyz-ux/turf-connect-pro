const supabase = require("../config/db");
const Razorpay = require("razorpay");

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
    : null;

/* =====================
   BOOK SLOT (LEGACY)
===================== */
exports.bookSlot = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { slot_id } = req.body;

    // Fetch slot with price so we can persist total_amount on the booking
    const { data: slot } = await supabase
      .from("slots")
      .select("id, price, turfs(owner_id)")
      .eq("id", slot_id)
      .eq("is_booked", false)
      .single();

    if (!slot) {
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

    await supabase.from("slots").update({ is_booked: true }).eq("id", slot_id);

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
    const { data: slots, error: slotsError } = await supabase
      .from("slots")
      .select("id, price, is_booked, turf_id, turfs(owner_id)")
      .in("id", slot_ids)
      .eq("is_booked", false);

    if (slotsError) {
      console.error("[createBookingAndOrder] Slots fetch error", slotsError);
      return res.status(500).json({ error: "Failed to load slots" });
    }

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

    // Shape data for PlayerDashboard expectations
    const formatted = (data || []).map((b) => ({
      id: b.id,
      status: b.status,
      turf_name: b.slots?.turfs?.name || null,
      location: b.slots?.turfs?.location || null,
      slot_time:
        b.slots?.date && b.slots?.start_time && b.slots?.end_time
          ? `${b.slots.date} ${b.slots.start_time} - ${b.slots.end_time}`
          : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error("[getMyBookings] Unexpected error", err);
    res.status(500).json({ error: "Failed to load bookings" });
  }
};

/* =====================
   PLAYER CANCEL
===================== */
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, slot_id")
      .eq("id", booking_id)
      .eq("user_id", req.user.id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // 1. Free the slot first
    await supabase.from("slots").update({ is_booked: false }).eq("id", booking.slot_id);

    // 2. Hard delete the booking
    await supabase
      .from("bookings")
      .delete()
      .eq("id", booking_id);

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
};

/* =====================
   OWNER CANCEL
===================== */
exports.ownerCancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.body;

    const { data: booking } = await supabase
      .from("bookings")
      .select("id, slot_id, slots(turfs(owner_id))")
      .eq("id", booking_id)
      .single();

    if (!booking || booking.slots.turfs.owner_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 1. Free the slot first
    await supabase.from("slots").update({ is_booked: false }).eq("id", booking.slot_id);

    // 2. Hard delete the booking
    await supabase
      .from("bookings")
      .delete()
      .eq("id", booking_id);

    res.json({ message: "Booking cancelled by owner" });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed" });
  }
};

/* =====================
   CLIENT BOOKINGS
===================== */
exports.getClientBookings = async (req, res) => {
  try {
    // Only show upcoming bookings or those from the last 24 hours
    const now = new Date();
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thresholdDate = threshold.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        users(id, name, email),
        slots(date, start_time, end_time,
          turfs(name, owner_id)
        )
      `)
      .eq("slots.turfs.owner_id", req.user.id)
      .neq("status", "cancelled_by_user")
      .neq("status", "cancelled_by_owner")
      .neq("status", "pending") // Exclude pending bookings
      .gte("slots.date", thresholdDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getClientBookings] Query error", error);
      return res.status(500).json({ error: "Failed to load client bookings" });
    }

    // Shape data for ClientDashboard and ClientBookings expectations
    const formatted = (data || []).map((b) => ({
      id: b.id,
      status: b.status,
      turf_name: b.slots?.turfs?.name || null,
      player_name: b.users?.name || null,
      player_id: b.users?.id || null,
      slot_time:
        b.slots?.date && b.slots?.start_time && b.slots?.end_time
          ? `${b.slots.date} ${b.slots.start_time} - ${b.slots.end_time}`
          : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error("[getClientBookings] Unexpected error", err);
    res.status(500).json({ error: "Failed to load client bookings" });
  }
};
