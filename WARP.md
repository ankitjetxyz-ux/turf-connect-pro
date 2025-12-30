# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This repo implements a full-stack turf booking platform:
- **Frontend (`frontend/`)**: Vite + React + TypeScript + shadcn-ui, with React Router and React Query. It provides public marketing pages, players' and clients' dashboards, turf discovery and detail views, slot management, chat, and Razorpay-backed payments.
- **Backend (`backend/`)**: Express server talking to **Supabase Postgres** via `@supabase/supabase-js`. It exposes auth, turf, slot, booking, payment, chat, contact, and tournament APIs, and integrates **Razorpay** and **Socket.IO** for realtime chat and booking notifications.

For local development the **frontend dev server proxies `/api` to the backend** (see `frontend/vite.config.ts`), so both services are usually run together.

---

## Repository Layout

- `frontend/` – Vite React app (TS). Key areas:
  - `src/App.tsx` – central router and providers (React Query, tooltips, toasters).
  - `src/pages/` – page-level routes:
    - Public: `Index`, `TurfsPage`, `TurfDetailPage`, `TournamentsPage`, `AboutPage`, `ContactPage`, `ComingSoonPage`, auth pages.
    - Player: `player/PlayerDashboard.tsx`.
    - Client (turf owners): `client/ClientDashboard.tsx`, `TurfSlotsPage.tsx`, `AddTurfPage.tsx`, `AddTournamentPage.tsx`, `ClientBookings.tsx`.
    - Chat: `ChatPage.tsx`.
  - `src/routes/ProtectedRoute.tsx` – role-aware route guard based on `localStorage` token/role.
  - `src/services/` – HTTP layer (Axios instance in `api.ts` plus domain-specific services for auth, turfs, slots, bookings).
  - `src/components/ui/` – shadcn-style UI primitives (buttons, cards, dialogs, toasts, etc.).
  - `src/hooks/useChat.ts` – chat data + Socket.IO integration.

- `backend/` – Express API server with Supabase persistence:
  - `server.js` – app bootstrap, globals, health routes, Socket.IO server wiring.
  - `routes/` – route modules for auth, turfs, slots, bookings, tournaments, chat, payments, contact.
  - `controllers/` – business logic per domain (auth, turf, slot, booking, payment, chat, contact, tournament).
  - `config/db.js` – Supabase client configuration.
  - `config/*.sql` – Supabase schema definition and migrations (notably `complete_schema.sql`).
  - `scripts/` – small node scripts for local end-to-end and smoke tests (health, registration, full booking flow).

- Top-level documentation for recent large features:
  - `TURF_DETAIL_PAGE_UPDATES.md`, `IMPLEMENTATION_SUMMARY.md`, `QUICK_START_GUIDE.md` – detailed docs for the Turf detail + payment flow.
  - `SLOT_MANAGEMENT_GUIDE.md`, `SLOT_TESTING_GUIDE.md`, `SLOT_IMPLEMENTATION_COMPLETE.md`, `SLOT_QUICK_REFERENCE.md` – slot management implementation and testing docs for clients.

---

## Development & Common Commands

All commands below assume repo root is this directory.

### Prerequisites

- Node.js + npm installed (see `frontend/README.md`).
- A Supabase project configured with the schema in `backend/config/complete_schema.sql` and related SQL files.
- Razorpay test or live keys and JWT secret defined in `backend/.env` (see `.env.example`).

> **Important port note:**
> - `frontend/vite.config.ts` proxies `/api` to `http://localhost:8080`.
> - `backend/server.js` listens on `process.env.PORT || 8080`.
> - The sample `.env.example` sets `PORT=5000`, which will **break the Vite proxy**; for local dev either remove `PORT` or set `PORT=8080`, or update the Vite proxy if you intentionally change the backend port.

### Backend (Express + Supabase + Razorpay)

From repo root:

- **Install dependencies**
  - `cd backend && npm install`

- **Run backend in dev mode (no auto-reload)**
  - `cd backend && npm run dev`

- **Run backend with Nodemon auto-reload**
  - `cd backend && npm run start:dev`

- **Run backend in production mode**
  - `cd backend && npm start`

- **Health check (manual)**
  - HTTP: `curl http://localhost:8080/api/health`
  - Node script: `cd backend && node scripts/test_health.js`

- **Simple auth registration smoke test**
  - `cd backend && node scripts/test_register_simple.js`

- **End-to-end API flow test (register client + player, create turf & slots, book a slot)**
  - Ensure backend is running.
  - Then: `cd backend && node scripts/test_flow.js`

> There is no Jest/Mocha-style automated test suite configured for the backend; the `scripts/` directory provides the main repeatable test flows.

### Frontend (Vite + React + TypeScript)

From repo root:

- **Install dependencies**
  - `cd frontend && npm install`

