# 🔑 API Keys & Passwords Location Guide

## Quick Reference: Where Everything Is Configured

---

## 📧 Email Configuration (SMTP)

### Location
```
backend/.env
```

### Required Variables
```env
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password_here
```

### How to Get
1. **SMTP_USER**: Your Gmail address
2. **SMTP_PASS**: Gmail App Password (NOT regular password)
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Navigate to: App Passwords
   - Create new: Mail → Other → "Book My Turf"
   - Copy 16-character password (remove spaces)

### Used In
- `backend/controllers/contactController.js` - Contact form email sending
- `backend/controllers/otpController.js` - OTP email delivery  
- `backend/controllers/authController.js` - Password reset emails

### Recipient Email
- Contact form emails go to: **bookmyturfsupport@gmail.com**
- This is hardcoded in `contactcontroller.js`, line 56

---

## 🗺️ Google Maps

### API Key: NOT REQUIRED ❌

Your project uses **Google Maps Embed API** which doesn't need an API key!

### Why No API Key?
- Using free embed format: `output=embed` parameter
- No authentication needed
- Unlimited usage
- No billing required

### Previous Configuration (Now Removed)
The project previously might have had:
```env
VITE_GOOGLE_MAPS_API_KEY=xxxxx  ← NOT NEEDED ANYMORE
```

This has been removed because the embed method doesn't require it.

### How It Works
1. Turf owner pastes Google Maps link when adding turf
2. Backend extracts coordinates automatically
3. Frontend displays map using free embed method
4. No API calls, no keys, no cost

### Data Storage
Google Maps data is stored in the database:

**Table:** `turfs`  
**Columns:**
- `google_maps_link` (TEXT) - Original Google Maps URL
- `latitude` (NUMERIC) - Extracted latitude
- `longitude` (NUMERIC) - Extracted longitude
- `formatted_address` (TEXT) - Full address

---

## 🗄️ Database (Supabase)

### Location
```
backend/.env
```

### Required Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_key
```

### How to Get
1. Go to your Supabase project dashboard
2. Navigate to: Settings → API
3. Copy:
   - **Project URL** → SUPABASE_URL
   - **anon public** key → SUPABASE_KEY (for public access)
   - OR **service_role** key → SUPABASE_KEY (for admin access)

### Used In
- `backend/config/db.js` - Database connection
- All controllers for data operations

---

## 💳 Payment (Razorpay)

### Location (Backend)
```
backend/.env
```

### Required Variables
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
```

### Location (Frontend)
```
frontend/.env
```

### Required Variables
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### How to Get
1. Go to: https://dashboard.razorpay.com/
2. Navigate to: Settings → API Keys
3. Generate Test/Live keys
4. Copy:
   - **Key Id** → RAZORPAY_KEY_ID
   - **Key Secret** → RAZORPAY_KEY_SECRET

### Used In
- `backend/controllers/bookingController.js` - Payment processing
- `backend/controllers/tournamentController.js` - Tournament payments
- `frontend/src/pages/TurfDetailPage.tsx` - Payment UI

---

## 📁 Environment Files Summary

### Backend (`backend/.env`)
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key

# Email
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Payment
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx

# Server
PORT=5000
NODE_ENV=development

# JWT (for authentication)
JWT_SECRET=your_random_secret_string
```

### Frontend (`frontend/.env`)
```env
# API
VITE_API_URL=http://localhost:5000

# Payment
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx

# NO GOOGLE MAPS KEY NEEDED
```

---

## 🔒 Security Notes

### Never Commit to Git
Both `.env` files should be in `.gitignore`:
```
.env
.env.local
.env.development
.env.production
```

### Keep Separate
- **Development**: Use test keys
- **Production**: Use live/production keys

### Rotate Regularly
- Change passwords every 3-6 months
- Regenerate API keys if compromised
- Update all places where old keys were used

---

## 📍 Answer to Your Original Question

### "Where is the API key and password for Google Maps?"

**Answer:**
1. **API Key**: No longer required or used
2. **Password**: Not applicable for Google Maps

Your project was updated to use Google Maps Embed API which:
- Works without any API key
- Has no password
- Is completely free
- Has unlimited usage

The turf owner simply pastes a Google Maps share link, and the system handles the rest automatically!

---

## 🔍 How to Find Configured Values

### Check if Email is Configured
```bash
cd backend
cat .env | grep SMTP
```

Should show:
```
SMTP_USER=your_email@gmail.com
SMTP_PASS=***
```

### Check if Database is Configured
```bash
cd backend
cat .env | grep SUPABASE
```

Should show:
```
SUPABASE_URL=https://...
SUPABASE_KEY=***
```

### Verify in Code
Email usage:
```bash
grep -r "SMTP_USER" backend/controllers/
```

Maps (should show NO results for API key):
```bash
grep -r "GOOGLE_MAPS_API_KEY" frontend/src/
```

---

## ✅ Current Status

| Service | API Key Required? | Password Required? | Location |
|---------|-------------------|--------------------|----------|
| **Email (SMTP)** | ❌ No | ✅ Yes (App Password) | `backend/.env` |
| **Google Maps** | ❌ No | ❌ No | Not needed |
| **Supabase** | ✅ Yes | ❌ No | `backend/.env` |
| **Razorpay** | ✅ Yes | ✅ Yes (Secret) | Both `.env` files |

---

## 📞 Support

If you need to find or reset any credentials:
- **Gmail App Password**: Regenerate in Google Account settings
- **Supabase Keys**: Access from Supabase dashboard
- **Razorpay Keys**: Regenerate from Razorpay dashboard
- **Google Maps**: Not needed!
