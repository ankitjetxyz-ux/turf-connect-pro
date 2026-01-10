const supabase = require("../config/db");

/* ============================================================================
   ANALYTICS CONTROLLER - Turf Owner Analytics
   ============================================================================ */

/**
 * Calculate percentage change between two values
 */
const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
};

/**
 * Get date range based on period
 */
const getDateRange = (period) => {
    const daysMap = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
        '1year': 365
    };
    const days = daysMap[period] || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days
    };
};

/**
 * Get Dashboard Summary
 */
exports.getDashboardSummary = async (req, res) => {
    try {
        const { turf_id, period = '30days' } = req.query;

        // Verify ownership
        const { data: turf, error: turfError } = await supabase
            .from('turfs')
            .select('id, owner_id, name')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .single();

        if (turfError || !turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized or turf not found'
            });
        }

        const { startDate, endDate, days } = getDateRange(period);

        // Get current period bookings
        const { data: currentBookings } = await supabase
            .from('bookings')
            .select('total_price, created_at')
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Get previous period for comparison
        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);

        const { data: previousBookings } = await supabase
            .from('bookings')
            .select('total_price')
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', prevStartDate.toISOString().split('T')[0])
            .lte('created_at', prevEndDate.toISOString().split('T')[0]);

        // Calculate current metrics
        const totalBookings = currentBookings?.length || 0;
        const totalRevenue = currentBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

        const prevTotalBookings = previousBookings?.length || 0;
        const prevTotalRevenue = previousBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

        // Get slots for occupancy rate
        const { count: totalSlots } = await supabase
            .from('slots')
            .select('*', { count: 'exact', head: true })
            .eq('turf_id', turf_id)
            .gte('date', startDate)
            .lte('date', endDate);

        const occupancyRate = totalSlots > 0
            ? Math.round((totalBookings / totalSlots) * 100)
            : 0;

        // Get reviews for rating
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('turf_id', turf_id)
            .gte('created_at', startDate);

        const averageRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
            : 0;

        const { data: prevReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('turf_id', turf_id)
            .gte('created_at', prevStartDate.toISOString().split('T')[0])
            .lte('created_at', prevEndDate.toISOString().split('T')[0]);

        const prevAverageRating = prevReviews && prevReviews.length > 0
            ? prevReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / prevReviews.length
            : 0;

        // Calculate changes
        const revenueChange = calculatePercentageChange(totalRevenue, prevTotalRevenue);
        const bookingsChange = calculatePercentageChange(totalBookings, prevTotalBookings);
        const ratingChange = (averageRating - prevAverageRating).toFixed(1);

        res.json({
            success: true,
            data: {
                totalRevenue: Math.round(totalRevenue),
                revenueChange,
                totalBookings,
                bookingsChange,
                occupancyRate,
                occupancyChange: 0, // Can calculate if you track historical occupancy
                averageRating: parseFloat(averageRating.toFixed(1)),
                ratingChange: parseFloat(ratingChange),
                periodStart: startDate,
                periodEnd: endDate,
                turfName: turf.name
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get Daily Bookings
 */
exports.getDailyBookings = async (req, res) => {
    try {
        const { turf_id, days = 7 } = req.query;

        // Verify ownership
        const { data: turf } = await supabase
            .from('turfs')
            .select('id')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .single();

        if (!turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const { data: bookings } = await supabase
            .from('bookings')
            .select('created_at, total_price')
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', startDate.toISOString().split('T')[0])
            .lte('created_at', endDate.toISOString().split('T')[0])
            .order('created_at', { ascending: true });

        // Group by date
        const dailyMap = {};
        bookings?.forEach(booking => {
            const date = booking.created_at.split('T')[0];
            if (!dailyMap[date]) {
                dailyMap[date] = { date, bookings: 0, revenue: 0 };
            }
            dailyMap[date].bookings++;
            dailyMap[date].revenue += booking.total_price || 0;
        });

        const dailyData = Object.values(dailyMap);

        res.json({
            success: true,
            data: dailyData
        });

    } catch (error) {
        console.error('Error fetching daily bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get Peak Hours
 */
exports.getPeakHours = async (req, res) => {
    try {
        const { turf_id, period = '30days' } = req.query;

        const { data: turf } = await supabase
            .from('turfs')
            .select('id')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .single();

        if (!turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { startDate } = getDateRange(period);

        // Get all bookings with slot details
        const { data: bookings } = await supabase
            .from('bookings')
            .select(`
        id,
        slot_id,
        slots (
          start_time
        )
      `)
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', startDate);

        // Group by hour
        const hourlyMap = {};
        bookings?.forEach(booking => {
            if (booking.slots && booking.slots.start_time) {
                const hour = parseInt(booking.slots.start_time.split(':')[0]);
                const hourLabel = `${hour}:00 - ${hour + 1}:00`;
                if (!hourlyMap[hourLabel]) {
                    hourlyMap[hourLabel] = { hour: hourLabel, count: 0 };
                }
                hourlyMap[hourLabel].count++;
            }
        });

        const totalBookings = bookings?.length || 1;
        const peakHours = Object.values(hourlyMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map(h => ({
                hour: h.hour,
                bookingCount: h.count,
                percentage: Math.round((h.count / totalBookings) * 100)
            }));

        res.json({
            success: true,
            data: {
                peakHours,
                totalBookings
            }
        });

    } catch (error) {
        console.error('Error fetching peak hours:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get Revenue by Day of Week
 */
exports.getRevenueByDay = async (req, res) => {
    try {
        const { turf_id, period = '30days' } = req.query;

        const { data: turf } = await supabase
            .from('turfs')
            .select('id')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .single();

        if (!turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { startDate } = getDateRange(period);

        const { data: bookings } = await supabase
            .from('bookings')
            .select('created_at, total_price')
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', startDate);

        // Group by day of week
        const dayMap = {
            'Sun': { day: 'Sun', revenue: 0, bookings: 0 },
            'Mon': { day: 'Mon', revenue: 0, bookings: 0 },
            'Tue': { day: 'Tue', revenue: 0, bookings: 0 },
            'Wed': { day: 'Wed', revenue: 0, bookings: 0 },
            'Thu': { day: 'Thu', revenue: 0, bookings: 0 },
            'Fri': { day: 'Fri', revenue: 0, bookings: 0 },
            'Sat': { day: 'Sat', revenue: 0, bookings: 0 }
        };

        bookings?.forEach(booking => {
            const date = new Date(booking.created_at);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            dayMap[dayName].revenue += booking.total_price || 0;
            dayMap[dayName].bookings++;
        });

        const dayData = Object.values(dayMap);
        const peakDay = dayData.reduce((max, day) =>
            day.revenue > max.revenue ? day : max,
            dayData[0]
        );

        res.json({
            success: true,
            data: dayData,
            peakDay
        });

    } catch (error) {
        console.error('Error fetching revenue by day:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * Get Weekly Comparison
 */
exports.getWeeklyComparison = async (req, res) => {
    try {
        const { turf_id } = req.query;

        const { data: turf } = await supabase
            .from('turfs')
            .select('id')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .single();

        if (!turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Current week (last 7 days)
        const currentWeekEnd = new Date();
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);

        // Previous week (7-14 days ago)
        const prevWeekEnd = new Date(currentWeekStart);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
        const prevWeekStart = new Date(prevWeekEnd);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);

        const { data: currentBookings } = await supabase
            .from('bookings')
            .select('total_price')
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', currentWeekStart.toISOString().split('T')[0])
            .lte('created_at', currentWeekEnd.toISOString().split('T')[0]);

        const { data: prevBookings } = await supabase
            .from('bookings')
            .select('total_price')
            .eq('turf_id', turf_id)
            .in('status', ['confirmed', 'completed', 'paid'])
            .gte('created_at', prevWeekStart.toISOString().split('T')[0])
            .lte('created_at', prevWeekEnd.toISOString().split('T')[0]);

        const currentWeek = {
            bookings: currentBookings?.length || 0,
            revenue: currentBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0,
            avgPerDay: (currentBookings?.length || 0) / 7
        };

        const previousWeek = {
            bookings: prevBookings?.length || 0,
            revenue: prevBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0,
            avgPerDay: (prevBookings?.length || 0) / 7
        };

        const changes = {
            bookings: calculatePercentageChange(currentWeek.bookings, previousWeek.bookings),
            revenue: calculatePercentageChange(currentWeek.revenue, previousWeek.revenue),
            avgPerDay: calculatePercentageChange(currentWeek.avgPerDay, previousWeek.avgPerDay)
        };

        res.json({
            success: true,
            data: {
                currentWeek: {
                    ...currentWeek,
                    avgPerDay: currentWeek.avgPerDay.toFixed(1)
                },
                previousWeek: {
                    ...previousWeek,
                    avgPerDay: previousWeek.avgPerDay.toFixed(1)
                },
                changes,
                dates: {
                    currentStart: currentWeekStart.toISOString().split('T')[0],
                    currentEnd: currentWeekEnd.toISOString().split('T')[0],
                    prevStart: prevWeekStart.toISOString().split('T')[0],
                    prevEnd: prevWeekEnd.toISOString().split('T')[0]
                }
            }
        });

    } catch (error) {
        console.error('Error fetching weekly comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = exports;