- **Start dev server (Vite)**
  - `cd frontend && npm run dev`
  - Serves the app on `http://localhost:3000` with `/api` proxied to the backend.

- **Build production bundle**
  - `cd frontend && npm run build`

- **Build using development mode (useful for debugging production bundle issues)**
  - `cd frontend && npm run build:dev`

- **Preview production build locally**
  - `cd frontend && npm run preview`

- **Lint the frontend codebase**
  - `cd frontend && npm run lint`

There is currently **no automated test runner (e.g., Jest/Vitest) configured on the frontend**. Testing is driven by the manual checklists and flows detailed in the MD guides listed below.

---

## High-Level Architecture

### Domain Model (Supabase / Backend)

The SQL in `backend/config/complete_schema.sql` plus later schema update files defines the core data model:

- `users` – players, clients (turf owners), and admins (`role` column). Auth routes in `backend/routes/authRoutes.js` and controller in `controllers/authController.js` (not re-listed here) manage registration, login, and role-restricted endpoints.
- `turfs` – individual turf venues owned by a user. Managed via `controllers/turfController.js` and `routes/turfRoutes.js`:
  - Public list and detail endpoints: `GET /api/turfs`, `GET /api/turfs/:id`.
  - Client-only endpoints for creating and listing own turfs: `POST /api/turfs`, `GET /api/turfs/my`.
  - Facilities and images are stored as text/arrays; `getAllTurfs` derives a `sports` list from descriptive text.
- `slots` – bookable time blocks for a turf:
  - Schema associates each slot to a turf with date/time, price, and `is_booked` flag.
  - `controllers/slotController.js` handles creation, update, deletion, and listing per turf via `routes/slotRoutes.js`.
- `bookings` – reservations tying players to specific slots:
  - Legacy `bookSlot` flow for single-slot booking.
  - Modern multi-slot booking with Razorpay order via `createBookingAndOrder` in `bookingController.js` and `POST /api/bookings/create-and-order`.
  - Player and client dashboards use `getMyBookings` and `getClientBookings` to retrieve filtered, time-bounded booking information.
- `payments` – payment records, associated booking IDs, Razorpay IDs, and status. `paymentController.js` and part of `bookingController.js` update these during payment verification.
- `chats`, `messages` – owner–player conversations seeded automatically when payments are verified, used by the chat UI and Socket.IO events.
- `tournaments`, `tournament_participants` – tournament listing/registration linked to specific turfs.
- `earnings` – aggregates of revenue for admin and owners (updated via `increment_earning` function or fallback logic in `paymentController.js`).
- `contact_messages` and `reviews` – support and feedback data.

The Express server in `backend/server.js` wires this together, attaches middleware, mounts all route modules under `/api/*`, and sets up Socket.IO for chat and booking notifications.

### Frontend Routing & State

- `src/App.tsx` creates a single React tree with:
  - `QueryClientProvider` (React Query) for data fetching and caching.
  - Two toaster systems (`@/components/ui/toaster` and `@/components/ui/sonner`) for user feedback.
  - `BrowserRouter` with a route tree that distinguishes **public routes**, **player-only routes**, and **client-only routes** using `ProtectedRoute`.

- **Routing highlights:**
  - Public:
    - `/` – marketing/landing page (`Index`).
    - `/turfs` – browse turfs (`TurfsPage`).
    - `/turfs/:id` – single turf booking experience (`TurfDetailPage`).
    - `/tournaments`, `/about`, `/contact`, plus several placeholder `ComingSoonPage` routes.
    - `/login`, `/register` for authentication.
  - Player-only (role `player`):
    - `/player/dashboard` – player dashboard with bookings overview.
  - Client-only (role `client`):
    - `/client/dashboard` – turf owner dashboard.
    - `/client/turfs/:turfId/slots` – slot management UI (`TurfSlotsPage`).
    - `/client/add-turf`, `/client/add-tournament`, `/client/bookings` for turf and tournament administration.
  - Authenticated (any role):
    - `/chat` – chat interface (`ChatPage`) behind `ProtectedRoute` without a fixed role.

- **Auth & API integration:**
  - `src/services/api.ts` creates an Axios instance with `baseURL: "/api"` and automatically injects a `Bearer` token from `localStorage` into each request.
  - Role and `user_id` are stored in `localStorage` and interpreted by `ProtectedRoute` and feature components such as `TurfDetailPage` and chat.

### Turf Detail Page & Booking Flow (Player Side)

The Turf detail and booking flow is central to the product and is heavily documented in:
- `TURF_DETAIL_PAGE_UPDATES.md`
- `IMPLEMENTATION_SUMMARY.md`
- `QUICK_START_GUIDE.md`

Code-wise, this lives in `frontend/src/pages/TurfDetailPage.tsx` and the associated services:

