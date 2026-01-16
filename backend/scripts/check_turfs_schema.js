const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });
const supabase = require('../config/db');

async function checkSchema() {
    console.log('🔍 Checking turfs schema...');
    const { data, error } = await supabase.from('turfs').select('*').limit(1);
    if (error) {
        console.error('Error fetching turfs:', error);
    } else if (data && data.length > 0) {
        console.log('✅ Turfs columns:', JSON.stringify(Object.keys(data[0])));
    } else {
        // If no data, we can't infer keys easily from just select *. 
        // But the error 'no turfs found' from previous run implies valid query but empty table?
        // Wait, the error was 'column turfs.price_per_hour does not exist' during select.
        // So if we select *, we should see keys if there is data.
        // If table is empty, we might need to insert a dummy or look at migration files.
        console.log('⚠️ No turfs found in table.');
    }
}
checkSchema();
