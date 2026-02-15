require("dotenv").config();
const supabase = require("../config/db");

async function fixBookingTurfIds() {
    console.log("--- Fixing Booking Turf IDs ---");

    // 1. Fetch bookings with null turf_id
    const { data: bookings, error: fetchError } = await supabase
        .from("bookings")
        .select("id, slot_id")
        .is("turf_id", null);

    if (fetchError) {
        console.error("Error fetching bookings:", fetchError);
        return;
    }

    console.log(`Found ${bookings.length} bookings with null turf_id.`);

    if (bookings.length === 0) return;

    // 2. Fetch slots for these bookings to get turf_id
    const slotIds = bookings.map(b => b.slot_id);
    const { data: slots, error: slotError } = await supabase
        .from("slots")
        .select("id, turf_id")
        .in("id", slotIds);

    if (slotError) {
        console.error("Error fetching slots:", slotError);
        return;
    }

    const slotMap = {};
    slots.forEach(s => slotMap[s.id] = s.turf_id);

    // 3. Update bookings
    let updatedCount = 0;
    for (const booking of bookings) {
        const turfId = slotMap[booking.slot_id];
        if (turfId) {
            const { error: updateError } = await supabase
                .from("bookings")
                .update({ turf_id: turfId })
                .eq("id", booking.id);

            if (updateError) {
                console.error(`Failed to update booking ${booking.id}:`, updateError);
            } else {
                updatedCount++;
            }
        } else {
            console.warn(`Could not find turf_id for slot ${booking.slot_id} (Booking: ${booking.id})`);
        }
    }

    console.log(`Successfully updated ${updatedCount} bookings.`);
}

fixBookingTurfIds();
