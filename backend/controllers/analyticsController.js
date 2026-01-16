const supabase = require("../config/db");

/* ============================================================================
   FIXED ANALYTICS CONTROLLER - Turf Owner Analytics
   ============================================================================ */

/**
 * Calculate percentage change between two values
 */
const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
        if (current > 0) return 999;
        return 0;
    }
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

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let start = new Date(today);
    let end = new Date(tomorrow);

    if (period === '1year') {
        end.setDate(end.getDate() + 365);
        start.setDate(start.getDate() - 365);
    } else {
        start.setDate(start.getDate() - days);
    }

    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        days
    };
};

/**
 * Get All Analytics (FIXED - Consolidated Endpoint)
 * ✅ Returns data in format that matches frontend expectations
 */
exports.getAllAnalytics = async (req, res) => {
    try {
        const { turf_id, period = '30days' } = req.query;

        // Verify ownership
        const { data: turf, error: turfError } = await supabase
            .from('turfs')
            .select('id, owner_id, name')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .eq('deleted_at', null) // ✅ FIX: Exclude deleted turfs
            .single();

        if (turfError || !turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized or turf not found'
            });
        }

        const { startDate, endDate, days } = getDateRange(period);

        // ✅ Execute all queries in parallel
        const [
            currentBookings,
            currentTournamentBookings,
            previousBookings,
            previousTournamentBookings,
            totalSlots,
            reviews,
            prevReviews,
            bookingsForTrends
        ] = await Promise.all([
            // Current period bookings
            supabase
                .from('bookings')
                .select('total_amount, created_at')
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'pending', 'success'])
                .gte('created_at', startDate)
                .lte('created_at', endDate),

            // Current period tournament bookings
            supabase
                .from('tournament_participants')
                .select(`
                    id,
                    created_at,
                    tournaments!inner(entry_fee, turf_id)
                `)
                .eq('tournaments.turf_id', turf_id)
                .in('payment_status', ['paid', 'completed', 'success'])
                .gte('created_at', startDate)
                .lte('created_at', endDate),

            // Previous period bookings
            (() => {
                const prevEndDate = new Date(startDate);
                prevEndDate.setDate(prevEndDate.getDate() - 1);
                const prevStartDate = new Date(prevEndDate);
                prevStartDate.setDate(prevStartDate.getDate() - days);

                return supabase
                    .from('bookings')
                    .select('total_amount')
                    .eq('turf_id', turf_id)
                    .in('status', ['confirmed', 'completed', 'paid', 'pending', 'success'])
                    .gte('created_at', prevStartDate.toISOString().split('T')[0])
                    .lte('created_at', prevEndDate.toISOString().split('T')[0]);
            })(),

            // Previous period tournament bookings
            (() => {
                const prevEndDate = new Date(startDate);
                prevEndDate.setDate(prevEndDate.getDate() - 1);
                const prevStartDate = new Date(prevEndDate);
                prevStartDate.setDate(prevStartDate.getDate() - days);

                return supabase
                    .from('tournament_participants')
                    .select(`
                        id,
                        created_at,
                        tournaments!inner(entry_fee, turf_id)
                    `)
                    .eq('tournaments.turf_id', turf_id)
                    .in('payment_status', ['paid', 'completed', 'success'])
                    .gte('created_at', prevStartDate.toISOString().split('T')[0])
                    .lte('created_at', prevEndDate.toISOString().split('T')[0]);
            })(),

            // Total slots for occupancy
            supabase
                .from('slots')
                .select('*', { count: 'exact', head: true })
                .eq('turf_id', turf_id)
                .gte('date', startDate)
                .lte('date', endDate),

            // Current period reviews
            supabase
                .from('reviews')
                .select('rating')
                .eq('turf_id', turf_id)
                .gte('created_at', startDate),

            // Previous period reviews
            (() => {
                const prevEndDate = new Date(startDate);
                prevEndDate.setDate(prevEndDate.getDate() - 1);
                const prevStartDate = new Date(prevEndDate);
                prevStartDate.setDate(prevStartDate.getDate() - days);

                return supabase
                    .from('reviews')
                    .select('rating')
                    .eq('turf_id', turf_id)
                    .gte('created_at', prevStartDate.toISOString().split('T')[0])
                    .lte('created_at', prevEndDate.toISOString().split('T')[0]);
            })(),

            // Bookings with slot details for trends
            supabase
                .from('bookings')
                .select(`
                    id,
                    created_at,
                    total_amount,
                    slot_id,
                    slots (
                        start_time
                    )
                `)
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'pending', 'success'])
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: true })
        ]);

        // Calculate metrics
        const turfBookingsCount = currentBookings.data?.length || 0;
        const tournamentBookingsCount = currentTournamentBookings.data?.length || 0;
        const totalBookings = turfBookingsCount + tournamentBookingsCount;

        const turfRevenue = currentBookings.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        const tournamentRevenue = currentTournamentBookings.data?.reduce((sum, p) => {
            return sum + (p.tournaments?.entry_fee || 0);
        }, 0) || 0;
        const totalRevenue = turfRevenue + tournamentRevenue;

        const prevTurfBookingsCount = previousBookings.data?.length || 0;
        const prevTournamentBookingsCount = previousTournamentBookings.data?.length || 0;
        const prevTotalBookings = prevTurfBookingsCount + prevTournamentBookingsCount;

        const prevTurfRevenue = previousBookings.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        const prevTournamentRevenue = previousTournamentBookings.data?.reduce((sum, p) => {
            return sum + (p.tournaments?.entry_fee || 0);
        }, 0) || 0;
        const prevTotalRevenue = prevTurfRevenue + prevTournamentRevenue;

        const occupancyRate = (totalSlots?.count || 0) > 0
            ? Math.round((turfBookingsCount / (totalSlots.count || 1)) * 100)
            : 0;

        const averageRating = reviews.data && reviews.data.length > 0
            ? reviews.data.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.data.length
            : 0;

        const prevAverageRating = prevReviews.data && prevReviews.data.length > 0
            ? prevReviews.data.reduce((sum, r) => sum + (r.rating || 0), 0) / prevReviews.data.length
            : 0;

        const revenueChange = calculatePercentageChange(totalRevenue, prevTotalRevenue);
        const bookingsChange = calculatePercentageChange(totalBookings, prevTotalBookings);
        const ratingChange = (averageRating - prevAverageRating).toFixed(1);

        // ✅ FIX: Build daily bookings in correct format
        const dailyMap = {};

        bookingsForTrends.data?.forEach(booking => {
            const date = booking.created_at.split('T')[0];
            if (!dailyMap[date]) {
                dailyMap[date] = { date, bookings: 0, revenue: 0 };
            }
            dailyMap[date].bookings++;
            dailyMap[date].revenue += booking.total_amount || 0;
        });

        currentTournamentBookings.data?.forEach(participant => {
            const date = participant.created_at.split('T')[0];
            if (!dailyMap[date]) {
                dailyMap[date] = { date, bookings: 0, revenue: 0 };
            }
            dailyMap[date].bookings++;
            dailyMap[date].revenue += participant.tournaments?.entry_fee || 0;
        });

        const dailyBookings = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

        // ✅ FIX: Peak hours with correct format
        const hourlyMap = {};
        bookingsForTrends.data?.forEach(booking => {
            if (booking.slots && booking.slots.start_time) {
                const hour = parseInt(booking.slots.start_time.split(':')[0]);
                if (!hourlyMap[hour]) {
                    hourlyMap[hour] = { hour, bookings: 0 };
                }
                hourlyMap[hour].bookings++;
            }
        });
        const peakHours = Object.values(hourlyMap)
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

        // ✅ FIX: Revenue by day with correct key name
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayMap = dayNames.reduce((acc, day) => {
            acc[day] = { dayOfWeek: day, revenue: 0, bookings: 0 };
            return acc;
        }, {});

        bookingsForTrends.data?.forEach(booking => {
            const date = new Date(booking.created_at);
            const dayName = dayNames[date.getDay()];
            if (dayMap[dayName]) {
                dayMap[dayName].revenue += booking.total_amount || 0;
                dayMap[dayName].bookings++;
            }
        });

        currentTournamentBookings.data?.forEach(participant => {
            const date = new Date(participant.created_at);
            const dayName = dayNames[date.getDay()];
            if (dayMap[dayName]) {
                dayMap[dayName].revenue += participant.tournaments?.entry_fee || 0;
                dayMap[dayName].bookings++;
            }
        });

        const revenueByDayOfWeek = Object.values(dayMap);

        // Weekly comparison
        const now = new Date();
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);

        const prevWeekEnd = new Date(currentWeekStart);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
        const prevWeekStart = new Date(prevWeekEnd);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);

        const [currentWeekData, prevWeekData] = await Promise.all([
            supabase
                .from('bookings')
                .select('total_amount')
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'pending'])
                .gte('created_at', currentWeekStart.toISOString().split('T')[0])
                .lte('created_at', now.toISOString().split('T')[0]),

            supabase
                .from('bookings')
                .select('total_amount')
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'pending'])
                .gte('created_at', prevWeekStart.toISOString().split('T')[0])
                .lte('created_at', prevWeekEnd.toISOString().split('T')[0])
        ]);

        const weeklyComparison = {
            currentWeek: {
                bookings: currentWeekData.data?.length || 0,
                revenue: currentWeekData.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
            },
            previousWeek: {
                bookings: prevWeekData.data?.length || 0,
                revenue: prevWeekData.data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
            }
        };

        // ✅ Build response with correct field names
        res.json({
            success: true,
            data: {
                totalRevenue: Math.round(totalRevenue),
                revenueChange,
                totalBookings,
                bookingsChange,
                occupancyRate,
                avgRating: parseFloat(averageRating.toFixed(1)),
                ratingChange: parseFloat(ratingChange),
                dailyBookings,
                peakHours,
                revenueByDayOfWeek,
                weeklyComparison,
                period: {
                    start: startDate,
                    end: endDate
                },
                turfName: turf.name,
                breakdown: {
                    turfSlots: {
                        bookings: turfBookingsCount,
                        revenue: Math.round(turfRevenue)
                    },
                    tournaments: {
                        participants: tournamentBookingsCount,
                        revenue: Math.round(tournamentRevenue)
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching all analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = exports;