- Fetches turf details via `turfService.getTurfDetails(id)` and slots via `slotService.getSlotsByTurf(id)`.
- Renders a full-page experience:
  - Image gallery carousel with navigation arrows and indicator dots; supports images from arrays or comma-separated strings.
  - Turf information: name, location, rating, reviews, description, sports badges, facilities with icon mapping, and quick info grid (open hours, size, surface).
  - 7-day date picker and responsive time-slot grid.
  - Multi-select slot selection with visual states for available, selected, and booked slots.
  - Sticky sidebar summarizing selected slots, total amount, and providing a payment CTA plus contact (call/chat) actions.
- Integrates with Razorpay:
  - `loadRazorpay` dynamically injects Razorpay checkout script.
  - `createBooking` (`POST /bookings/create-and-order`) initializes Supabase bookings and gets an order from the backend.
  - On successful Razorpay callback, `verifyPayment` (`POST /payments/verify`) confirms payment and updates bookings/slots.
  - On success, the user is redirected to `/player/dashboard`; on error, a toast-like overlay displays error messages.
- Enforces **role-based access**:
  - Only logged-in users with `role === "player"` can proceed to payment.
  - Non-players see appropriate error toasts and cannot complete booking.

### Turf Slot Management (Client Side)

The slot management UI in `frontend/src/pages/client/TurfSlotsPage.tsx` is fully documented in:
- `SLOT_MANAGEMENT_GUIDE.md`
- `SLOT_TESTING_GUIDE.md`
- `SLOT_IMPLEMENTATION_COMPLETE.md`
- `SLOT_QUICK_REFERENCE.md`

Key architectural aspects:

- Driven by route `/client/turfs/:turfId/slots`, behind `ProtectedRoute role="client"`.
- Uses `slotService.getSlotsByTurf` and `slotService.createSlot` plus direct `api.put`/`api.delete` calls to `/slots/:id` for editing/deletion.
- Organizes logic inside a single page component:
  - Utility functions for time conversions, validation, overlap detection, and toast display.
  - State slices for single-slot form, bulk slot creation, and edit mode.
  - Derived summary stats (total, available, booked, average price).
- The backend controller `controllers/slotController.js` enforces basic validations and uses Supabase row-level ownership checks for updates/deletes (via joined `turfs(owner_id)` fields).

### Chat & Realtime

- **Backend**: `server.js` creates a Socket.IO server and attaches it to the Express app (`app.set('io', io)`). It defines events for:
  - `join_chat` – join per-chat rooms.
  - `typing` – typing indicators per chat room.
  - `join_user` – per-user rooms used to push owner booking notifications.
- **Payment verification** (`paymentController.verifyPayment`) automatically creates or reuses a chat between owner and player after a successful payment, and emits a `booking_confirmed` event to the owner's room.
- **Frontend**: `src/hooks/useChat.ts` and the components under `src/components/chat/` coordinate HTTP polling with Socket.IO push events. The hook:
  - Loads messages via `GET /chat/:chatId/messages`.
  - Sends new messages via `POST /chat/:chatId/message`.
  - Joins the appropriate chat room and listens for `receive_message` and `typing` events.

---

## Testing & QA Resources

Automated tests are minimal; most coverage is via explicit manual flows and scripts.

### Backend

- Use the Node scripts in `backend/scripts/` as building blocks for testing:
  - `test_health.js` – checks `/api/health`.
  - `test_register_simple.js` – registers a simple client user against `/api/auth/register`.
  - `test_flow.js` – orchestrates a complete flow:
    - Register client and player accounts.
    - Create a turf.
    - Create one or more slots.
    - Log in as player, book a slot via the modern multi-slot endpoint.
    - Validate that bookings and chats respond correctly.

These scripts are designed to be run against a running backend instance and rely on a correctly configured Supabase and Razorpay environment.

### Frontend

Manual testing is defined in the following docs (do not duplicate their checklists here; refer to them directly):

- **Turf Detail & Booking**
  - `TURF_DETAIL_PAGE_UPDATES.md` – complete functional and technical guide.
  - `IMPLEMENTATION_SUMMARY.md` – high-level overview of what was implemented.
  - `QUICK_START_GUIDE.md` – concise steps to spin up the app, navigate to a turf, and exercise the booking and payment flows.

- **Slot Management**
  - `SLOT_MANAGEMENT_GUIDE.md` – end-to-end description of the slot management page, APIs, validation rules, and troubleshooting.
  - `SLOT_TESTING_GUIDE.md` – detailed testing scenarios, including edge cases, performance checks, and accessibility.
  - `SLOT_QUICK_REFERENCE.md` – quick reference for common slot operations and constraints.
  - `SLOT_IMPLEMENTATION_COMPLETE.md` – overarching summary of slot feature implementation and quality gates.

When modifying or extending these areas, consult the above documents first; they encode key assumptions about data shapes, validation rules, and cross-cutting behavior between frontend and backend.
