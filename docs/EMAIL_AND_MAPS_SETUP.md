# Email & Google Maps Setup Guide

## Overview
This guide will help you set up email delivery for the contact form and Google Maps integration for precise turf location display.

---

## 1. Email Configuration (Contact Form)

### Issue Fixed ✅
- **Recipient corrected**: Emails now send to `bookmyturfsupport@gmail.com`
- **Better error logging**: Detailed console logs for debugging
- **Enhanced email format**: Professional HTML email templates
- **SMTP verification**: Connection verified before sending

### Setup Steps

#### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Scroll to **App passwords** and click on it
4. Select **Mail** and **Other (Custom name)**
5. Enter "Book My Turf Backend" as the app name
6. Click **Generate**
7. Copy the 16-character password (remove spaces)

#### Step 2: Configure Environment Variables

Create or update `.env` file in the `backend` folder:

```env
# Email Configuration for Contact Form
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_character_app_password

# Example:
# SMTP_USER=bookmyturfofficial@gmail.com
# SMTP_PASS=abcd efgh ijkl mnop  (remove spaces when pasting)
```

#### Step 3: Restart Backend Server

After adding the environment variables, restart your backend:

```bash
cd backend
npm run dev
```

### Testing Email Delivery

1. Navigate to the Contact Us page on your website
2. Fill out the form with your details
3. Submit the form
4. Check the backend console for these messages:
   - ✅ SMTP connection verified successfully
   - ✅ Email sent successfully: [message-id]
   - 📧 Email sent to: bookmyturfsupport@gmail.com
5. Check `bookmyturfsupport@gmail.com` inbox

### Troubleshooting Email Issues

If emails aren't being delivered:

**Check 1: SMTP Credentials**
```bash
# In backend terminal, you should see:
⚠️ SMTP credentials not configured. Email not sent.
# If you see this, check your .env file
```

**Check 2: Gmail App Password**
- Make sure you're using an App Password, NOT your regular Gmail password
- Remove all spaces from the app password
- Ensure 2-Step Verification is enabled on your Google account

**Check 3: Gmail Security**
- Check if Gmail blocked the sign-in attempt
- Go to: https://myaccount.google.com/notifications
- Look for blocked sign-in attempts and allow them

**Check 4: Error Messages**
```bash
# Look for detailed error logs in console:
❌ Email sending failed: [error details]
```

Common error codes:
- `EAUTH`: Invalid credentials - check SMTP_USER and SMTP_PASS
- `ECONNREFUSED`: Cannot connect to Gmail - check internet connection
- `535`: Authentication failed - regenerate App Password

---

## 2. Google Maps Integration

### Database Migration Required ✅

#### Step 1: Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add Google Maps fields to turfs table
ALTER TABLE turfs 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Create index for coordinates
CREATE INDEX IF NOT EXISTS idx_turfs_coordinates ON turfs(latitude, longitude);
```

Location: `backend/config/schema_update_google_maps.sql`

#### Step 2: Verify Migration

Run this query to check if columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'turfs'
ORDER BY ordinal_position;
```

You should see: `google_maps_link`, `latitude`, `longitude`, `formatted_address`

### How It Works Now

#### Backend Enhancement ✅
- **Automatic coordinate extraction** from Google Maps links
- Supports multiple URL formats:
  - Share links: `https://maps.app.goo.gl/xxxxx`
  - Place links: `https://www.google.com/maps/place/...`
  - Coordinate links: `https://www.google.com/maps/@lat,lng,...`
- **Formatted address** automatically extracted from place names

#### Frontend Display ✅
- **Shows formatted address** instead of generic city names
- **Precise map pin** at exact coordinates
  - Red marker appears at the exact location
- **Fallback support**:
  1. First preference: Google Maps link (direct embed)
  2. Second: Latitude/Longitude coordinates
  3. Third: Text search using location field

#### For Turf Owners (Add Turf Page)

When adding a new turf:
1. Get the Google Maps link for your turf location:
   - Open Google Maps
   - Search for your turf location
   - Click "Share" → "Copy link"
2. Paste the entire link in the **Google Maps Address** field
3. The system will automatically:
   - Extract the coordinates
   - Store the formatted address
   - Display the exact location on the turf details page

### Testing Google Maps

1. **Add a new turf** with a Google Maps link
2. Check backend console for:
   ```
   📍 Extracted coordinates: lat=23.0225, lng=72.5714
   📍 Extracted address: Ahmedabad, Gujarat, India
   ✅ Turf created successfully with ID: [uuid]
   ```
3. **View turf details** page
4. Verify:
   - Map shows the exact location with a red pin
   - Address displays the full location (not just city)
   - "Open in Google Maps" link works

### Supported URL Formats

All these formats work without any API key:

```
✅ https://maps.app.goo.gl/abc123def456
✅ https://www.google.com/maps/place/Stadium+Name/@23.022,72.571,17z
✅ https://www.google.com/maps/@23.022505,72.571411,17z
✅ https://goo.gl/maps/abc123
```

---

## 3. Benefits

### Email System
- ✅ Reliable delivery to support inbox
- ✅ Professional formatted emails
- ✅ Automatic reply-to setup
- ✅ Message saved in database even if email fails
- ✅ Detailed error logging for debugging

### Google Maps
- ✅ **No API key required**
- ✅ Exact location display (not just city)
- ✅ Red marker at precise coordinates
- ✅ Works offline after initial load
- ✅ One-click "Open in Google Maps" link
- ✅ Automatic address extraction

---

## 4. Verification Checklist

### Email Setup ✓
- [ ] Gmail App Password generated
- [ ] SMTP_USER and SMTP_PASS added to backend/.env
- [ ] Backend server restarted
- [ ] Contact form submission tested
- [ ] Email received in bookmyturfsupport@gmail.com
- [ ] Success logs visible in backend console

### Google Maps Setup ✓
- [ ] Database migration executed
- [ ] New columns verified in database
- [ ] Test turf created with Google Maps link
- [ ] Coordinates extracted successfully (check console)
- [ ] Turf details page shows exact location
- [ ] Map displays with red marker
- [ ] Formatted address shown instead of city name
- [ ] "Open in Google Maps" link works

---

## 5. For Existing Turfs

If you have existing turfs without Google Maps data:

1. **Edit each turf** in the dashboard
2. **Add the Google Maps link** in the appropriate field
3. **Save** - coordinates will be automatically extracted
4. **Verify** by viewing the turf details page

Or update directly in Supabase:

```sql
UPDATE turfs 
SET google_maps_link = 'https://maps.app.goo.gl/yourlink',
    latitude = 23.0225,
    longitude = 72.5714,
    formatted_address = 'Your Full Address Here'
WHERE id = 'turf-uuid-here';
```

---

## 6. Important Notes

### Email
- **Gmail App Password**: Required if using Gmail (regular password won't work)
- **Rate Limits**: Gmail has sending limits (~500 emails/day for free accounts)
- **Spam inbox**: First emails might go to spam - mark as "Not Spam"

### Google Maps
- **No cost**: The embed method is completely free
- **No quotas**: Unlimited daily usage
- **Privacy**: No tracking or analytics
- **Offline**: Maps cache after first load

---

## Support

If you encounter issues:

1. **Check backend console logs** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Test with a simple email/map** first
4. **Check Supabase logs** for database errors

Contact your development team if problems persist.
