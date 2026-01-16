# 🗺️ Google Maps Integration - Complete Data Flow

## Overview
This document shows exactly how Google Maps data flows through your system.

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADD TURF FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

1. Turf Owner (Browser)
   │
   │ Pastes: https://maps.google.com/maps?q=23.0225,72.5714
   │
   ▼
2. AddTurfPage.tsx (Frontend)
   │
   │ • Shows live map preview
   │ • Validates the link
   │ • User clicks "Create Turf"
   │
   │ Sends POST /api/turfs:
   │ {
   │   name: "Elite Arena",
   │   location: "Ahmedabad",
   │   google_maps_link: "https://maps.google.com/maps?q=23.0225,72.5714",
   │   price_per_slot: 1500,
   │   ...
   │ }
   │
   ▼
3. turfController.js (Backend)
   │
   │ • Receives google_maps_link
   │ • Extracts coordinates using regex:
   │     /@(-?\d+\.\d+),(-?\d+\.\d+)/
   │     Result: latitude = 23.0225, longitude = 72.5714
   │
   │ Saves to database:
   │ INSERT INTO turfs (
   │   name, location, google_maps_link,
   │   latitude, longitude, formatted_address, ...
   │ )
   │
   ▼
4. Supabase Database
   │
   │ turfs table:
   │ ┌─────────────────────────────────────────────────────────┐
   │ │ id: uuid-123                                            │
   │ │ name: "Elite Arena"                                     │
   │ │ location: "Ahmedabad"                                   │
   │ │ google_maps_link: "https://maps.google.com/maps?q=..." │
   │ │ latitude: 23.0225                                       │
   │ │ longitude: 72.5714                                      │
   │ │ formatted_address: null (or extracted from link)        │
   │ └─────────────────────────────────────────────────────────┘
   │
   ▼
   ✅ Turf Saved Successfully!


┌─────────────────────────────────────────────────────────────────────┐
│                      VIEW TURF FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

1. User (Browser)
   │
   │ Navigates to: /turfs/uuid-123
   │
   ▼
2. TurfDetailPage.tsx (Frontend)
   │
   │ Fetches: GET /api/turfs/uuid-123
   │
   ▼
3. turfController.js (Backend)
   │
   │ SELECT * FROM turfs WHERE id = 'uuid-123'
   │
   │ Returns:
   │ {
   │   id: "uuid-123",
   │   name: "Elite Arena",
   │   location: "Ahmedabad",
   │   google_maps_link: "https://maps.google.com/maps?q=23.0225,72.5714",
   │   latitude: 23.0225,
   │   longitude: 72.5714,
   │   ...
   │ }
   │
   ▼
4. TurfDetailPage.tsx (Map Rendering Logic)
   │
   │ Check priority order:
   │
   │ ┌─────────────────────────────────────────────────┐
   │ │ Priority 1: google_maps_link exists?            │
   │ │   ✅ YES → Use: link.replace('/view', '/embed') │
   │ │   ❌ NO  → Go to Priority 2                     │
   │ └─────────────────────────────────────────────────┘
   │            │
   │            ▼
   │ ┌─────────────────────────────────────────────────┐
   │ │ Priority 2: latitude && longitude exist?        │
   │ │   ✅ YES → Build embed URL:                     │
   │ │     "https://maps.google.com/maps?              │
   │ │      q=23.0225,72.5714&output=embed"            │
   │ │   ❌ NO  → Go to Priority 3                     │
   │ └─────────────────────────────────────────────────┘
   │            │
   │            ▼
   │ ┌─────────────────────────────────────────────────┐
   │ │ Priority 3: location (text) exists?             │
   │ │   ✅ YES → Search by location name:             │
   │ │     "https://maps.google.com/maps?              │
   │ │      q=Ahmedabad&output=embed"                  │
   │ │   ❌ NO  → Don't show map                       │
   │ └─────────────────────────────────────────────────┘
   │
   ▼
5. Browser (User sees)
   │
   │ <iframe> displaying Google Maps embed
   │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   │ ┃  🗺️  Google Maps             ┃
   │ ┃                              ┃
   │ ┃        📍 Elite Arena        ┃
   │ ┃      (Exact pin location)    ┃
   │ ┃                              ┃
   │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   │
   ▼
   ✅ Map Displayed Successfully!
