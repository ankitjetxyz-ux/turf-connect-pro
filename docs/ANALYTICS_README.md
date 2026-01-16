# 📊 Analytics System - Quick Reference

> **Production-grade real-data analytics for turf owners**  
> Track revenue, bookings, occupancy, ratings, and trends in real-time

---

## 🎯 What This System Does

Provides turf owners with comprehensive business insights:
- 💰 **Revenue tracking** with period-over-period comparison
- 📅 **Booking analytics** showing daily trends
- 📊 **Occupancy rates** to optimize availability
- ⭐ **Rating metrics** to monitor customer satisfaction
- ⏰ **Peak hours** analysis for staffing decisions
- 📈 **Revenue by day of week** to identify best days

All data comes directly from your Supabase database - **zero mock data**.

---

##  Quick Start (5 Minutes)

### 1. Add to Your Dashboard

```typescript
import TurfAnalyticsEnhanced from '@/components/analytics/TurfAnalyticsEnhanced';

function ClientDashboard() {
  return (
    <TurfAnalyticsEnhanced 
      turfId={selectedTurf.id} 
      turfName={selectedTurf.name} 
    />
  );
}
```

### 2. Optimize Database

Run this in Supabase SQL Editor:

```sql
CREATE INDEX IF NOT EXISTS idx_bookings_turf_status_date
ON bookings(turf_id, status, created_at);
```

### 3. Done! 🎉

Your analytics dashboard is now live with real data.

---

## 📁 Project Structure

```
turf-connect-pro/
├── backend/
│   ├── controllers/
│   │   └── analyticsController.js    ← Backend logic
│   └── routes/
│       └── analyticsRoutes.js          ← API endpoints
│
├── frontend/src/
│   ├── types/
│   │   └── index.ts                    ← TypeScript types
│   ├── services/
│   │   └── analyticsService.ts         ← API service
│   ├── hooks/
│   │   └── useTurfAnalytics.ts         ← React hook
│   └── components/analytics/
│       ├── TurfAnalytics.tsx           ← Original component
│       └── TurfAnalyticsEnhanced.tsx   ← New enhanced component
│
└── docs/
    ├── ANALYTICS_IMPLEMENTATION_SUMMARY.md  ← Overview
    ├── ANALYTICS_SYSTEM_GUIDE.md            ← Detailed guide
    ├── ANALYTICS_ARCHITECTURE.md            ← System architecture
    ├── analytics_database_optimization.sql  ← Performance SQL
    └── ANALYTICS_README.md                  ← This file
```

---

## 🔌 API Endpoints

### **Consolidated Endpoint (Recommended)**
```
GET /api/analytics/all?turf_id=X&period=30days
```
Returns all analytics data in one optimized request.

**Parameters:**
- `turf_id` (required) - Your turf ID
- `period` (optional) - `7days`, `30days`, `90days`, `1year` (default: `30days`)

**Headers:**
- `Authorization: Bearer <your-jwt-token>`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000,
    "revenueChange": 25,
    "totalBookings": 120,
    "bookingsChange": 15,
    "occupancyRate": 75,
    "avgRating": 4.5,
    "ratingChange": 0.3,
    "dailyBookings": [...],
    "peakHours": [...],
    "revenueByDayOfWeek": [...],
    "weeklyComparison": {...},
    "period": {...}
  }
}
```

---

## 💻 Code Examples

### Using the Hook

```typescript
import { useTurfAnalytics } from '@/hooks/useTurfAnalytics';
import { AnalyticsService } from '@/services/analyticsService';

