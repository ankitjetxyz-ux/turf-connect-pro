**Turf Connect Pro** is a full-stack web application that enables sports enthusiasts to discover, book, and manage turf (sports ground) reservations. The platform supports three user roles – **Players**, **Turf Owners (Clients)**, and **Admins** – each with dedicated features and dashboards.

### 🎯 Key Highlights

- 🔐 **Role-Based Access Control** – Players, Owners, and Admins
- 💳 **Integrated Payments** – Razorpay payment gateway
- 📍 **Location Services** – Google Maps integration with coordinate extraction
- 💬 **Real-Time Chat** – Socket.IO powered messaging between players and owners
- 📊 **Analytics Dashboard** – Revenue tracking, booking insights, and performance metrics
- ✅ **Verification System** – Admin approval workflow for new turfs
- 📧 **Email Notifications** – Automated emails for bookings, approvals, and OTP verification

---

## ✨ Features

### For Players 👤
| Feature | Description |
|---------|-------------|
| 🔍 **Browse Turfs** | Search and filter turfs by location, price, and facilities |
| 📅 **Book Slots** | Select dates and time slots with multi-slot booking support |
| 💳 **Secure Payments** | Pay via Razorpay with instant confirmation |
| 🏆 **Tournaments** | Register teams for sports tournaments |
| 💬 **Chat with Owners** | Direct messaging for queries before booking |
| ⭐ **Reviews & Ratings** | Rate and review turfs after playing |
| 📱 **Profile Management** | Track bookings, tournaments, and personal stats |

### For Turf Owners (Clients) 🏢
| Feature | Description |
|---------|-------------|
| ➕ **Add Turfs** | List turfs with images, facilities, pricing, and Google Maps location |
| 📆 **Slot Management** | Create and manage time slots with custom pricing |
| 📊 **Analytics Dashboard** | Real-time revenue, booking trends, and performance metrics |
| 🏆 **Host Tournaments** | Create and manage sports tournaments |
| 💰 **Earnings Tracking** | Monitor revenue with automatic admin fee deduction |
| 💬 **Customer Chat** | Communicate with potential and existing customers |
| 📧 **Booking Notifications** | Instant alerts for new bookings and cancellations |

### For Admins 👨‍💼
| Feature | Description |
|---------|-------------|
| 📋 **Dashboard Overview** | Platform-wide statistics and metrics |
| ✅ **Turf Verification** | Review and approve/reject turf submissions |
| 👥 **User Management** | Monitor registered users and activity |
| 💵 **Revenue Tracking** | Platform commission and earnings overview |
| 📧 **Automated Emails** | Approval/rejection notifications to owners |

---

## 🛠️ Tech Stack

### Frontend (User App)
```
├── React 18          # UI Library
├── TypeScript        # Type Safety
├── Vite              # Build Tool & Dev Server
├── Tailwind CSS      # Utility-First Styling
├── shadcn/ui         # Modern UI Components
├── React Router v6   # Client-Side Routing
├── TanStack Query    # Server State Management
├── Axios             # HTTP Client
├── Socket.IO Client  # Real-Time Communication
├── Recharts          # Analytics Charts
├── Framer Motion     # Animations
├── React Hook Form   # Form Handling
├── Zod               # Schema Validation
└── date-fns          # Date Utilities
```

### Frontend (Admin Panel)
```
├── React 18 + TypeScript
├── Vite + Tailwind CSS
├── shadcn/ui Components
└── React Router + TanStack Query
```

### Backend
```
├── Node.js           # Runtime Environment
├── Express 5         # Web Framework
├── Supabase Client   # Database ORM
├── PostgreSQL        # Database (via Supabase)
├── JWT               # Authentication
├── bcrypt            # Password Hashing
├── Razorpay          # Payment Processing
├── Socket.IO         # Real-Time Events
├── Nodemailer        # Email Service
├── Multer            # File Uploads
└── express-rate-limit # API Rate Limiting
```

---

## 📁 Project Structure

