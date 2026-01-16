import api from './api';
import { AnalyticsData, DateRange, AnalyticsResponse } from '@/types';

/**
 * Analytics Service - Handles all analytics-related API calls
 * Production-ready with error handling, validation, and preset date ranges
 */
export class AnalyticsService {
    /**
     * Fetches comprehensive analytics data for a specific turf and date range
     * Uses consolidated endpoint for optimal performance (1 API call instead of 5)
     */
    static async fetchTurfAnalytics(
        turfId: string,
        dateRange: DateRange
    ): Promise<AnalyticsData> {
        const { startDate, endDate } = dateRange;

        // Format dates to ISO string
        const start = new Date(startDate).toISOString();
        const end = new Date(endDate).toISOString();

        try {
            // Calculate period in days for the API
            const periodDays = Math.ceil(
                (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
            );

            let period = '30days';
            if (periodDays <= 7) period = '7days';
            else if (periodDays <= 30) period = '30days';
            else if (periodDays <= 90) period = '90days';
            else period = '1year';

            // Use consolidated endpoint - single optimized request with cache-busting
            const response = await api.get(`/analytics/all?turf_id=${turfId}&period=${period}&_t=${Date.now()}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Analytics fetch failed');
            }

            const data = response.data.data;

            // Transform to match AnalyticsData interface
            const analyticsData: AnalyticsData = {
                totalRevenue: data.totalRevenue || 0,
                revenueChange: data.revenueChange || 0,
                totalBookings: data.totalBookings || 0,
                bookingsChange: data.bookingsChange || 0,
                occupancyRate: data.occupancyRate || 0,
                avgRating: data.avgRating || 0,
                ratingChange: data.ratingChange || 0,
                dailyBookings: (data.dailyBookings || []).map((item: any) => ({
                    date: item.date,
                    count: item.bookings || 0,
                    revenue: item.revenue || 0,
                })),
                peakHours: (data.peakHours || []).map((item: any) => ({
                    hour: item.hour || 0,
                    bookings: item.bookings || 0,
                })),
                revenueByDayOfWeek: (data.revenueByDayOfWeek || []).map((item: any) => ({
                    dayOfWeek: item.day || item.dayOfWeek || '',
                    revenue: item.revenue || 0,
                })),
                weeklyComparison: data.weeklyComparison || {
                    currentWeek: { bookings: 0, revenue: 0 },
                    previousWeek: { bookings: 0, revenue: 0 }
                },
                period: {
                    start: data.period?.start || start,
                    end: data.period?.end || end,
                },
            };

            return analyticsData;
        } catch (error) {
            console.error('Analytics fetch error:', error);

            // Re-throw with context
            if (error instanceof Error) {
                throw new Error(`Failed to fetch analytics: ${error.message}`);
            }
            throw new Error('Failed to fetch analytics: Unknown error');
        }
    }

    /**
     * Fetch summary metrics
     */
    private static async fetchSummary(turfId: string, period: string) {
        try {
            const response = await api.get(`/analytics/summary?turf_id=${turfId}&period=${period}`);
            return response.data.success ? response.data.data : {};
        } catch (error) {
            console.error('Error fetching summary:', error);
            return {};
        }
    }

    /**
     * Fetch daily bookings trend
     */
    private static async fetchDailyBookings(turfId: string, days: number) {
        try {
            const response = await api.get(`/analytics/daily-bookings?turf_id=${turfId}&days=${days}`);
            if (response.data.success) {
                // Transform data to match AnalyticsData interface
                return response.data.data.map((item: any) => ({
                    date: item.date,
                    count: item.bookings || 0,
                    revenue: item.revenue || 0,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching daily bookings:', error);
            return [];
        }
    }

    /**
     * Fetch peak hours analysis
     */
    private static async fetchPeakHours(turfId: string, period: string) {
        try {
            const response = await api.get(`/analytics/peak-hours?turf_id=${turfId}&period=${period}`);
            if (response.data.success && response.data.data.peakHours) {
                // Transform to match PeakHour interface
                return response.data.data.peakHours.map((item: any) => {
                    // Extract hour from "hour:00 - hour+1:00" format
                    const hourMatch = item.hour?.match(/(\d+):/);
                    const hour = hourMatch ? parseInt(hourMatch[1]) : 0;
                    return {
                        hour,
                        bookings: item.bookingCount || item.count || 0,
                    };
                });
            }
            return [];
        } catch (error) {
            console.error('Error fetching peak hours:', error);
            return [];
        }
    }

    /**
     * Fetch revenue by day of week
     */
    private static async fetchRevenueByDay(turfId: string, period: string) {
        try {
            const response = await api.get(`/analytics/revenue-by-day?turf_id=${turfId}&period=${period}`);
            if (response.data.success) {
                // Transform to match RevenueByDay interface
                return response.data.data.map((item: any) => ({
                    dayOfWeek: item.day || item.dayOfWeek,
                    revenue: item.revenue || 0,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching revenue by day:', error);
            return [];
        }
    }

    /**
     * Fetch weekly comparison
     */
    private static async fetchWeeklyComparison(turfId: string) {
        try {
            const response = await api.get(`/analytics/weekly-comparison?turf_id=${turfId}`);
            if (response.data.success && response.data.data) {
                return {
                    currentWeek: {
                        bookings: response.data.data.currentWeek?.bookings || 0,
                        revenue: response.data.data.currentWeek?.revenue || 0,
                    },
                    previousWeek: {
                        bookings: response.data.data.previousWeek?.bookings || 0,
                        revenue: response.data.data.previousWeek?.revenue || 0,
                    },
                };
            }
            return {
                currentWeek: { bookings: 0, revenue: 0 },
                previousWeek: { bookings: 0, revenue: 0 }
            };
        } catch (error) {
            console.error('Error fetching weekly comparison:', error);
            return {
                currentWeek: { bookings: 0, revenue: 0 },
                previousWeek: { bookings: 0, revenue: 0 }
            };
        }
    }

    /**
     * Validates date range
     */
    static validateDateRange(dateRange: DateRange): boolean {
        const { startDate, endDate } = dateRange;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check valid dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return false;
        }

        // Start must be before end
        if (start >= end) {
            return false;
        }

        // End date shouldn't be in the future (allow today) - DISABLED for "All Time" feature
        // const today = new Date();
        // today.setHours(23, 59, 59, 999);
        // if (end > today) {
        //     return false;
        // }

        return true;
    }

    /**
     * Generates preset date ranges
     */
    static getPresetDateRanges() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return {
            today: {
                startDate: today,
                endDate: now,
            },
            last7Days: {
                startDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
                endDate: now,
            },
            last30Days: {
                startDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
                endDate: now,
            },
            last90Days: {
                startDate: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000),
                endDate: now,
            },
            thisMonth: {
                startDate: new Date(now.getFullYear(), now.getMonth(), 1),
                endDate: now,
            },
            lastMonth: {
                startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                endDate: new Date(now.getFullYear(), now.getMonth(), 0),
            },
            // ✅ "All Time" maps to '1year' in our logic (Past year + Future year)
            '1year': {
                startDate: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 Year ago
                endDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000),   // 1 Year future
            }
        };
    }

    /**
     * Format date range for display
     */
    static formatDateRange(dateRange: DateRange): string {
        if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
            return 'Invalid Range';
        }
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);

        const formatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        });

        return `${formatter.format(start)} - ${formatter.format(end)}`;
    }
}
