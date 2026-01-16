const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const supabase = require('../config/db');

async function seedData() {
    console.log('🌱 Starting analytics data seeding...');

    // 1. Get a turf
    const { data: turfs, error: turfError } = await supabase
        .from('turfs')
        .select('id, name, price_per_slot, owner_id')
        .limit(1);

    if (turfError || !turfs || turfs.length === 0) {
        console.error('❌ No turfs found. Please create a turf first.', turfError);
        process.exit(1);
    }

    const turf = turfs[0];
    console.log(`📍 Seeding data for turf: ${turf.name} (${turf.id})`);

    // 2. Get a user for bookings (using owner for simplicity, or fetch a profile)
    // Trying to find a profile that is NOT the owner if possible, else owner
    const { data: profiles } = await supabase.from('profiles').select('id').limit(5);
    const bookerId = profiles && profiles.length > 0 ? profiles[0].id : turf.owner_id;

    const daysToSeed = 30;
    const today = new Date();

    let totalSlots = 0;
    let totalBookings = 0;
    let totalReviews = 0;

    for (let i = 0; i < daysToSeed; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Generate 8-12 slots per day
        const slotsCount = 8 + Math.floor(Math.random() * 5);
        const startHour = 8; // 8 AM

        for (let j = 0; j < slotsCount; j++) {
            const hour = startHour + j;
            const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

            // Randomly decide if booked (60% chance)
            const isBooked = Math.random() < 0.6;
            const status = isBooked ? 'booked' : 'available';

            // Insert Slot
            const { data: slotData, error: slotError } = await supabase
                .from('slots')
                .insert({
                    turf_id: turf.id,
                    date: dateStr,
                    start_time: startTime,
                    end_time: endTime,
                    price: turf.price_per_slot || 1000,
                    status: status
                })
                .select()
                .single();

            if (slotError) {
                console.error(`Error creating slot ${dateStr} ${startTime}:`, slotError);
                continue;
            }
            totalSlots++;

            // If booked, create booking
            if (isBooked && slotData) {
                const bookingStatus = i < 2 ? 'confirmed' : 'completed'; // Recent are confirmed, older are completed

                const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings')
                    .insert({
                        turf_id: turf.id,
                        slot_id: slotData.id,
                        user_id: bookerId,
                        booking_date: dateStr,
                        total_amount: turf.price_per_slot || 1000,
                        status: bookingStatus,
                        created_at: date.toISOString() // accurate historical timestamp
                    })
                    .select()
                    .single();

                if (bookingError) {
                    console.error('Error creating booking:', bookingError.message);
                } else {
                    totalBookings++;

                    // 50% chance to leave a review for completed bookings
                    if (bookingStatus === 'completed' && Math.random() > 0.5) {
                        const rating = 3 + Math.floor(Math.random() * 3); // 3 to 5
                        const { error: reviewError } = await supabase
                            .from('turf_reviews')
                            .insert({
                                turf_id: turf.id,
                                user_id: bookerId,
                                rating: rating,
                                comment: 'Great turf! Enjoyed the game.',
                                created_at: date.toISOString() // Let DB handle default or verify column exists
                            });

                        if (!reviewError) totalReviews++;
                        else console.error('Error creating review:', reviewError.message);
                    }
                }
            }
        }
    }

    console.log(`\n✅ Seeding Complete!`);
    console.log(`- Slots Created: ${totalSlots}`);
    console.log(`- Bookings Created: ${totalBookings}`);
    console.log(`- Reviews Created: ${totalReviews}`);
    process.exit(0);
}

seedData();