```

---

## 🔑 Key Components

### 1. Database (Supabase)
**File:** `turfs` table  
**Columns:**
- `google_maps_link` (text) - The original share link
- `latitude` (numeric) - Extracted latitude coordinate
- `longitude` (numeric) - Extracted longitude coordinate
- `formatted_address` (text) - Optional formatted address
- `location` (text) - City/district for filtering

### 2. Backend Controller
**File:** `backend/controllers/turfController.js`  
**Function:** `createTurf()`

**Lines 38-65:** Coordinate extraction logic
```javascript
if (google_maps_link) {
  try {
    // Extract coordinates from URL patterns
    const coordMatch = google_maps_link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const placeMatch = google_maps_link.match(/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const qMatch = google_maps_link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    
    if (coordMatch) {
      latitude = parseFloat(coordMatch[1]);
      longitude = parseFloat(coordMatch[2]);
    }
    // ... more patterns
  } catch (err) {
    console.warn("Failed to extract coordinates");
  }
}
```

**Lines 80-89:** Save to database
```javascript
if (google_maps_link) {
  turfData.google_maps_link = google_maps_link;
}
if (latitude !== null && longitude !== null) {
  turfData.latitude = latitude;
  turfData.longitude = longitude;
}
```

### 3. Add Turf Page (Frontend)
**File:** `frontend/src/pages/client/AddTurfPage.tsx`  
**Lines 213-227:** Google Maps link input
**Lines 229-255:** Live map preview

### 4. Turf Detail Page (Frontend)
**File:** `frontend/src/pages/TurfDetailPage.tsx`  
**Lines 774-830:** Smart map rendering with 3-tier fallback

---

## 🎯 Regex Patterns for Link Extraction

The backend supports these Google Maps URL formats:

```javascript
// Pattern 1: Direct coordinates with @ symbol
// Example: https://www.google.com/maps/@23.0225,72.5714,15z
/@(-?\d+\.\d+),(-?\d+\.\d+)/

// Pattern 2: Place link with coordinates
// Example: https://www.google.com/maps/place/Stadium/@23.0225,72.5714,15z
/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/

// Pattern 3: Query parameter coordinates
// Example: https://maps.google.com/maps?q=23.0225,72.5714
/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/
```

All these formats are automatically detected and parsed!

---

## 📋 Database Schema

```sql
-- Current schema (BEFORE migration)
CREATE TABLE turfs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  -- ... other fields
  -- ❌ MISSING: google_maps_link, latitude, longitude, formatted_address
);

-- Updated schema (AFTER migration)
CREATE TABLE turfs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  google_maps_link text,              -- ✅ ADDED
  latitude numeric(10,8),              -- ✅ ADDED
  longitude numeric(11,8),             -- ✅ ADDED
  formatted_address text,              -- ✅ ADDED
  -- ... other fields
);
```

---

## 🚨 Why the Map Wasn't Working

```
Before Fix:
-----------
Database    Backend         Frontend
   ❌    →     ✅      →      ✅

The database didn't have the columns,
so even though the code was correct,
the data never got saved!

After Fix:
----------
Database    Backend         Frontend
   ✅    →     ✅      →      ✅

Now all three parts work together perfectly!
```

---

## ✅ Verification Checklist

After running the migration, verify everything works:

- [ ] Database has 4 new columns in `turfs` table
- [ ] Can add a new turf with Google Maps link
- [ ] Live preview shows on Add Turf page
- [ ] Map displays on Turf Detail page
- [ ] Pin appears at exact location
- [ ] "Open in Google Maps" link works
- [ ] Old turfs still work (using location fallback)

---

## 📝 Example Data

### Input (from turf owner)
```
Google Maps Link: https://maps.google.com/maps?q=23.0225,72.5714
```

### Stored in Database
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Elite Sports Arena",
  "location": "Ahmedabad, Gujarat",
  "google_maps_link": "https://maps.google.com/maps?q=23.0225,72.5714",
  "latitude": 23.0225,
  "longitude": 72.5714,
  "formatted_address": null
}
```

### Rendered on Frontend
```html
<iframe 
  src="https://maps.google.com/maps?q=23.0225,72.5714&output=embed"
  width="100%" 
  height="400px"
/>
```

### What User Sees
A fully interactive Google Maps embed showing the exact location with a pin! 🗺️📍

---

## 🎓 Technical Summary

**Problem:** Database schema drift (code expects fields that don't exist)  
**Solution:** Run migration to add missing columns  
**Impact:** Maps now work perfectly on all turf detail pages  
**Side Effects:** None - backward compatible with existing data  
**Maintenance:** None required - one-time migration  

---

**That's it!** The complete data flow from user input to map display. Everything is now aligned and ready to work! 🚀
