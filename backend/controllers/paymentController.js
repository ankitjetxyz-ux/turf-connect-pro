const Razorpay = require("razorpay");
const crypto = require("crypto");
const supabase = require("../config/db");

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
let razorpay = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
}

// Create an order in Razorpay and return order details to client
exports.createOrder = async (req, res, next) => {
  try {
    if (!razorpay) return res.status(500).json({ error: "Razorpay not configured on server" });
    const { booking_id, amount, currency = "INR", turf_id } = req.body;
    const payer_id = req.user?.id; // Use authenticated user ID for security
    
    if (!booking_id || !amount) return res.status(400).json({ error: "booking_id and amount required" });
    if (!payer_id) return res.status(401).json({ error: "Authentication required" });

    const options = {
      amount: Math.round(amount * 100), // rupees to paise
      currency,
      receipt: booking_id,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // create pending payment record
    const { data: insertData, error: insertErr } = await supabase.from("payments").insert({ booking_id, turf_id, payer_id, amount, currency, razorpay_order_id: order.id, status: "pending" });
    if (insertErr) {
      console.error("Failed to create payment record:", insertErr.message || insertErr);
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// Verify payment signature from client and finalize payment
exports.verifyPayment = async (req, res, next) => {
  try {
    if (!razorpay) return res.status(500).json({ error: "Razorpay not configured on server" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return res.status(400).json({ error: "missing fields" });
    }

    // 1) Verify Razorpay signature (source of truth for payment success)
    const generated_signature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("[verifyPayment] Signature mismatch", {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 2) Load related bookings (primary by order_id, fallback by booking_id)
    let bookings = [];

    const { data: orderBookings, error: orderBookingsErr } = await supabase
      .from("bookings")
      .select("id, user_id, slot_id, slots(price, turfs(owner_id))")
      .eq("razorpay_order_id", razorpay_order_id);

    if (orderBookingsErr) {
      console.error("[verifyPayment] bookings-by-order lookup failed", orderBookingsErr);
      return res.status(500).json({ error: "Failed to verify booking" });
    }

    if (orderBookings && orderBookings.length > 0) {
      bookings = orderBookings;
    } else {
      const { data: singleBooking, error: singleBookingErr } = await supabase
        .from("bookings")
        .select("id, user_id, slot_id, slots(price, turfs(owner_id))")
        .eq("id", booking_id)
        .limit(1);

      if (singleBookingErr) {
        console.error("[verifyPayment] booking-by-id lookup failed", singleBookingErr);
        return res.status(500).json({ error: "Failed to verify booking" });
      }

      if (singleBooking && singleBooking.length > 0) {
        bookings = singleBooking;
      }
    }

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ error: "Booking record not found for this payment" });
    }

    const bookingIds = bookings.map((b) => b.id);
    const slotIds = bookings.map((b) => b.slot_id).filter(Boolean);
    const totalAmount = bookings.reduce(
      (sum, b) => sum + Number(b.slots?.price || 0),
      0
    );

    const ownerId = bookings[0].slots?.turfs?.owner_id || null;
    const payerId = bookings[0].user_id;

    // Verify the authenticated user matches the payer (security check)
    if (req.user && req.user.id !== payerId) {
      return res.status(403).json({ error: "You can only verify your own payments" });
    }

    // 3) Try to update payments row if it exists (non-fatal if it doesn't)
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();

    if (pErr) {
      console.warn("[verifyPayment] payments lookup failed (continuing)", pErr);
    }

    if (payment) {
      const { error: payUpdateErr } = await supabase
        .from("payments")
        .update({
          amount: payment.amount || totalAmount,
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
        })
        .eq("id", payment.id);

      if (payUpdateErr) {
        console.warn(
          "[verifyPayment] payment update failed (non-fatal)",
          payUpdateErr
        );
      }
    }

    // 4) Compute admin/owner splits (if total is available)
    const adminCut = 50.0; // Fixed Admin Fee
    const ownerCut = Math.max(0, totalAmount - adminCut); // Remaining to Owner

    const adminId =
      process.env.ADMIN_ENTITY_ID || "00000000-0000-0000-0000-000000000000";

    if (totalAmount > 0) {
      // Admin earnings
      try {
        await supabase.rpc("increment_earning", {
          p_entity_id: adminId,
          p_entity_type: "admin",
          p_amount: adminCut,
        });
      } catch (rpcErr) {
        // Fallback: manual upsert
        const { data: e } = await supabase
          .from("earnings")
          .select("*")
          .eq("entity_id", adminId)
          .eq("entity_type", "admin")
          .limit(1)
          .single();
        if (e) {
          await supabase
            .from("earnings")
            .update({
              amount: Number(e.amount) + adminCut,
              updated_at: new Date().toISOString(),
            })
            .eq("id", e.id);
        } else {
          await supabase.from("earnings").insert({
            entity_id: adminId,
            entity_type: "admin",
            amount: adminCut,
          });
        }
      }

      // Owner earnings
      if (ownerId) {
        try {
          await supabase.rpc("increment_earning", {
            p_entity_id: ownerId,
            p_entity_type: "owner",
            p_amount: ownerCut,
          });
        } catch (rpcErr) {
          const { data: e } = await supabase
            .from("earnings")
            .select("*")
            .eq("entity_id", ownerId)
            .eq("entity_type", "owner")
            .limit(1)
            .single();
          if (e) {
            await supabase
              .from("earnings")
              .update({
                amount: Number(e.amount) + ownerCut,
                updated_at: new Date().toISOString(),
              })
              .eq("id", e.id);
          } else {
            await supabase.from("earnings").insert({
              entity_id: ownerId,
              entity_type: "owner",
              amount: ownerCut,
            });
          }
        }
      }
    }

    // 5) Mark bookings confirmed and slots unavailable
    const { error: bookingUpdateErr } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .in("id", bookingIds);

    if (bookingUpdateErr) {
      console.error(
        "[verifyPayment] booking status update failed (non-fatal)",
        bookingUpdateErr
      );
    }

    if (slotIds.length > 0) {
      const { error: slotErr } = await supabase
        .from("slots")
        .update({ is_booked: true })
        .in("id", slotIds);
      if (slotErr) {
        console.error(
          "[verifyPayment] slot availability update failed (non-fatal)",
          slotErr
        );
      }
    }

    // 5.5) Generate verification codes for each booking
    const verificationCodes = [];
    for (const booking of bookings) {
      if (booking.slot_id) {
        // Fetch slot details to get end time
        const { data: slotData } = await supabase
          .from("slots")
          .select("date, end_time")
          .eq("id", booking.slot_id)
          .single();

        if (slotData) {
          // Generate unique 6-digit code
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Calculate expiration time (slot end time)
          const slotDate = new Date(slotData.date);
          const [hours, minutes] = slotData.end_time.split(':');
          slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const expiresAt = slotDate.toISOString();

          // Store verification code (for turf bookings)
          const { data: vCode, error: vCodeErr } = await supabase
            .from("booking_verification_codes")
            .insert({
              booking_id: booking.id,
              slot_id: booking.slot_id,
              booking_type: 'turf',
              verification_code: code,
              expires_at: expiresAt
            })
            .select()
            .single();

          if (!vCodeErr && vCode) {
            verificationCodes.push({
              booking_id: booking.id,
              verification_code: code,
              expires_at: expiresAt
            });
          }
        }
      }
    }

    // 6) Auto-create chat between player and owner + realtime notification
    if (ownerId && payerId) {
      let chatId = null;

      try {
        const { data: existingChat } = await supabase
          .from("chats")
          .select("*")
          .match({ owner_id: ownerId, player_id: payerId })
          .maybeSingle();

        if (existingChat) {
          chatId = existingChat.id;
        } else {
          const { data: newChat, error: newChatErr } = await supabase
            .from("chats")
            .insert({ owner_id: ownerId, player_id: payerId })
            .select()
            .single();

          if (!newChatErr && newChat) {
            chatId = newChat.id;
          } else if (newChatErr) {
            console.error("[verifyPayment] chat auto-create failed", newChatErr);
          }
        }
      } catch (chatErr) {
        console.error("[verifyPayment] chat ensure failed", chatErr);
      }

      // Notify owner in real time if Socket.IO is available
      try {
        const io = req.app.get("io");
        if (io && ownerId) {
          io.to(ownerId).emit("booking_confirmed", {
            chat_id: chatId,
            booking_ids: bookingIds,
            amount: totalAmount,
            payer_id: payerId,
            owner_id: ownerId,
          });
        }
      } catch (socketErr) {
        console.warn("[verifyPayment] socket notification failed", socketErr);
      }
    }

    // 7) Response for frontend
    res.json({ 
      success: true, 
      booking_ids: bookingIds,
      verification_codes: verificationCodes
    });
  } catch (err) {
    next(err);
  }
};

// Refund payment: used when owner cancels booking - full refund
exports.refundPayment = async (req, res, next) => {
  try {
    const { payment_id, reason } = req.body;
    if (!payment_id) return res.status(400).json({ error: "payment_id required" });

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, bookings(slot_id, slots(turfs(owner_id)))")
      .eq("id", payment_id)
      .limit(1)
      .single();
    
    if (paymentError || !payment) {
      if (paymentError) {
        console.error("Error fetching payment:", paymentError);
      }
      return res.status(404).json({ error: "payment not found" });
    }

    // Verify the authenticated user is the turf owner (security check)
    const ownerId = payment.bookings?.slots?.turfs?.owner_id;
    if (req.user && ownerId && req.user.id !== ownerId) {
      return res.status(403).json({ error: "Only the turf owner can issue refunds" });
    }

    // Update booking status and slot availability
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "cancelled_by_owner" })
      .eq("id", payment.booking_id)
      .select("slot_id")
      .single();

    if (bookingError) {
      console.error("Error updating booking for refund:", bookingError);
      return res.status(500).json({ error: "Failed to update booking" });
    }

    // Free up the slot if booking was found
    if (booking && booking.slot_id) {
      const { error: slotError } = await supabase
        .from("slots")
        .update({ is_booked: false })
        .eq("id", booking.slot_id);
      
      if (slotError) {
        console.error("Error freeing slot:", slotError);
        // Continue with refund even if slot update fails
      }
    }

    // Update payment status to refunded
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", payment_id);
    
    if (paymentUpdateError) {
      console.error("Error updating payment status:", paymentUpdateError);
      return res.status(500).json({ error: "Failed to update payment status" });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
