# Turf Connect Pro - Optimized Database Schema

**Project Domain:** Turf Booking, Tournaments, Payments, Chat & User Management  
**Database Type:** PostgreSQL (Supabase)  
**Schema Version:** Optimized v1.0 (January 2026)

---

## Overview

This document describes the **optimized production schema** for Turf Connect Pro. The schema has been streamlined to:
- ✅ Remove redundant and unused attributes
- ✅ Consolidate all migrations into base schema
- ✅ Standardize duplicate fields
- ✅ Add computed fields via triggers
- ✅ Include all actively-used features

**Total Tables:** 15

---

## 1️⃣ users – Core User Table

**Purpose:** Stores all users including players, turf owners (clients), and admins.

**Columns:**
- `id` (UUID, PK) – Unique identifier
- `name` (text) – Full name
- `email` (text, unique) – Login email
- `password` (text) – Hashed password
- `role` (text) – User role: `player`, `client`, `admin`
- `phone` (text) – Contact number
- `profile_image_url` (text) – Profile photo URL
- `email_verified` (boolean) – Email verification status
- `email_verified_at` (timestamptz) – Verification timestamp
- `updated_at` (timestamptz) – Last profile update
- `created_at` (timestamptz) – Account creation time

**Indexes:** `email`, `role`, `email_verified`

---

## 2️⃣ user_sessions – Login & Refresh Tokens

**Purpose:** Manages active login sessions using JWT refresh tokens.

**Columns:**
- `id` (UUID, PK) – Session ID
- `user_id` (UUID, FK → users) – Linked user
- `refresh_token` (text, unique) – Secure refresh token
- `expires_at` (timestamptz) – Token expiry time
- `user_agent` (text) – Device/browser info
- `ip_address` (text) – Login IP
- `created_at` (timestamptz) – Session creation
- `updated_at` (timestamptz) – Last update

**Indexes:** `user_id`, `refresh_token`, `expires_at`

---

## 3️⃣ otp_verifications – Email OTP System

**Purpose:** Handles OTP verification for email verification and password reset with security tracking.

**Columns:**
- `id` (UUID, PK) – OTP record ID
- `email` (text) – Target email
- `otp_hash` (text) – Hashed OTP value
- `purpose` (text) – `email_verification` or `password_reset`
- `expires_at` (timestamptz) – OTP expiry
- `is_used` (boolean) – Usage status
- `attempt_count` (integer) – Failed verification attempts
- `user_agent` (text) – Device info
- `ip_address` (text) – Request IP
- `created_at` (timestamptz) – OTP generation time

**Indexes:** `(email, purpose)`, `expires_at`, `is_used`

---

## 4️⃣ turfs – Turf Master Table

**Purpose:** Stores turf ground details listed by owners.

**Columns:**
- `id` (UUID, PK) – Turf ID
- `owner_id` (UUID, FK → users) – Turf owner
- `name` (text) – Turf name
- `location` (text) – Address/location
- `description` (text) – Turf description
- `price_per_slot` (numeric) – Base pricing per slot
- `facilities` (text) – Amenities/facilities
- `images` (text[]) – Array of image URLs
- `rating` (numeric) – **Computed:** Average rating (auto-updated via trigger)
- `reviews_count` (integer) – **Computed:** Total reviews (auto-updated via trigger)
- `owner_phone` (text) – Contact number
- `is_active` (boolean) – Availability status
- `created_at` (timestamptz) – Turf listing date

**Indexes:** `name`, `location`, `is_active`, `owner_id`

**Note:** `rating` and `reviews_count` are automatically updated when reviews are added.

---

## 5️⃣ slots – Turf Time Slots

**Purpose:** Defines bookable time slots for each turf.

**Columns:**
- `id` (UUID, PK) – Slot ID
- `turf_id` (UUID, FK → turfs) – Turf reference
- `date` (date) – Slot date
- `start_time` (time) – Start time
- `end_time` (time) – End time
- `price` (numeric) – Slot-specific price
- `is_booked` (boolean) – Booking status
- `created_at` (timestamptz) – Slot creation time

**Indexes:** `(turf_id, date)`, `is_booked`

---

## 6️⃣ bookings – Turf Bookings

**Purpose:** Handles slot bookings by users.

**Columns:**
- `id` (UUID, PK) – Booking ID
- `user_id` (UUID, FK → users) – Booking user
- `slot_id` (UUID, FK → slots) – Booked slot
- `turf_id` (UUID, FK → turfs) – Direct turf reference for easier queries
- `booking_date` (date) – Date of booking
- `status` (text) – `pending`, `confirmed`, `cancelled`, `completed`
- `total_amount` (numeric) – Total cost
- `razorpay_order_id` (text) – Payment order ID
- `created_at` (timestamptz) – Booking creation time

**Indexes:** `user_id`, `turf_id`, `status`, `razorpay_order_id`

