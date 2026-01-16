export interface Turf {
  id: number;
  name: string;
  location: string;
  description: string;
  images?: string | string[];
  facilities?: string | string[];
  price_per_slot: number;
  owner_phone?: string;
  owner_id: string;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  sports?: string | string[];
  open_hours?: string;
  size?: string;
  surface?: string;
  tournaments_hosted?: number;
  matches_played?: number;
  is_popular?: boolean;
  latitude?: number;
  longitude?: number;
  google_maps_link?: string;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'draft';
  rejection_reason?: string;
}

export interface Slot {
  id: number;
  date?: string;
  is_available?: boolean;
  is_booked?: boolean;
  start_time: string;
  end_time: string;
  price: number;
  turf_id?: string;
  created_at?: string;
}

export interface Booking {
  id: number | string;
  turf_name?: string;
  player_name?: string;
  player_id?: string;
  slot_time?: string;
  status?: string;
  location?: string;
  turf_owner_name?: string;
  turf_owner_email?: string;
  verification_code?: string;
  verification_expires_at?: string;
}

export interface Conversation {
  id: string;
  owner_id: string;
  player_id: string;
  last_message?: string;
  updated_at?: string;
  is_favorite?: boolean;
  other_user?: {
    name: string;
    email: string;
    profile_image_url?: string | null;
  };
}

export interface Tournament {
  id: string;
  name: string;
  start_date: string;
  status: string;
  sport?: string;
  end_date?: string;
  entry_fee?: string;
  max_teams?: string;
  turf_id?: string;
  description?: string;
  image?: string;
  participant_id?: string;
  team_name?: string;
  verification_code?: string;
  verification_expires_at?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  profile_image_url?: string | null;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking_id: number | string;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface DailyBooking {
  date: string; // ISO date string
  count: number;
  revenue: number;
}

export interface PeakHour {
  hour: number; // 0-23
  bookings: number;
}

export interface RevenueByDay {
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  revenue: number;
}

export interface WeeklyComparison {
  currentWeek: {
    bookings: number;
    revenue: number;
  };
  previousWeek: {
    bookings: number;
    revenue: number;
  };
}

export interface AnalyticsData {
  // Core metrics
  totalRevenue: number;
  revenueChange: number; // Percentage: +25, -10, etc.
  totalBookings: number;
  bookingsChange: number; // Percentage
  occupancyRate: number; // Percentage: 0-100
  avgRating: number; // 0-5
  ratingChange: number; // Absolute change: +0.5, -0.2

  // Trend data
  dailyBookings: DailyBooking[];
  peakHours: PeakHour[];
  revenueByDayOfWeek: RevenueByDay[];
  weeklyComparison: WeeklyComparison;

  // Metadata
  period: {
    start: string;
    end: string;
  };
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  error?: string;
}
