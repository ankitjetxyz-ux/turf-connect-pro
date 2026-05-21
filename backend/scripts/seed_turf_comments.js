/**
 * Seeds realistic turf comments with reviewer profiles (portrait URLs).
 * Run: node scripts/seed_turf_comments.js
 */
require("dotenv").config();
const bcrypt = require("bcrypt");
const supabase = require("../config/db");

const REVIEWERS = [
  {
    name: "Rahul Mehta",
    email: "rahul.mehta.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    name: "Priya Shah",
    email: "priya.shah.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    name: "Arjun Desai",
    email: "arjun.desai.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/men/71.jpg",
  },
  {
    name: "Sneha Kapoor",
    email: "sneha.kapoor.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/women/18.jpg",
  },
  {
    name: "Vikram Solanki",
    email: "vikram.solanki.reviews@turfbook.local",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/women/25.jpg",
  },
  {
    name: "Karan Malhotra",
    email: "karan.malhotra.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
  },
  {
    name: "Divya Nair",
    email: "divya.nair.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/women/37.jpg",
  },
  {
    name: "Harsh Patel",
    email: "harsh.patel.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    name: "Meera Joshi",
    email: "meera.joshi.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/women/48.jpg",
  },
  {
    name: "Rohan Gupta",
    email: "rohan.gupta.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/men/56.jpg",
  },
  {
    name: "Kavya Reddy",
    email: "kavya.reddy.reviews@turfbook.local",
    avatar: "https://randomuser.me/api/portraits/women/63.jpg",
  },
];

const COMMENT_POOL = [
  "Booked the 7–9 PM slot for our office five-a-side. Floodlights were bright, the surface felt even under foot, and check-in was smooth — no last-minute phone calls to the owner.",
  "We played a friendly cricket match here on Sunday morning. Good bounce on the pitch, clean washrooms, and the owner extended our slot by 20 minutes when the previous group finished early.",
  "First time using TurfBook for this venue. Payment went through instantly, got the confirmation on email, and the turf was exactly as shown in the photos. Will book again next month.",
  "Surface quality is genuinely good for quick football games. Parking was easy on a weekday evening and the drinking water station near the pavilion was a small but nice touch.",
  "Organised a college reunion match here. Booking three consecutive slots was straightforward, and the turf held up well even with 14 players rotating in.",
  "The WiFi in the seating area actually worked, which helped us stream music for warm-up. Turf felt well maintained — no bare patches or slippery corners.",
  "Played box cricket with friends from Mehsana. Nets were tight enough for a proper game, lighting was consistent, and the booking reminder saved us from forgetting the slot.",
  "Decent value for the price. We had a 6 PM slot in Vadodara — reached on time, gate was open, and the changing room was cleaner than most turfs we have tried locally.",
  "Used the platform during monsoon season and was relieved the turf drained well after light rain. Our match started only 15 minutes late, which is rare for outdoor grounds.",
  "Helpful staff on ground when we arrived. The TurfBook receipt made entry verification quick, and we got the full hour we paid for without any arguments.",
  "Perfect for weekend morning badminton sessions. Court lines were visible, floor grip was good, and booking two weeks ahead secured our regular Saturday slot.",
  "Our corporate team books here every quarter. Consistent experience — same quality turf, same smooth online payment, and the owner responds quickly on chat for any slot changes.",
];

async function ensureReviewer(reviewer) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", reviewer.email)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("users")
      .update({
        name: reviewer.name,
        profile_image_url: reviewer.avatar,
      })
      .eq("id", existing.id);
    return existing.id;
  }

  const passwordHash = await bcrypt.hash("SeedReviewer123!", 12);
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      name: reviewer.name,
      email: reviewer.email,
      password: passwordHash,
      role: "player",
      profile_image_url: reviewer.avatar,
      email_verified: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create reviewer ${reviewer.email}: ${error.message}`);
  return created.id;
}

async function seedComments() {
  console.log("🌱 Seeding realistic turf comments...\n");

  const reviewerIds = [];
  for (const reviewer of REVIEWERS) {
    const id = await ensureReviewer(reviewer);
    reviewerIds.push(id);
    console.log(`✅ Reviewer ready: ${reviewer.name}`);
  }

  const { data: turfs, error: turfError } = await supabase
    .from("turfs")
    .select("id, name, location")
    .eq("verification_status", "approved");

  if (turfError || !turfs?.length) {
    console.error("❌ No approved turfs found.", turfError?.message);
    process.exit(1);
  }

  // Replace previous seed comments so each turf has fresh, unique reviewers
  const seedEmails = REVIEWERS.map((r) => r.email);
  const { data: seedUsers } = await supabase
    .from("users")
    .select("id")
    .in("email", seedEmails);

  if (seedUsers?.length) {
    await supabase
      .from("turf_comments")
      .delete()
      .in(
        "user_id",
        seedUsers.map((u) => u.id),
      );
  }

  await supabase
    .from("turf_comments")
    .delete()
    .or("comment.eq.Good turf for football lovers.,comment.ilike.%lorem%,comment.ilike.%test comment%");

  let commentIndex = 0;
  let inserted = 0;

  for (const turf of turfs) {
    const commentsForTurf = [];
    for (let i = 0; i < 3; i++) {
      const reviewerIdx = (commentIndex + i) % reviewerIds.length;
      const base = COMMENT_POOL[(commentIndex + i) % COMMENT_POOL.length];
      const localized = base.replace(
        "here",
        `at ${turf.name} in ${turf.location}`,
      );
      commentsForTurf.push({
        turf_id: turf.id,
        user_id: reviewerIds[reviewerIdx],
        comment: localized,
        created_at: new Date(
          Date.now() - (commentIndex + i + 1) * 86400000 * 3,
        ).toISOString(),
      });
    }

    // Ensure avatars stay distinct after re-seed
    for (let i = 0; i < 3; i++) {
      await supabase
        .from("users")
        .update({ profile_image_url: REVIEWERS[(commentIndex + i) % REVIEWERS.length].avatar })
        .eq("id", reviewerIds[(commentIndex + i) % reviewerIds.length]);
    }

    const { error: insertError } = await supabase
      .from("turf_comments")
      .insert(commentsForTurf);

    if (insertError) {
      console.error(`❌ ${turf.name}:`, insertError.message);
    } else {
      inserted += commentsForTurf.length;
      console.log(`💬 Added ${commentsForTurf.length} comments → ${turf.name}`);
    }

    commentIndex += 3;
  }

  console.log(`\n✨ Done. Inserted ${inserted} comments across ${turfs.length} turfs.`);
}

seedComments().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
