require('dotenv').config();
const supabase = require("./config/db");

async function fix() {
    console.log("Fixing missing turf_ids in bookings...");

    // 1. Get bookings with null turf_id but valid slot_id
    const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, slot_id")
        .is("turf_id", null)
        .not("slot_id", "is", null);

    if (error) {
        console.error("Error fetching bookings to fix:", error);
        return;
    }

    if (!bookings || bookings.length === 0) {
        console.log("No bookings need fixing.");
        return;
    }

    console.log(`Found ${bookings.length} bookings to fix.`);

    // 2. For each booking, find the slot's turf_id and update
    for (const booking of bookings) {
        const { data: slot, error: slotError } = await supabase
            .from("slots")
            .select("turf_id")
            .eq("id", booking.slot_id)
            .single();

        if (slotError || !slot) {
            console.warn(`Could not find slot for booking ${booking.id}`);
            continue;
        }

        if (slot.turf_id) {
            const { error: updateError } = await supabase
                .from("bookings")
                .update({ turf_id: slot.turf_id })
                .eq("id", booking.id);

            if (updateError) {
                console.error(`Failed to update booking ${booking.id}:`, updateError);
            } else {
                console.log(`Updated booking ${booking.id} with turf_id ${slot.turf_id}`);
            }
        }
    }

    console.log("Fix complete.");
}

fix();