```
turf-connect-pro/
├── 📂 admin/                    # Admin Panel (Vite + React + TS)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── layouts/             # Admin layout wrapper
│   │   ├── pages/
│   │   │   └── admin/           # Admin pages
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── AdminLogin.tsx
│   │   │       ├── VerificationPanel.tsx
│   │   │       └── TurfVerificationDetail.tsx
│   │   ├── routes/              # Route definitions
│   │   ├── services/            # API services
│   │   └── App.tsx              # Root component
│   └── package.json
│
├── 📂 users/                    # User Application
│   ├── 📂 backend/              # Express API Server
│   │   ├── config/
│   │   │   └── db.js            # Supabase client setup
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── chatController.js
│   │   │   ├── paymentController.js
│   │   │   ├── profileController.js
│   │   │   ├── slotController.js
│   │   │   ├── tournamentController.js
│   │   │   ├── turfController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/          # Auth & validation middleware
│   │   ├── routes/              # API route definitions
│   │   ├── services/
│   │   │   └── emailService.js  # Email templates & sending
│   │   ├── uploads/             # Profile image storage
│   │   ├── server.js            # Entry point
│   │   └── package.json
│   │
│   ├── 📂 frontend/             # React User Interface
│   │   ├── src/
│   │   │   ├── components/      # Reusable components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── layouts/         # Page layouts
│   │   │   ├── lib/             # Utilities
│   │   │   ├── pages/
│   │   │   │   ├── Index.tsx           # Landing page
│   │   │   │   ├── TurfsPage.tsx       # Browse turfs
│   │   │   │   ├── TurfDetailPage.tsx  # Turf details & booking
│   │   │   │   ├── TournamentsPage.tsx # Browse tournaments
│   │   │   │   ├── ChatPage.tsx        # Messaging
│   │   │   │   ├── ProfilePage.tsx     # User dashboard
│   │   │   │   ├── client/             # Owner pages
│   │   │   │   │   ├── AddTurfPage.tsx
│   │   │   │   │   ├── TurfSlotsPage.tsx
│   │   │   │   │   ├── AddTournamentPage.tsx
│   │   │   │   │   └── ClientDashboard.tsx
│   │   │   │   └── player/             # Player pages
│   │   │   │       └── PlayerDashboard.tsx
│   │   │   ├── routes/          # Protected route wrapper
│   │   │   ├── services/        # API service modules
│   │   │   ├── types/           # TypeScript interfaces
│   │   │   └── App.tsx          # Root component
│   │   └── package.json
│   │
│   └── 📂 docs/                 # Documentation
│       ├── schemainfo.md        # Database schema docs
│       ├── QUICK_START_GUIDE.md
│       └── ANALYTICS_SYSTEM_GUIDE.md
│
└── README.md                    # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn** or **bun**
- **PostgreSQL** database (we recommend [Supabase](https://supabase.com))
- **Razorpay** account for payments
- **SMTP** credentials for email (Gmail, SendGrid, etc.)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/turf-connect-pro.git
cd turf-connect-pro
```

### 2️⃣ Backend Setup

```bash
cd users/backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase (PostgreSQL)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin (for earnings)
ADMIN_ENTITY_ID=00000000-0000-0000-0000-000000000000
```

Start the backend server:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 3️⃣ User Frontend Setup

```bash
cd users/frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

Start the development server:

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4️⃣ Admin Panel Setup

```bash
cd admin
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the admin panel:

```bash
npm run dev
```

Admin panel will be available at: `http://localhost:5174`

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/send-otp` | Send OTP for email verification |
| `POST` | `/auth/verify-otp` | Verify OTP code |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout user |
| `POST` | `/auth/forgot-password` | Initiate password reset |
| `POST` | `/auth/reset-password` | Reset password with OTP |

### Turf Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/turfs` | List all approved turfs |
| `GET` | `/turfs/:id` | Get turf details |
| `POST` | `/turfs` | Create new turf (owner) |
| `PUT` | `/turfs/:id` | Update turf |
| `DELETE` | `/turfs/:id` | Delete turf |
| `GET` | `/turfs/owner/my-turfs` | Get owner's turfs |

### Slot Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/slots/turf/:turfId` | Get available slots |
| `POST` | `/slots` | Create slots (owner) |
| `PUT` | `/slots/:id` | Update slot |
| `DELETE` | `/slots/:id` | Delete slot |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/bookings/create-and-order` | Create booking + Razorpay order |
| `POST` | `/bookings/verify-payment` | Verify payment & confirm booking |
| `GET` | `/bookings/my-bookings` | Get user's bookings |
| `GET` | `/bookings/owner-bookings` | Get owner's turf bookings |
| `POST` | `/bookings/:id/cancel` | Cancel booking |

### Tournament Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tournaments` | List all tournaments |
| `GET` | `/tournaments/:id` | Get tournament details |
| `POST` | `/tournaments` | Create tournament (owner) |
| `POST` | `/tournaments/:id/register` | Register team |
| `POST` | `/tournaments/:id/verify-payment` | Verify registration payment |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/conversations` | Create/get conversation |
| `GET` | `/chat/conversations` | List user's conversations |
| `GET` | `/chat/:chatId/messages` | Get chat messages |
| `POST` | `/chat/:chatId/messages` | Send message |

### Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/profile/me` | Get user profile + stats |
| `PUT` | `/profile/me` | Update profile |
| `POST` | `/profile/upload-image` | Upload profile image |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/all` | Get comprehensive analytics |
| `GET` | `/analytics/revenue` | Get revenue data |
| `GET` | `/analytics/bookings` | Get booking statistics |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/login` | Admin login |
| `GET` | `/admin/dashboard-stats` | Dashboard overview |
| `GET` | `/admin/pending-turfs` | Pending verifications |
| `POST` | `/admin/turfs/:id/approve` | Approve turf |
| `POST` | `/admin/turfs/:id/reject` | Reject turf with reason |

---

## 🗄️ Database Schema

The application uses **PostgreSQL** via **Supabase** with 15 tables:

