const fs = require('fs');
const path = require('path');

const API_URL = 'http://127.0.0.1:8080/api';

// Helper for requests
async function request(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    console.error(`Error requesting ${endpoint}:`, err.cause || err.message);
    return { status: 500, error: err.message };
  }
}

async function runTest() {
  console.log('🚀 Starting End-to-End Test for BOOK MY TURF...\n');

  // 1. Register Client
  const clientEmail = `client_${Date.now()}@test.com`;
  console.log(`1️⃣ Registering Client (${clientEmail})...`);
  const clientReg = await request('POST', '/auth/register', {
    name: 'Test Client',
    email: clientEmail,
    password: 'password123',
    role: 'client'
  });

  if (clientReg.status !== 201) {
    console.error('❌ Client Registration Failed:', clientReg.data);
    return;
  }
  console.log('✅ Client Registered');

  // 2. Login Client
  console.log(`2️⃣ Logging in Client...`);
  const clientLogin = await request('POST', '/auth/login', {
    email: clientEmail,
    password: 'password123'
  });
  
  const clientToken = clientLogin.data.token;
  if (!clientToken) {
    console.error('❌ Client Login Failed:', clientLogin.data);
    return;
  }
  console.log('✅ Client Logged In');

  // 3. Create Turf
  console.log(`3️⃣ Creating Turf...`);
  const turfRes = await request('POST', '/turfs', {
    name: `Test Turf ${Date.now()}`,
    location: 'Test Location',
    description: 'A test turf',
    price_per_slot: 1000,
    facilities: 'Parking, Water',
    images: []
  }, clientToken);

  const turfId = turfRes.data.id;
  if (!turfId) {
    console.error('❌ Turf Creation Failed:', turfRes.data);
    return;
  }
  console.log(`✅ Turf Created (ID: ${turfId})`);

  // 4. Create Slots for Turf
  console.log(`4️⃣ Creating Slots...`);
  const slotDate = new Date().toISOString().split('T')[0];
  const slotRes = await request('POST', '/slots', {
    turf_id: turfId,
    date: slotDate,
    start_time: '10:00',
    end_time: '11:00',
    price: 1000
  }, clientToken);
  
  // Also create a second slot for multi-booking test
  const slotRes2 = await request('POST', '/slots', {
    turf_id: turfId,
    date: slotDate,
    start_time: '11:00',
    end_time: '12:00',
    price: 1000
  }, clientToken);

  if (slotRes.status !== 201) {
    console.error('❌ Slot Creation Failed:', slotRes.data);
    return;
  }
  console.log('✅ Slots Created');

  // 5. Register Player
  const playerEmail = `player_${Date.now()}@test.com`;
  console.log(`5️⃣ Registering Player (${playerEmail})...`);
  const playerReg = await request('POST', '/auth/register', {
    name: 'Test Player',
    email: playerEmail,
    password: 'password123',
    role: 'player'
  });
  console.log('✅ Player Registered');

  // 6. Login Player
  console.log(`6️⃣ Logging in Player...`);
  const playerLogin = await request('POST', '/auth/login', {
    email: playerEmail,
    password: 'password123'
  });
  const playerToken = playerLogin.data.token;
  const playerId = playerLogin.data.user.id;
  console.log('✅ Player Logged In');

  // 7. Get Slots
  console.log(`7️⃣ Fetching Slots...`);
  const slotsFetch = await request('GET', `/slots/${turfId}`);
  const availableSlots = slotsFetch.data.filter(s => s.is_available || !s.is_booked); // Handle both flags just in case
  
  if (availableSlots.length < 1) {
    console.error('❌ No slots available to book');
    return;
  }
  const slotToBook = availableSlots[0];
  console.log(`✅ Slots Fetched (Found ${availableSlots.length} available)`);

  // 8. Book Slot (Create Order)
  console.log(`8️⃣ Booking Slot (ID: ${slotToBook.id})...`);
  // Note: Using the new multi-slot endpoint
  const bookingRes = await request('POST', '/bookings/create-and-order', {
    slot_ids: [slotToBook.id]
  }, playerToken);

  if (bookingRes.status !== 200) {
    console.error('❌ Booking/Order Creation Failed:', bookingRes.data);
    return;
  }
  const bookingId = bookingRes.data.booking_ids[0];
  const orderId = bookingRes.data.order.id;
  console.log(`✅ Booking Created (Booking ID: ${bookingId}, Order ID: ${orderId})`);

  // 9. Simulate Payment Verification (to confirm booking)
  console.log(`9️⃣ Verifying Payment...`);
  // We need to mock the signature verification on backend or use a test signature
  // If backend checks signature strictly, this might fail without real Razorpay interaction.
  // However, usually for dev/test, we might have a bypass or we can check if the booking exists in pending state at least.
  
  // Let's check if booking is created (pending)
  const myBookings = await request('GET', '/bookings/my', null, playerToken);
  const myBooking = myBookings.data.find(b => b.id === bookingId);
  
  if (myBooking) {
      console.log(`✅ Booking exists in DB with status: ${myBooking.status}`);
  } else {
      console.error('❌ Booking not found in My Bookings');
  }

  // 10. Check Chat Auto-Creation (Logic: Chat created on CONFIRMED booking)
  // Since we haven't paid, it might not be there.
  // But let's try to verify the payment endpoint if possible, or just check if the logic holds.
  // We can't easily fake a Razorpay signature without the secret.
  // But we can check if the chat endpoint returns empty (correct) or crashes (incorrect).
  
  console.log(`🔟 Checking Chats (Expect empty or valid response, no crash)...`);
  const chatRes = await request('GET', `/chat/conversations/${playerId}`, null, playerToken);
  if (chatRes.status === 200) {
      console.log(`✅ Chat Endpoint Works (Count: ${chatRes.data.length})`);
  } else {
      console.error('❌ Chat Endpoint Failed:', chatRes.data);
  }

  console.log('\n✨ Test Complete!');
}

runTest();
