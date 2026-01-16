# TurfDetailPage - Complete Implementation Guide

## Overview
The TurfDetailPage has been completely redesigned with enhanced UI/UX and full Razorpay payment gateway integration. The page is now a comprehensive booking experience with multiple interactive features.

## Key Features Implemented

### 1. Image Gallery
- **Multiple Image Support**: Displays turf images in a carousel format
- **Navigation Arrows**: Left and right chevron buttons to browse images
- **Image Indicators**: Dots at the bottom showing current image position
- **Click-to-Select**: Users can click on indicator dots to jump to specific images
- **Responsive**: Adapts to different screen sizes (50vh on mobile, 60vh on desktop)
- **Fallback**: Default image provided if no images are available

### 2. Image Action Buttons
- **Like/Favorite Button**: Heart icon in top-right (ready for wishlist functionality)
- **Share Button**: Share2 icon for social sharing (ready to connect with share APIs)

### 3. Turf Information Card
- **Title & Location**: Prominent display with map pin icon
- **Rating & Reviews**: Star rating with review count in highlighted box
- **Description**: Detailed information about the turf
- **Sports Available**: Badges showing sports that can be played (Football, Cricket, Badminton, Tennis)
- **Quick Info Grid**: Shows Open Hours, Size, and Surface type with icons

### 4. Facilities & Amenities Section
- **Icon Mapping**: Dynamic facility icons based on facility names
- **Supported Icons**:
  - WiFi / Free WiFi
  - Parking / Free Parking
  - Cafeteria / Coffee
  - Showers
- **Extensible**: Easy to add more facility types in the `facilityIconsMap` object
- **Responsive Grid**: 2 columns on mobile, 4 columns on desktop

### 5. Date Selection
- **Next 7 Days**: Calendar showing available dates for booking
- **Active State**: Highlighted primary-colored button for selected date
- **Smooth Scrolling**: Horizontal scroll for better mobile experience
- **Real-time Updates**: Selection updates immediately without page reload

### 6. Time Slots Display
- **Slot Availability**: Shows booked vs available slots with visual differentiation
- **Price Display**: Each slot shows the hourly price
- **Multi-Select**: Players can select multiple slots for extended play
- **Visual Feedback**: 
  - Available: Secondary background with hover effect
  - Selected: Gradient primary background with glow effect
  - Booked: Greyed out with strikethrough text
- **Selection Indicator**: Checkmark icon appears on selected slots
- **Empty State**: Message shown if no slots available for selected date

### 7. Booking Sidebar (Sticky)
- **Price Display**: Shows starting price per hour with currency symbol
- **Selection Summary**: Displays:
  - Selected date (formatted as "Monday, January 15")
  - Number of slots selected
  - Total amount calculation
- **Proceed to Pay Button**: 
  - Disabled until slots are selected
  - Shows loading state while processing payment
  - Changes text based on state ("Select a Time Slot", "Proceed to Pay", "Processing...")
- **Contact Options**:
  - Call Owner: Initiates phone call to turf owner
  - Chat with Owner: Opens chat interface for direct messaging
- **Trust Badges**: Shows security features (Instant Confirmation, Free Cancellation, Secure Payment)

### 8. Payment Integration (Razorpay)

#### Flow:
1. User selects slots and clicks "Proceed to Pay"
2. Request sent to backend to create booking and generate Razorpay order
3. Razorpay script dynamically loaded if not already present
4. Razorpay checkout modal opens with:
   - Amount (calculated from selected slots)
   - Order ID (from backend)
   - Prefilled customer information
   - Custom color theme (blue)
5. User completes payment on Razorpay modal
6. Success callback triggers payment verification
7. Backend verifies Razorpay signature for security
8. Booking confirmed and user navigated to player dashboard
9. Error handling for failed payments with user-friendly messages

#### API Endpoints Used:
- `POST /bookings/create-and-order` - Creates booking and Razorpay order
- `POST /payments/verify` - Verifies payment and confirms booking

#### Key Implementation Details:
```typescript
// Razorpay options structure
{
  key: API_KEY,
  amount: AMOUNT_IN_PAISE,
  currency: "INR",
  name: "Book My Turf",
  description: "Turf Booking",
  order_id: RAZORPAY_ORDER_ID,
  handler: CALLBACK_FUNCTION,
  prefill: {
    name: "Player",
    email: "player@example.com",
    contact: "9999999999"
  },
  theme: {
    color: "#2563eb"
  }
}
```

