require("dotenv").config();
const supabase = require("../config/db");
const fs = require("fs");

async function debugBookings() {
    console.log("--- Debugging Bookings ---");

    // 1. Fetch all users to identify owner/player
    const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, name, email, role");

    if (userError) {
        console.error("Error fetching users:", userError);
        return;
    }

    console.log("\nUsers:");
    users.forEach(u => console.log(`- [${u.role}] ${u.name} (${u.email}) ID: ${u.id}`));

    // 2. Fetch all Turfs
    const { data: turfs, error: turfError } = await supabase
        .from("turfs")
        .select("id, name, owner_id");

    if (turfError) {
        console.error("Error fetching turfs:", turfError);
        return;
    }

    console.log("\nTurfs:");
    turfs.forEach(t => {
        const owner = users.find(u => u.id === t.owner_id);
        console.log(`- ${t.name} (ID: ${t.id}) Owner: ${owner ? owner.name : t.owner_id}`);
    });

    // 3. Fetch all Bookings
    const { data: bookings, error: bookingError } = await supabase
        .from("bookings")
        .select("*");

    if (bookingError) {
        console.error("Error fetching bookings:", bookingError);
        return;
    }

    console.log("\nBookings:");
    if (bookings.length === 0) {
        console.log("No bookings found in the database.");
    } else {
        bookings.forEach(b => {
            console.log(`- ID: ${b.id}`);
            console.log(`  Status: ${b.status}`);
            console.log(`  Turf ID: ${b.turf_id}`);
            console.log(`  User (Player) ID: ${b.user_id}`);
            console.log(`  Created At: ${b.created_at}`);
            console.log(`  Total Amount: ${b.total_amount}`);
            console.log(`  Razorpay Order: ${b.razorpay_order_id}`);
            console.log("---");
        });
    }
    const output = {
        users: users,
        turfs: turfs,
        bookings: bookings
    };
    fs.writeFileSync("debug_output.json", JSON.stringify(output, null, 2));
    console.log("Debug output written to debug_output.json");
}

debugBookings();
