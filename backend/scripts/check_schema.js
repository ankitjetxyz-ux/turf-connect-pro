const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const supabase = require('../config/db');

async function checkSchema() {
    console.log('🔍 Checking schemas...');

    const { data: slots } = await supabase.from('slots').select('*').limit(1);
    if (slots && slots.length > 0) console.log('✅ Slots columns:', Object.keys(slots[0]));
    else console.log('⚠️ No slots found');

    const { data: bookings } = await supabase.from('bookings').select('*').limit(1);
    if (bookings && bookings.length > 0) console.log('✅ Bookings columns:', Object.keys(bookings[0]));
    else console.log('⚠️ No bookings found');

    const { data: reviews } = await supabase.from('reviews').select('*').limit(1);
    if (reviews && reviews.length > 0) console.log('✅ Reviews columns:', Object.keys(reviews[0]));
    else console.log('⚠️ No reviews found');
}
checkSchema();