### 9. Authentication & Authorization
- **Role-based Access**: Only players can book slots
- **Login Check**: Chat functionality requires user login
- **Token Storage**: Uses localStorage for auth tokens
- **Error Messaging**: Clear feedback for unauthorized access

### 10. Toast Notifications
- **Auto-dismiss**: Notifications disappear after 4 seconds
- **Color-coded**: 
  - Green for success
  - Red for errors
  - Default (slate) for info
- **Fixed Position**: Appears at top-right for visibility
- **Smooth Animation**: Slide-down animation on appearance

### 11. Loading & Error States
- **Loading Spinner**: Animated loading indicator while fetching data
- **Not Found Page**: User-friendly message if turf doesn't exist
- **Error Handling**: Toast notifications for API failures

## Data Structure

### Turf Object
```typescript
type Turf = {
  id: number;
  name: string;
  location: string;
  description: string;
  images?: string | string[];        // Can be array or comma-separated string
  facilities?: string | string[];    // Can be array or comma-separated string
  price_per_slot: number;
  owner_phone?: string;
  owner_id: string;
  rating?: number;                    // Defaults to 4.8 if not provided
  reviews?: number;                   // Defaults to 245 if not provided
  sports?: string[];                  // Defaults to ["Football", "Cricket", "Badminton"]
  open_hours?: string;                // Defaults to "6:00 AM - 11:00 PM"
  size?: string;                      // Defaults to "100 x 60 m"
  surface?: string;                   // Defaults to "Artificial Turf"
};
```

### Slot Object
```typescript
type Slot = {
  id: number;
  is_available?: boolean;             // For newer schema
  is_booked?: boolean;                // For legacy schema
  start_time: string;                 // Format: "HH:MM:SS"
  end_time: string;                   // Format: "HH:MM:SS"
  price: number;                      // Price in rupees
};
```

## Service Integration

### Services Used:
1. **turfService.ts**
   - `getTurfDetails(id)` - Fetches detailed turf information

2. **slotService.ts**
   - `getSlotsByTurf(id)` - Fetches available slots for a turf

3. **bookingService.ts**
   - `createBooking(slotIds)` - Creates booking and generates Razorpay order
   - `verifyPayment(data)` - Verifies payment signature with backend

### API Base URL:
All API calls use `/api` as base URL (configured in api.ts)

## Responsive Design

### Breakpoints:
- **Mobile (< 768px)**:
  - Single column layout
  - Image gallery: 50vh height
  - Time slots: 3 columns
  - Facilities: 2 columns

- **Tablet (768px - 1024px)**:
  - Image gallery: 60vh height
  - Time slots: 4 columns
  - Facilities: 4 columns

- **Desktop (> 1024px)**:
  - Two-column layout (2/3 content, 1/3 sidebar)
  - Sticky sidebar
  - Time slots: 6 columns
  - 8px gap spacing

## Styling & Colors

### Color Usage:
- **Primary**: Interactive elements, selected states, highlights
- **Secondary**: Non-selected buttons, backgrounds
- **Destructive**: Error states, delete actions
- **Foreground**: Text content
- **Muted Foreground**: Secondary text, labels
- **Background**: Page background
- **Card**: Card backgrounds
- **Border**: Border colors
- **Glass Effect**: Semi-transparent frosted glass look

### Key Classes Used:
- `gradient-primary` - Primary gradient background
- `gradient-card` - Card gradient background
- `glass-effect` - Frosted glass effect
- `shadow-glow` - Glowing shadow effect
- `shadow-elevated` - Elevated shadow
- `animate-slide-down` - Slide down animation

## Component Dependencies

### UI Components Used:
- `Card` (with variants: glass, default, featured)
- `CardContent`, `CardHeader`, `CardTitle`
- `Badge` (with variants: featured, secondary)
- `Button` (with variants: hero, outline, ghost, default)

### Icons Used (lucide-react):
- MapPin, Star, Clock, Users, CheckCircle2
- Wifi, Car, Coffee, ShowerHead
- Heart, Share2, Phone, MessageCircle
- ChevronLeft, ChevronRight

