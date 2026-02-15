// Native fetch used (Node 18+)

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
let AUTH_TOKEN = null;
let USER_ID = null;
let TURF_ID = null;
let SLOT_ID = null;

const TEST_USER = {
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "Password123!",
    otp: "123456" // We need to mock OTP verification or ensure we can register without it? 
    // Auth controller checks OTP. We might need to bypass or mock it.
    // Actually, looking at authController, it checks 'otp_verifications' table.
    // This makes automated testing hard without database access to insert a valid OTP.
};

async function log(step, msg, data) {
    console.log(`[${step}] ${msg}`, data ? JSON.stringify(data).substring(0, 100) : '');
}

async function run() {
    try {
        // 1. Health Check
        const health = await fetch(`${BASE_URL}/health`).then(res => res.json());
        log('HEALTH', 'Server status:', health);

        // 2. Login (Skipping Register for now due to OTP - assuming a default user exists or we fallback)
        // Actually, let's try to login with a known user if possible, or we need to insert OTP.
        // Since I have DB access via Supabase client in the backend code, I could potentially write a script that uses the backend's internal logic?
        // But this script is external.

        // Alternative: Use a "test" route to generate a token if in dev mode? 
        // Or just manually insert a user/otp via SQL? I can't run SQL easily here without the postgres tool.

        // Let's rely on the user having a test account or...
        // Wait, I can use the `extensions` or similar to duplicate logic? No.

        // Let's try to Register but mock the OTP check? No, I can't change code just for test.
        // I can inspect `otpController.js` to see if there's a bypass?

        console.log("⚠️  Skipping Auth flow verification in this script due to OTP requirement. Please verify /api/auth/login manually.");

        // We can test public endpoints.

        // 3. Fetch Turfs
        const turfsRes = await fetch(`${BASE_URL}/turfs`);
        const turfs = await turfsRes.json();
        log('TURFS', `Fetched ${turfs.length} turfs`);

        if (turfs.length > 0) {
            TURF_ID = turfs[0].id;
            log('TURFS', 'Selected Turf ID:', TURF_ID);

            // 4. Fetch Slots
            const today = new Date().toISOString().split('T')[0];
            const slotsRes = await fetch(`${BASE_URL}/slots/${TURF_ID}?date=${today}`);
            const slots = await slotsRes.json();
            log('SLOTS', `Fetched ${slots.length} slots for today`);

            if (slots.length > 0) {
                log('SLOTS', 'Sample slot:', slots[0]);
            }
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

run();
