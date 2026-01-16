const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const supabase = require('../config/db');

async function verifyAnalytics() {
    console.log('🔍 Verifying Analytics Data Fetching...');

    // 1. Get ALL turfs
    const { data: turfs } = await supabase.from('turfs').select('id, name');

    if (!turfs || turfs.length === 0) {
        console.log('❌ No turfs found');
        return;
    }

    console.log(`📍 Found ${turfs.length} turfs. Checking each...`);

    for (const turf of turfs) {
        console.log(`\n🏟️  Turf: ${turf.name} (${turf.id})`);

        // Check Bookings
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id, total_amount, status')
            .eq('turf_id', turf.id);

        console.log(`   📝 Bookings found: ${bookings?.length || 0}`);
        if (bookings && bookings.length > 0) {
            const sample = bookings.slice(0, 3).map(b => `${b.id} ($${b.total_amount}) [${b.status}]`).join(', ');
            console.log(`      Sample: ${sample}`);

            const revenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
            console.log(`      💰 Total Revenue: ${revenue}`);
        }

        // Check Reviews
        const { data: reviews } = await supabase
            .from('turf_reviews')
            .select('id, rating')
            .eq('turf_id', turf.id);

        console.log(`   ⭐ Reviews found: ${reviews?.length || 0}`);
    }
}

verifyAnalytics();