## Customization Guide

### Adding New Facilities:
```typescript
// In facilityIconsMap object:
const facilityIconsMap: { [key: string]: any } = {
  "new-facility": YourIconComponent,
  // ... other facilities
};
```

### Changing Colors:
- Update the `color` in Razorpay options (line 227)
- Modify tailwind theme in tailwind.config.ts
- Update CSS variables in globals.css

### Adjusting Responsive Behavior:
- Modify grid breakpoints (e.g., `md:grid-cols-4`)
- Adjust spacing with `gap-*` classes
- Change heights with `h-*` classes

## Testing Checklist

- [ ] Image gallery navigation works smoothly
- [ ] Date selection updates slots correctly
- [ ] Multiple slots can be selected/deselected
- [ ] Total amount calculates correctly
- [ ] "Proceed to Pay" button is disabled until slots selected
- [ ] Razorpay modal opens on button click
- [ ] Test payment with Razorpay test credentials
- [ ] Payment success redirects to dashboard
- [ ] Payment failure shows appropriate error message
- [ ] Call button initiates phone call
- [ ] Chat button opens messaging interface
- [ ] Loading and error states display correctly
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Toast notifications appear and auto-dismiss
- [ ] Non-players see access denied message
- [ ] Images load from various formats (array/string)

## Backend Requirements

### Ensure these endpoints exist:
1. `GET /api/turfs/:id` - Returns turf details with all fields
2. `GET /api/slots/:turfId` - Returns slot list for turf
3. `POST /api/bookings/create-and-order` - Creates booking and Razorpay order
4. `POST /api/payments/verify` - Verifies Razorpay signature

### Backend should return:
```json
// GET /api/turfs/:id
{
  "data": {
    "id": 1,
    "name": "Green Arena",
    "location": "123 Sports Lane",
    "description": "...",
    "images": "url1,url2,url3",
    "facilities": "WiFi,Parking,Cafeteria",
    "price_per_slot": 1200,
    "owner_phone": "+919876543210",
    "owner_id": "owner_123",
    "rating": 4.8,
    "reviews": 245,
    "sports": ["Football", "Cricket"],
    "open_hours": "6:00 AM - 11:00 PM",
    "size": "100 x 60 m",
    "surface": "Artificial Turf"
  }
}

// POST /api/bookings/create-and-order
{
  "data": {
    "key_id": "razorpay_api_key",
    "order": {
      "id": "order_xxxxx",
      "amount": 2400,
      "currency": "INR"
    },
    "booking_ids": [1, 2]
  }
}
```

## Security Notes

- ✅ Razorpay signature verification on backend (must not be skipped)
- ✅ API tokens stored in localStorage and sent in Authorization header
- ✅ Role-based access control enforced
- ✅ Payment amount verified on backend before processing
- ⚠️ Ensure HTTPS in production
- ⚠️ Never expose Razorpay secret key in frontend code

## Future Enhancements

1. **Wishlist**: Implement like/favorite functionality
2. **Social Sharing**: Connect Share button to share APIs
3. **Reviews**: Add turf review and rating system
4. **Filter**: Add filters for facilities and sports
5. **Comparison**: Compare multiple turfs side-by-side
6. **Real-time Availability**: WebSocket integration for live slot updates
7. **Cancellation**: Allow cancellation of confirmed bookings
8. **Refunds**: Handle refund processing
9. **Notifications**: Email/SMS confirmation
10. **Analytics**: Track popular turfs and slots

## Troubleshooting

### Razorpay modal not opening:
- Check if Razorpay API key is correct in backend
- Verify script loaded successfully (check console)
- Ensure order is created in backend

### Slots not showing:
- Verify slots exist in database
- Check slot data structure matches expected format
- Ensure start_time/end_time are in correct format (HH:MM:SS)

### Payment verification failed:
- Verify signature validation in backend
- Check if booking_id is correctly passed
- Ensure payment data matches order details

### Images not loading:
- Verify image URLs are accessible
- Check if images are sent as array or comma-separated string
- Ensure proper image format (JPEG, PNG, WebP)

### Styling issues:
- Ensure tailwindcss is configured correctly
- Check for CSS conflicts with global styles
- Verify all color variables are defined in theme