### Core Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK) │ name │ email │ password │ role │ phone         │
│ profile_image_url │ email_verified │ created_at │ updated_at   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ owner_id          user_id
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│     TURFS       │    │    BOOKINGS     │
├─────────────────┤    ├─────────────────┤
│ id │ owner_id   │◄───│ id │ user_id    │
│ name │ location │    │ slot_id         │
│ price_per_slot  │    │ turf_id         │
│ facilities      │    │ status          │
│ images[]        │    │ total_amount    │
│ rating          │    │ razorpay_order  │
│ google_maps_url │    └────────┬────────┘
│ latitude/long   │             │
│ verification    │             │
└────────┬────────┘             │
         │                      │
         │ turf_id              │ slot_id
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│     SLOTS       │◄───│    PAYMENTS     │
├─────────────────┤    ├─────────────────┤
│ id │ turf_id    │    │ id │ booking_ids│
│ date │ start    │    │ user_id         │
│ end_time        │    │ amount          │
│ price           │    │ razorpay_*      │
│ is_booked       │    │ status          │
└─────────────────┘    └─────────────────┘
```

### Additional Tables

| Table | Purpose |
|-------|---------|
| `user_sessions` | JWT refresh tokens & session management |
| `otp_verifications` | Email OTP for registration/password reset |
| `reviews` | Turf ratings and comments |
| `tournaments` | Sports tournament listings |
| `tournament_participants` | Team registrations |
| `chats` | Chat threads between players & owners |
| `messages` | Individual chat messages |
| `earnings` | Revenue tracking for owners & admin |
| `contact_messages` | Contact form submissions |
| `booking_verification_codes` | Entry verification codes |

---

## 💳 Payment Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Player     │     │   Backend    │     │   Razorpay   │
│   Frontend   │     │   Server     │     │   Gateway    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Select Slots    │                    │
       │───────────────────>│                    │
       │                    │                    │
       │ 2. Create Order    │ 3. Create Order   │
       │<───────────────────│───────────────────>│
       │                    │                    │
       │      4. Order ID + Key                  │
       │<───────────────────│<───────────────────│
       │                    │                    │
       │ 5. Open Razorpay   │                    │
       │   Checkout Modal   │                    │
       │                    │                    │
       │ 6. Payment Complete│                    │
       │<────────────────────────────────────────│
       │                    │                    │
       │ 7. Verify Payment  │                    │
       │───────────────────>│ 8. Verify Signature│
       │                    │───────────────────>│
       │                    │                    │
       │ 9. Booking Confirmed                    │
       │<───────────────────│                    │
       │                    │                    │
```

### Revenue Distribution
- **Platform Fee**: ₹50 per booking (Admin)
- **Owner Earnings**: Total Amount - ₹50

---

## 🔐 Authentication Flow

1. **Registration**
   - User enters email → Backend sends OTP
   - User verifies OTP → Completes registration
   - Password hashed with bcrypt (12 rounds)

2. **Login**
   - Email + Password verification
   - JWT access token (short-lived)
   - Refresh token stored in database

3. **Protected Routes**
   - JWT verification middleware
   - Role-based access control (player/client/admin)

---

## 📧 Email Templates

The system sends automated emails for:

| Trigger | Email Type |
|---------|------------|
| Registration | OTP Verification |
| Login (new device) | Security Alert |
| Booking Confirmed | Confirmation + Details |
| Turf Approved | Approval Notification |
| Turf Rejected | Rejection + Reason |
| Password Reset | Reset OTP |

---

## 🗺️ Google Maps Integration

Turf owners can paste Google Maps share links. The system automatically extracts:
- **Latitude** & **Longitude** coordinates
- **Formatted Address**

Supported link formats:
```
https://maps.google.com/?q=12.9716,77.5946
https://goo.gl/maps/xxxxx
https://www.google.com/maps/place/.../@12.9716,77.5946,...
```

---

## 📊 Analytics Features

### Owner Dashboard Metrics
- **Total Revenue** (with period comparison)
- **Booking Count** & Completion Rate
- **Slot Utilization** percentage
- **Revenue by Day** chart
- **Peak Hours** analysis
- **Top Performing Turfs**

### Admin Dashboard Metrics
- Total Turfs (Live vs Pending)
- User Statistics
- Weekly Bookings
- Platform Revenue

---

## 🧪 Testing

### Test Razorpay Payments

Use Razorpay test credentials:
- **Card**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3 digits

### API Testing

```bash
# Health Check
curl http://localhost:5000/api/health

# Test Echo
curl -X POST http://localhost:5000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 🚀 Deployment

### Backend (Node.js)

```bash
# Build and start
npm start

# With PM2 (recommended)
pm2 start server.js --name turf-backend
```

### Frontend (Vite)

```bash
# Build for production
npm run build

# Output in dist/ folder
# Deploy to Vercel, Netlify, or any static host
```

### Environment Variables (Production)

Ensure all environment variables are set in your hosting platform:
- Supabase credentials
- Razorpay LIVE keys
- SMTP credentials
- JWT secret (use strong random string)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

Built with ❤️ for the sports community

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Razorpay](https://razorpay.com) - Payment Gateway
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Tailwind CSS](https://tailwindcss.com) - Styling Framework

---

<div align="center">

**[⬆ Back to Top](#️-turf-connect-pro)**

</div>
