const supabase = require("../config/db");

/* ============================================================================
   ANALYTICS CONTROLLER - Turf Owner Analytics (FIXED)
   ============================================================================ */

/**
 * Calculate percentage change safely
 */
const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
};

/**
 * Get date range
 */
const getDateRange = (period) => {
    const daysMap = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
        '1year': 365
    };

    const days = daysMap[period] || 30;

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    return {
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        startDateOnly: start.toISOString().split('T')[0],
        endDateOnly: end.toISOString().split('T')[0],
        days
    };
};

/**
 * GET ALL ANALYTICS
 */
exports.getAllAnalytics = async (req, res) => {
    try {
        const { turf_id, period = '30days' } = req.query;

        if (!turf_id) {
            return res.status(400).json({
                success: false,
                message: 'turf_id is required'
            });
        }

        /* --------------------------------------------------------------------
           VERIFY TURF OWNERSHIP
        -------------------------------------------------------------------- */
        const { data: turf, error: turfError } = await supabase
            .from('turfs')
            .select('id, owner_id, name')
            .eq('id', turf_id)
            .eq('owner_id', req.user.id)
            .eq('is_active', true)
            .single();

        if (turfError || !turf) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized or turf not found'
            });
        }

        const { startISO, endISO, startDateOnly, endDateOnly, days } =
            getDateRange(period);

        /* --------------------------------------------------------------------
           PREVIOUS PERIOD RANGE
        -------------------------------------------------------------------- */
        const prevEnd = new Date(startISO);
        prevEnd.setDate(prevEnd.getDate() - 1);
        prevEnd.setHours(23, 59, 59, 999);

        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - days);
        prevStart.setHours(0, 0, 0, 0);

        /* --------------------------------------------------------------------
           FETCH DATA
        -------------------------------------------------------------------- */
        const [
            currentBookings,
            currentTournamentBookings,
            previousBookings,
            previousTournamentBookings,
            slotsRes,
            reviewsRes,
            prevReviewsRes,
            bookingsForTrends
        ] = await Promise.all([
            supabase
                .from('bookings')
                .select('total_amount, created_at')
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'success'])
                .gte('created_at', startISO)
                .lte('created_at', endISO),

            supabase
                .from('tournament_participants')
                .select('created_at, tournaments(entry_fee)')
                .eq('tournaments.turf_id', turf_id)
                .in('payment_status', ['paid', 'completed', 'success'])
                .gte('created_at', startISO)
                .lte('created_at', endISO),

            supabase
                .from('bookings')
                .select('total_amount')
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'success'])
                .gte('created_at', prevStart.toISOString())
                .lte('created_at', prevEnd.toISOString()),

            supabase
                .from('tournament_participants')
                .select('created_at, tournaments(entry_fee)')
                .eq('tournaments.turf_id', turf_id)
                .in('payment_status', ['paid', 'completed', 'success'])
                .gte('created_at', prevStart.toISOString())
                .lte('created_at', prevEnd.toISOString()),

            supabase
                .from('slots')
                .select('*', { count: 'exact', head: true })
                .eq('turf_id', turf_id)
                .gte('date', startDateOnly)
                .lte('date', endDateOnly),

            supabase
                .from('reviews')
                .select('rating')
                .eq('turf_id', turf_id)
                .gte('created_at', startISO),

            supabase
                .from('reviews')
                .select('rating')
                .eq('turf_id', turf_id)
                .gte('created_at', prevStart.toISOString())
                .lte('created_at', prevEnd.toISOString()),

            supabase
                .from('bookings')
                .select(`
                    created_at,
                    total_amount,
                    slots(start_time)
                `)
                .eq('turf_id', turf_id)
                .in('status', ['confirmed', 'completed', 'paid', 'success'])
                .gte('created_at', startISO)
                .lte('created_at', endISO)
        ]);

        const turfBookingsCount = currentBookings.data?.length || 0;
        const tournamentBookingsCount = currentTournamentBookings.data?.length || 0;
        const totalBookings = turfBookingsCount + tournamentBookingsCount;

        const turfRevenue =
            currentBookings.data?.reduce((s, b) => s + (b.total_amount || 0), 0) || 0;

        const tournamentRevenue =
            currentTournamentBookings.data?.reduce(
                (s, p) => s + (p.tournaments?.entry_fee || 0),
                0
            ) || 0;

        const totalRevenue = turfRevenue + tournamentRevenue;

        const prevRevenue =
            (previousBookings.data?.reduce((s, b) => s + (b.total_amount || 0), 0) || 0) +
            (previousTournamentBookings.data?.reduce(
                (s, p) => s + (p.tournaments?.entry_fee || 0),
                0
            ) || 0);

        const occupancyRate =
            slotsRes.count > 0
                ? Math.round((turfBookingsCount / slotsRes.count) * 100)
                : 0;

        const avgRating =
            reviewsRes.data?.length > 0
                ? reviewsRes.data.reduce((s, r) => s + r.rating, 0) /
                  reviewsRes.data.length
                : 0;

        const prevAvgRating =
            prevReviewsRes.data?.length > 0
                ? prevReviewsRes.data.reduce((s, r) => s + r.rating, 0) /
                  prevReviewsRes.data.length
                : 0;

        /* --------------------------------------------------------------------
           DAILY BOOKINGS
        -------------------------------------------------------------------- */
        const dailyMap = {};
        bookingsForTrends.data?.forEach(b => {
            const date = b.created_at.split('T')[0];
            if (!dailyMap[date]) dailyMap[date] = { date, bookings: 0, revenue: 0 };
            dailyMap[date].bookings++;
            dailyMap[date].revenue += b.total_amount || 0;
        });

        const dailyBookings = Object.values(dailyMap).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        /* --------------------------------------------------------------------
           PEAK HOURS
        -------------------------------------------------------------------- */
        const hourMap = {};
        bookingsForTrends.data?.forEach(b => {
            const hour = b.slots?.start_time?.split(':')[0];
            if (!hour) return;
            hourMap[hour] = (hourMap[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourMap)
            .map(([hour, bookings]) => ({ hour: Number(hour), bookings }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

        /* --------------------------------------------------------------------
           RESPONSE
        -------------------------------------------------------------------- */
        return res.json({
            success: true,
            data: {
                totalRevenue: Math.round(totalRevenue),
                revenueChange: calculatePercentageChange(totalRevenue, prevRevenue),
                totalBookings,
                bookingsChange: calculatePercentageChange(
                    totalBookings,
                    previousBookings.data?.length || 0
                ),
                occupancyRate,
                avgRating: Number(avgRating.toFixed(1)),
                ratingChange: Number((avgRating - prevAvgRating).toFixed(1)),
                dailyBookings,
                peakHours,
                period: {
                    start: startDateOnly,
                    end: endDateOnly
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
        console.error('Analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = exports;
