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
    const { booking_id, amount, currency = "INR", turf_id, payer_id } = req.body;
    if (!booking_id || !amount || !payer_id) return res.status(400).json({ error: "booking_id, amount, payer_id required" });

    const options = {
      amount: Math.round(amount * 100), // rupees to paise
      currency,
      receipt: booking_id,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // create pending payment record
    await supabase.from("payments").insert({ booking_id, turf_id, payer_id, amount, currency, razorpay_order_id: order.id, status: "pending" });

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
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) return res.status(400).json({ error: "missing fields" });

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

    // Update payment record
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", booking_id)
      .eq("razorpay_order_id", razorpay_order_id)
      .limit(1)
      .single();

    if (pErr) return next(pErr);

    // compute splits
    const total = Number(payment.amount);
    const adminCut = Number((total * 0.1).toFixed(2));
    const ownerCut = Number((total - adminCut).toFixed(2));

    await supabase.from("payments").update({ status: "paid", razorpay_payment_id, razorpay_signature, admin_cut: adminCut, owner_cut: ownerCut }).eq("id", payment.id);

    // update earnings table for admin and owner (upsert)
    const adminId = process.env.ADMIN_ENTITY_ID || "00000000-0000-0000-0000-000000000000";

    await supabase.rpc("increment_earning", { p_entity_id: adminId, p_entity_type: "admin", p_amount: adminCut }).catch(async () => {
      // fallback: insert or update
      const { data: e } = await supabase.from("earnings").select("*").eq("entity_id", adminId).eq("entity_type", "admin").limit(1).single();
      if (e) {
        await supabase.from("earnings").update({ amount: Number(e.amount) + adminCut, updated_at: new Date().toISOString() }).eq("id", e.id);
      } else {
        await supabase.from("earnings").insert({ entity_id: adminId, entity_type: "admin", amount: adminCut });
      }
    });

    if (payment.turf_id) {
      const ownerId = payment.turf_id; // assuming turf owner entity id stored here; adapt as needed
      await supabase.rpc("increment_earning", { p_entity_id: ownerId, p_entity_type: "owner", p_amount: ownerCut }).catch(async () => {
        const { data: e } = await supabase.from("earnings").select("*").eq("entity_id", ownerId).eq("entity_type", "owner").limit(1).single();
        if (e) {
          await supabase.from("earnings").update({ amount: Number(e.amount) + ownerCut, updated_at: new Date().toISOString() }).eq("id", e.id);
        } else {
          await supabase.from("earnings").insert({ entity_id: ownerId, entity_type: "owner", amount: ownerCut });
        }
      });
    }

    // mark booking confirmed and slot unavailable
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking_id);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Refund payment: used when owner cancels booking - full refund
exports.refundPayment = async (req, res, next) => {
  try {
    const { payment_id, reason } = req.body;
    if (!payment_id) return res.status(400).json({ error: "payment_id required" });

    const { data: payment } = await supabase.from("payments").select("*").eq("id", payment_id).limit(1).single();
    if (!payment) return res.status(404).json({ error: "payment not found" });

    // Razorpay refunds require payment id; attempt refund if present
    if (payment.razorpay_payment_id) {
      if (!razorpay) return res.status(500).json({ error: "Razorpay not configured on server" });
      await razorpay.payments.refund(payment.razorpay_payment_id, { amount: Math.round(Number(payment.amount) * 100) });
    }

    await supabase.from("payments").update({ status: "refunded" }).eq("id", payment_id);
    // update booking and slot availability
    await supabase.from("bookings").update({ status: "cancelled_by_owner" }).eq("id", payment.booking_id);
    // TODO: update slot availability depending on schema

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