---

## 7️⃣ booking_verification_codes – Entry Verification

**Purpose:** Generates verification codes for turf or tournament entry confirmation.

**Columns:**
- `id` (UUID, PK) – Verification ID
- `booking_id` (UUID, FK → bookings) – Related booking
- `participant_id` (UUID, FK → tournament_participants) – Tournament participant
- `slot_id` (UUID, FK → slots) – Slot reference
- `booking_type` (text) – `turf` or `tournament`
- `verification_code` (text) – 6-digit entry code
- `expires_at` (timestamptz) – Code expiry
- `is_verified` (boolean) – Verification status
- `verified_at` (timestamptz) – Verification timestamp
- `created_at` (timestamptz) – Code creation time

**Indexes:** `booking_id`, `participant_id`, `verification_code`

---

## 8️⃣ payments – Payment Records

**Purpose:** Stores Razorpay payment transaction details.

**Columns:**
- `id` (UUID, PK) – Payment ID
- `booking_ids` (uuid[]) – Array of booking IDs (supports multi-booking)
- `turf_id` (UUID, FK → turfs) – Turf owner reference
- `user_id` (UUID, FK → users) – Paying user
- `amount` (numeric) – Payment amount
- `currency` (text) – Currency (default: `INR`)
- `status` (text) – Payment status: `pending`, `success`, `failed`
- `razorpay_payment_id` (text) – Razorpay payment ID
- `razorpay_order_id` (text) – Razorpay order ID
- `razorpay_signature` (text) – Payment signature for verification
- `created_at` (timestamptz) – Payment timestamp

**Indexes:** `user_id`, `turf_id`, `status`, `razorpay_order_id`

**Note:** Uses `booking_ids` array for flexibility with multi-slot bookings.

---

## 9️⃣ reviews – Turf Reviews

**Purpose:** Stores ratings and reviews from users for turfs.

**Columns:**
- `id` (UUID, PK) – Review ID
- `turf_id` (UUID, FK → turfs) – Reviewed turf
- `user_id` (UUID, FK → users) – Reviewer
- `booking_id` (UUID, FK → bookings) – Optional: linked booking
- `rating` (integer) – Rating (1-5)
- `comment` (text) – Review text
- `created_at` (timestamptz) – Review date

**Indexes:** `turf_id`, `user_id`

**Trigger:** Automatically updates `turfs.rating` and `turfs.reviews_count` on insert/update.

---

## 🔟 tournaments – Sports Tournaments

**Purpose:** Manages turf-hosted sports tournaments.

**Columns:**
- `id` (UUID, PK) – Tournament ID
- `turf_id` (UUID, FK → turfs) – Host turf
- `name` (text) – Tournament name
- `sport` (text) – Sport type
- `date` (date) – Main tournament date
- `time` (time) – Start time
- `start_date` (date) – Multi-day start date
- `end_date` (date) – Multi-day end date
- `city` (text) – City location
- `location` (text) – Detailed location
- `entry_fee` (numeric) – Registration fee
- `prize_pool` (numeric) – Prize money
- `max_teams` (integer) – Maximum teams allowed
- `spots_left` (integer) – Available spots
- `image` (text) – Tournament poster/image
- `description` (text) – Tournament details
- `status` (text) – `upcoming`, `ongoing`, `completed`
- `created_at` (timestamptz) – Creation time

**Indexes:** `turf_id`, `status`, `date`, `city`

---

## 1️⃣1️⃣ tournament_participants – Tournament Teams

**Purpose:** Stores team registrations for tournaments.

**Columns:**
- `id` (UUID, PK) – Participant ID
- `tournament_id` (UUID, FK → tournaments) – Tournament reference
- `user_id` (UUID, FK → users) – Team leader
- `team_name` (text) – Team name
- `team_members` (text[]) – Array of team member names
- `leader_contact_phone` (text) – Team leader's phone number
- `status` (text) – Registration status
- `payment_status` (text) – Payment status
- `razorpay_order_id` (text) – Payment order ID
- `razorpay_payment_id` (text) – Payment transaction ID
- `created_at` (timestamptz) – Registration time

**Indexes:** `tournament_id`, `user_id`, `status`

---

## 1️⃣2️⃣ chats – Chat Threads

**Purpose:** Handles player ↔ turf owner chat threads.

**Columns:**
- `id` (UUID, PK) – Chat ID
- `owner_id` (UUID, FK → users) – Turf owner
- `player_id` (UUID, FK → users) – Player
- `last_message` (text) – Preview of last message
- `related_booking_id` (UUID, FK → bookings) – Optional: related booking
- `is_favorite` (boolean) – Starred/favorite status
- `is_deleted` (boolean) – Soft delete flag
- `auto_delete_at` (timestamptz) – Scheduled deletion time
- `created_at` (timestamptz) – Chat creation
- `updated_at` (timestamptz) – Last message time