function MyComponent() {
  const [dateRange, setDateRange] = useState(() => 
    AnalyticsService.getPresetDateRanges().last30Days
  );

  const { data, loading, error, refetch } = useTurfAnalytics({
    turfId: 'your-turf-id',
    dateRange,
    refreshInterval: 0,     // 0 = manual refresh only
    autoRefresh: true        // Fetch on mount
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return (
    <div>
      <h2>Revenue: ₹{data.totalRevenue.toLocaleString()}</h2>
      <p>Change: {data.revenueChange}%</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Date Range Presets

```typescript
import { AnalyticsService } from '@/services/analyticsService';

const presets = AnalyticsService.getPresetDateRanges();

// Available presets:
presets.today          // Today
presets.last7Days      // Last 7 days
presets.last30Days     // Last 30 days
presets.last90Days     // Last 90 days
presets.thisMonth      // Current month
presets.lastMonth      // Previous month
```

### Manual API Call

```typescript
import { AnalyticsService } from '@/services/analyticsService';

async function fetchAnalytics() {
  const data = await AnalyticsService.fetchTurfAnalytics(
    'turf-123',
    {
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31')
    }
  );
  console.log('Revenue:', data.totalRevenue);
}
```

---

## 🔧 Configuration

### Auto-Refresh (Optional)

Enable polling to auto-refresh data:

```typescript
const { data } = useTurfAnalytics({
  turfId,
  dateRange,
  refreshInterval: 30000  // Refresh every 30 seconds
});
```

⚠️ **Caution:** Polling increases server load. Use sparingly or implement Supabase Realtime instead.

### Date Validation

The service automatically validates:
- ✅ Start date before end date
- ✅ Valid JavaScript dates
- ✅ End date not in the future
- ❌ Invalid ranges throw errors

```typescript
AnalyticsService.validateDateRange(dateRange); // Returns boolean
```

---

## 📊 Metrics Explained

### Revenue
**Formula:** `SUM(bookings.total_price)`  
**Filter:** Status IN (`confirmed`, `paid`, `completed`)  
**Period:** Selected date range

### Bookings
**Formula:** `COUNT(*)`  
**Filter:** Status IN (`confirmed`, `paid`, `completed`)  
**Period:** Selected date range

### Occupancy Rate
**Formula:** `(Booked Slots / Total Slots) × 100`  
**Booked Slots:** Count of bookings  
**Total Slots:** Count of slots in date range  

### Average Rating
**Formula:** `AVG(reviews.rating)`  
**Scale:** 0-5  
**Period:** Selected date range

### Period Comparison
- **Current Period:** Selected date range
- **Previous Period:** Equal duration before current period
- **Change %:** `((Current - Previous) / Previous) × 100`

**Example:**
- Selected: Jan 1-30 (30 days)
- Previous: Dec 2-31 (30 days before)

---

## ✅ Testing Your Implementation

### 1. Verify Backend

```bash
# Start backend
cd backend
npm start

# Test API endpoint
curl "http://localhost:5000/api/analytics/all?turf_id=YOUR_ID&period=30days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Check Database Data

```sql
-- Run in Supabase SQL Editor
SELECT 
  COUNT(*) as bookings,
  SUM(total_price) as revenue
FROM bookings
WHERE turf_id = 'YOUR_TURF_ID'
  AND status IN ('confirmed', 'paid', 'completed')
  AND created_at >= NOW() - INTERVAL '30 days';
```

Compare results with dashboard.

### 3. Test Frontend

- ✅ Dashboard loads without errors
- ✅ Metrics match database query
- ✅ Charts display data
- ✅ Date range selector works
- ✅ Refresh button updates data
- ✅ Loading state shows correctly
- ✅ Empty state handles zero bookings

---

## 🐛 Common Issues

### "Failed to fetch analytics"

**Causes:**
1. Backend not running
2. Wrong API URL
3. Invalid/expired auth token
4. User doesn't own the turf

**Fix:**
```typescript
// Check environment variables
// frontend/.env
VITE_API_URL=http://localhost:5000

// Verify token in localStorage
console.log(localStorage.getItem('token'));

// Check user role
console.log(localStorage.getItem('role')); // Should be 'client'
```

### Data doesn't match database

**Causes:**
1. Wrong booking statuses
2. Incorrect date range
3. Timezone issues

**Fix:**
```sql
-- Check booking statuses
SELECT status, COUNT(*) 
FROM bookings 
WHERE turf_id = 'YOUR_ID'
GROUP BY status;

-- Ensure you have confirmed/paid/completed bookings
```

### Charts show "No data available"

**Causes:**
1. No bookings in selected period
2. All bookings have wrong status
3. Date range too narrow

**Fix:**
- Expand date range (try "Last 90 Days")
- Verify bookings exist with valid status
- Check filters in your queries

---

## 📈 Performance Tips

### Essential Optimizations

1. **Create Database Indexes** (CRITICAL)
   ```sql
   -- Run this for 10-100x speedup:
   CREATE INDEX IF NOT EXISTS idx_bookings_turf_status_date
   ON bookings(turf_id, status, created_at);
   ```

2. **Use Consolidated Endpoint**
   - Prefer `/api/analytics/all` over 5 separate requests
   - Already implemented in `analyticsService.ts`

3. **Avoid Aggressive Polling**
   - Don't set `refreshInterval` below 30 seconds
   - Consider Supabase Realtime instead

### Advanced Optimizations

```sql
-- Optional: Materialized views for high-traffic apps
-- See docs/analytics_database_optimization.sql
```

---

## 🎨 UI Components

### Metric Cards
Display key metrics with trend indicators:
- Revenue (green)
- Bookings (blue)
- Occupancy (purple)
- Rating (yellow)

### Charts
- **Line Chart:** Daily bookings trend
- **Bar Chart:** Revenue by day of week
- **Progress Bars:** Peak booking hours
- **Stats Panel:** Weekly comparison

### States
- **Loading:** Spinner + "Loading analytics..."
- **Error:** Error icon + message + Retry button
- **Empty:** "No bookings" + Date range suggestions
- **Success:** Full dashboard with real data

---

## 🔐 Security

### Authentication Required
All analytics endpoints require:
- Valid JWT token in `Authorization` header
- User role: `client` (turf owner)
- Turf ownership verification

### Data Access Rules
- Users can only view analytics for their own turfs
- Backend verifies: `turf.owner_id === req.user.id`
- Unauthorized requests return 403 Forbidden

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `ANALYTICS_README.md` | This quick reference |
| `ANALYTICS_IMPLEMENTATION_SUMMARY.md` | Implementation overview |
| `ANALYTICS_SYSTEM_GUIDE.md` | Detailed step-by-step guide |
| `ANALYTICS_ARCHITECTURE.md` | System architecture diagrams |
| `analytics_database_optimization.sql` | Database performance SQL |

---

## 🚀 Next Steps

### Immediate
1. ✅ Integrate enhanced component
2. ✅ Create database indexes
3. ✅ Test with real data
4. ✅ Deploy to production

### Future Enhancements
1. **Supabase Realtime** - Instant updates without polling
2. **Export Reports** - Download analytics as PDF/CSV
3. **Custom Date Ranges** - User-defined start/end dates
4. **Email Reports** - Weekly/monthly summaries
5. **Forecasting** - Predict future trends
6. **Competitor Analysis** - Compare with similar turfs

---

## 💡 Best Practices

### Date Ranges
- Default to **Last 30 Days** for meaningful insights
- Avoid ranges > 1 year (performance)
- Show current selection clearly to user

### Error Handling
- Always provide a retry option
- Show user-friendly error messages
- Log errors for debugging

### Performance
- Create database indexes before production
- Monitor query execution times
- Use consolidated endpoint
- Cache when appropriate

### UX
- Show loading states during fetch
- Provide empty states with guidance
- Update in realtime when possible
- Keep data fresh (but don't over-poll)

---

## 🎯 Success Checklist

Your analytics system is production-ready when:

- [x] Backend `/analytics/all` endpoint returns data
- [x] Frontend component displays metrics
- [x] Period comparison shows correct percentages  
- [x] Date range selection updates data
- [x] Loading/error/empty states work
- [x] Database indexes created
- [x] All charts populated with real data
- [x] Tested with 100+ bookings
- [x] Monitoring enabled

---

## 📞 Need Help?

1. **Check the docs:** Start with `ANALYTICS_SYSTEM_GUIDE.md`
2. **Review examples:** See `TurfAnalyticsEnhanced.tsx`
3. **Debug:** Check browser console & Network tab
4. **Verify data:** Run SQL queries in Supabase

---

## 📊 System Status

✅ **Backend:** Production-ready  
✅ **Frontend:** Production-ready  
✅ **Types:** Fully typed with TypeScript  
✅ **Tests:** Manual testing checklist provided  
✅ **Docs:** Comprehensive documentation  
✅ **Performance:** Optimized with indexes  
✅ **Security:** Multi-layer auth/authz  

**Ready to deploy! 🚀**

---

**Happy Analyzing!** 📈  
*Built with ❤️ for data-driven turf owners*
