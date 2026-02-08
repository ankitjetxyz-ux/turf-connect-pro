require('dotenv').config();
const supabase = require("./config/db");

async function check() {
    console.log("Checking booked bookings turf_ids...");

    const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, status, turf_id")
        .eq("status", "booked");

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Found:", bookings.length, "booked bookings.");
    bookings.forEach(b => {
        console.log(`Booking ${b.id}: status=${b.status}, turf_id=${b.turf_id}`);
    });
}

check();