**Indexes:** `(owner_id, player_id)`, `owner_id`, `player_id`

**Constraint:** Unique pair `(owner_id, player_id)`

---

## 1️⃣3️⃣ messages – Chat Messages

**Purpose:** Stores individual messages within chat threads.

**Columns:**
- `id` (UUID, PK) – Message ID
- `chat_id` (UUID, FK → chats) – Parent chat thread
- `sender_id` (UUID, FK → users) – Message sender
- `content` (text) – Message text
- `is_read` (boolean) – Read status
- `created_at` (timestamptz) – Message timestamp

**Indexes:** `chat_id`, `sender_id`

---

## 1️⃣4️⃣ earnings – Revenue Tracking

**Purpose:** Tracks cumulative earnings for turf owners and admin.

**Columns:**
- `id` (UUID, PK) – Earnings ID
- `entity_id` (UUID) – User ID (owner or admin)
- `entity_type` (text) – `admin` or `owner`
- `amount` (numeric) – Total earnings
- `updated_at` (timestamptz) – Last update time

**Indexes:** `(entity_id, entity_type)`

**Constraint:** Unique pair `(entity_id, entity_type)`

**Helper Function:** `increment_earning(entity_id, entity_type, amount)` for safe upserts.

---

## 1️⃣5️⃣ contact_messages – Contact Form

**Purpose:** Stores user queries sent via contact form.

**Columns:**
- `id` (UUID, PK) – Message ID
- `user_id` (UUID, FK → users) – Optional: logged-in user
- `name` (text) – Sender name
- `email` (text) – Sender email
- `subject` (text) – Message subject
- `message` (text) – Message content
- `admin_email` (text) – Recipient admin email
- `status` (text) – `unread`, `read`, `replied`
- `created_at` (timestamptz) – Submission time

**Indexes:** `status`, `user_id`

---

## Helper Functions

### `increment_earning(p_entity_id, p_entity_type, p_amount)`
Safely increments earnings using PostgreSQL's `ON CONFLICT` upsert pattern.

### `cleanup_expired_otps()`
Deletes OTPs older than 24 hours.

### `cleanup_expired_sessions()`
Removes expired JWT refresh tokens.

### `update_turf_rating()`
Trigger function that auto-updates `turfs.rating` and `turfs.reviews_count` when reviews are added or updated.

---

## Removed/Optimized Items

The following were **removed or consolidated** during optimization:

### ❌ Removed Tables (Not Implemented)
- `email_otps` – Replaced by `otp_verifications`
- `turf_gallery` – Turfs use `images` array instead
- `turf_reviews` – Consolidated into `reviews` table
- `turf_testimonials` – Not implemented
- `chat_favorites` – Replaced by `is_favorite` column in `chats`
- `promotional_videos` – Not implemented

### ❌ Removed Columns (Unused)
- `users.last_password_reset` – Not actively tracked in code
- `users.locked_until` – Not used (uses different locking logic)
- `bookings.cancelled_by` – Cancellation tracking simplified
- `bookings.cancelled_at` – Cancellation tracking simplified
- `bookings.booking_start_time` – Redundant (slot has timing)
- `bookings.booking_end_time` – Redundant (slot has timing)

### ✅ Kept Columns (Actively Used)
The following columns were initially considered for removal but are **actively used in controllers**:
- `users.failed_login_attempts` – Used in authController for account locking
- `users.last_failed_login` – Tracks failed login timestamp 
- `users.deleted_at` – Soft delete checked in login flow
- `payments.payer_id` – Used in bookingController alongside `user_id`
- `tournament_participants.payment_status` – Extensively used in tournamentController

### ✅ Standardized Fields
- **Payments:** Kept both `user_id` and `payer_id` (both actively used)
- **Payments:** Uses `booking_ids` array for flexibility
- **Payments:** Uses `status` as primary status field

### ✅ Added Missing Columns
- `users.phone` – User contact number (referenced in frontend)
- `turfs.rating` – Computed average rating
- `turfs.reviews_count` – Computed total reviews
- `turfs.owner_phone` – Turf owner contact
- `bookings.turf_id` – Direct turf reference for easier queries
- `reviews.booking_id` – Optional booking linkage

---

## Migration Notes

To apply this optimized schema to an existing database:

1. **Backup your database first!**
2. Run `optimized_schema.sql` on a fresh database, OR
3. Create a migration script to:
   - Add new columns (`users.phone`, `turfs.rating`, etc.)
   - Drop unused columns (optional, can keep for backwards compatibility)
   - Migrate `payments` data if needed (consolidate duplicate fields)

**Note:** The optimized schema is backward-compatible with existing controllers. No code changes needed unless using removed columns.

---

## Schema File Location

**Production Schema:** `backend/config/optimized_schema.sql`

This is the single source of truth for the database structure.
