const supabase = require("../config/db");
const Razorpay = require("razorpay");
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
let razorpay = null;
if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
  } catch (e) {
    console.warn("Failed to initialize Razorpay client:", e?.message || e);
  }
}

async function adjustEarnings(entityId, entityType, delta) {
  try {
    // upsert earnings row and add delta (delta can be negative)
    const { data: existing } = await supabase.from("earnings").select("*").eq("entity_id", entityId).eq("entity_type", entityType).limit(1).single();
    if (existing) {
      await supabase.from("earnings").update({ amount: Number(existing.amount) + Number(delta), updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("earnings").insert({ entity_id: entityId, entity_type: entityType, amount: delta });
    }
  } catch (err) {
    console.error("adjustEarnings error:", err?.message || err);
  }
}

/* =======================
   BOOK SLOT (PLAYER)
======================= */
exports.bookSlot = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { slot_id } = req.body;

    const { data: slot, error: slotErr } = await supabase
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

    if (slotErr || !slot) {
      return res.status(400).json({ error: "Slot not available" });
    }

    const { data: booking, error: bookingErr } = await supabase
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

    if (bookingErr) return next(bookingErr);

    await supabase
      .from("slots")
      .update({ is_available: false })
      .eq("id", slot_id);

    // create conversation between client (owner) and player if not exists
    const ownerId = slot.turfs?.owner_id;
    const playerId = user_id;
    const { data: existing } = await supabase.from("chats").select("*").match({ owner_id: ownerId, player_id: playerId }).limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("chats").insert([{ owner_id: ownerId, player_id: playerId }]);
    }

    res.status(201).json({
      message: "Slot booked successfully",
      booking_id: booking.id,
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   CREATE BOOKING (PENDING) + RAZORPAY ORDER
======================= */
exports.createBookingAndOrder = async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Payments not configured on server" });

    const user_id = req.user.id;
    const { slot_id } = req.body;

    const { data: slot, error: slotErr } = await supabase
      .from("slots")
      .select(`id, price, is_available, turfs ( owner_id )`)
      .eq("id", slot_id)
      .eq("is_available", true)
      .single();

    if (slotErr || !slot) return res.status(400).json({ error: "Slot not available" });

    // create booking pending
    const { data: booking, error: bookingErr } = await supabase.from("bookings").insert([{ user_id, slot_id, status: "pending" }]).select().single();
    if (bookingErr) return next(bookingErr);

    // create razorpay order
    const amount = Number(slot.price || 0);
    if (!global.razorpay && !process.env.RAZORPAY_KEY_ID) {
      return res.status(500).json({ error: "Razorpay not configured" });
    }
    const rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rp.orders.create({ amount: Math.round(amount * 100), currency: "INR", receipt: booking.id, payment_capture: 1 });

    // create payment record
    await supabase.from("payments").insert({ booking_id: booking.id, turf_id: slot.turfs?.owner_id, payer_id: user_id, amount, currency: "INR", razorpay_order_id: order.id, status: "pending" });

    res.json({ booking_id: booking.id, order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    next(err);
  }
};
/* =======================
   GET PLAYER BOOKINGS
======================= */
exports.getMyBookings = async (req, res, next) => {
  try {
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

    if (error) return res.status(400).json({ error: error.message });

    const formatted = (data || []).map(b => ({
      id: b.id,
      status: b.status,
      turf_name: b.slots?.turfs?.name || "Unknown Turf",
      location: b.slots?.turfs?.location || "Unknown Location",
      slot_time: b.slots
        ? `${b.slots.start_time} - ${b.slots.end_time}`
        : "N/A",
      turf_owner_id: b.slots?.turfs?.owner_id || null,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

/* =======================
   CANCEL BOOKING (PLAYER)
======================= */
exports.cancelBooking = async (req, res, next) => {
  try {
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
      return res.status(400).json({ error: "Booking not found or already cancelled" });
    }

    // Fetch payment details
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", booking_id)
      .eq("status", "paid")
      .single();

    if (payment) {
      // Penalty Logic: User pays 50 (10 Admin, 40 Owner)
      // Refund = Amount - 50
      const PENALTY = 50.0;
      const OWNER_PENALTY = 40.0;
      const ADMIN_PENALTY = 10.0;
      
      const total = Number(payment.amount);
      const refundAmount = Math.max(0, total - PENALTY);

      // attempt refund of refundAmount (in paise)
      if (payment.razorpay_payment_id) {
        try {
          if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.warn("Refund skipped: Razorpay not configured");
          } else {
            const rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
            await rp.payments.refund(payment.razorpay_payment_id, { amount: Math.round(refundAmount * 100) });
          }
        } catch (e) {
          console.error("Refund failed:", e);
        }
      }

      // adjust payments record
      await supabase.from("payments").update({ status: "refunded" }).eq("id", payment.id);

      // adjust earnings: subtract proportional amounts of refunded portion from owner and admin
      const adminCut = Number(payment.admin_cut || 0);
      const ownerCut = Number(payment.owner_cut || 0);
      const refundedPortion = refundAmount / total || 0;
      const adminSubtract = Number((adminCut * refundedPortion).toFixed(2));
      const ownerSubtract = Number((ownerCut * refundedPortion).toFixed(2));

      // Apply negative adjustments (Reverse original earnings)
      if (payment.turf_id) {
        await adjustEarnings(payment.turf_id, "owner", -ownerSubtract);
      }
      const adminId = process.env.ADMIN_ENTITY_ID || "00000000-0000-0000-0000-000000000000";
      await adjustEarnings(adminId, "admin", -adminSubtract);

      // Add penalty distribution (New earnings)
      if (payment.turf_id) {
        await adjustEarnings(payment.turf_id, "owner", OWNER_PENALTY);
      }
      await adjustEarnings(adminId, "admin", ADMIN_PENALTY);
    }

    // Update booking status
    await supabase.from("bookings").update({ status: "cancelled_by_user" }).eq("id", booking_id);

    // Free the slot
    await supabase.from("slots").update({ is_available: true }).eq("id", booking.slot_id);

    res.json({ message: "Booking cancelled with penalty applied" });
  } catch (err) {
    next(err);
  }
};

/* =======================
   OWNER CANCEL BOOKING (CLIENT)
   Full refund to user, owner reimbursed by admin/owner adjustments
======================= */
exports.ownerCancelBooking = async (req, res, next) => {
  try {
    const owner_id = req.user.id;
    const { booking_id } = req.body;

    // verify booking belongs to owner's turf
    const { data: booking } = await supabase.from("bookings").select(`*, slots ( turfs ( owner_id ) )`).eq("id", booking_id).single().catch(() => ({ data: null }));
    if (!booking || booking.slots?.turfs?.owner_id !== owner_id) return res.status(403).json({ error: "Not authorized or booking not found" });

    const { data: payment } = await supabase.from("payments").select("*").eq("booking_id", booking_id).limit(1).single().catch(() => ({ data: null }));

    if (payment && payment.status === "paid") {
      // refund full amount
      if (payment.razorpay_payment_id) {
        try {
          if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.warn("Refund skipped: Razorpay not configured");
          } else {
            const rp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
            await rp.payments.refund(payment.razorpay_payment_id, { amount: Math.round(Number(payment.amount) * 100) });
          }
        } catch (e) {
          console.error("Refund failed:", e);
        }
      }

      await supabase.from("payments").update({ status: "refunded" }).eq("id", payment.id);

      // subtract previous earnings credited
      const adminId = process.env.ADMIN_ENTITY_ID || "00000000-0000-0000-0000-000000000000";
      const adminCut = Number(payment.admin_cut || 0);
      const ownerCut = Number(payment.owner_cut || 0);
      if (payment.turf_id) {
        await adjustEarnings(payment.turf_id, "owner", -ownerCut);
      }
      await adjustEarnings(adminId, "admin", -adminCut);
    }

    // update booking and slot
    await supabase.from("bookings").update({ status: "cancelled_by_owner" }).eq("id", booking_id);
    await supabase.from("slots").update({ is_available: true }).eq("id", booking.slot_id);

    res.json({ message: "Booking cancelled by owner; refunded to user" });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GET CLIENT BOOKINGS
======================= */
exports.getClientBookings = async (req, res, next) => {
  try {
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

    if (error) return res.status(400).json({ error: error.message });

    const formatted = (data || []).map(b => ({
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
  } catch (err) {
    next(err);
  }
};
