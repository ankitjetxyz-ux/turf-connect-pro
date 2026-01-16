/**
 * PRODUCTION-GRADE ANALYTICS IMPLEMENTATION
 * ==========================================
 * 
 * This file demonstrates how to integrate the production-ready analytics system
 * with your existing TurfAnalytics component.
 * 
 * Key Features:
 * - Real data from Supabase
 * - Single optimized API call (instead of 5)
 * - Auto-refresh capability with polling
 * - Loading and error states
 * - Date range selection with presets
 * - Period comparison (current vs previous)
 * 
 * Integration Steps:
 * 1. Import the useTurfAnalytics hook and AnalyticsService
 * 2. Replace existing state management with the hook
 * 3. Use the hook's data, loading, and error states
 * 4. Add date range picker using preset ranges
 * 5. Wire up real data to existing UI components
 */

import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Calendar,
    DollarSign, Star, BarChart3,
    Clock, Activity, IndianRupee, RefreshCw, AlertCircle
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTurfAnalytics } from '@/hooks/useTurfAnalytics';
import { AnalyticsService } from '@/services/analyticsService';

interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change: number;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, change, color }) => {
    const isPositive = change >= 0;
    const isSignificant = Math.abs(change) >= 999; // New data scenario

    const colorClasses: Record<string, string> = {
        green: 'bg-green-500/10 text-green-600',
        blue: 'bg-blue-500/10 text-blue-600',
        purple: 'bg-purple-500/10 text-purple-600',
        yellow: 'bg-yellow-500/10 text-yellow-600'
    };

    return (
        <Card variant="glass" className="hover:border-primary/30 transition-all">
            <CardContent className="pt-6">
                <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
                    {icon}
                </div>
                <p className="text-muted-foreground text-sm mb-1">{title}</p>
                <p className="text-2xl font-bold mb-2">{value}</p>
                <div className="flex items-center gap-1">
                    {isSignificant ? (
                        <>
                            <TrendingUp size={14} className="text-green-600" />
                            <span className="text-xs font-medium text-green-600">
                                New Growth
                            </span>
                        </>
                    ) : (
                        <>
                            {isPositive ? (
                                <TrendingUp size={14} className="text-green-600" />
                            ) : (
                                <TrendingDown size={14} className="text-red-600" />
                            )}
                            <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {Math.abs(change)}%
                            </span>
                        </>
                    )}
                    <span className="text-muted-foreground text-xs ml-1">vs last period</span>
                </div>
            </CardContent>
        </Card>
    );
};

interface TurfAnalyticsEnhancedProps {
    turfId: string;
    turfName?: string;
}

const TurfAnalyticsEnhanced: React.FC<TurfAnalyticsEnhancedProps> = ({ turfId, turfName }) => {
    // Date range state - defaults to last 30 days
    const [dateRange, setDateRange] = useState(() =>
        AnalyticsService.getPresetDateRanges().last30Days
    );

    // Fetch analytics with the production-ready hook
    const { data, loading, error, refetch, isRefetching } = useTurfAnalytics({
        turfId,
        dateRange,
        refreshInterval: 0, // Set to 30000 for 30-second auto-refresh
        autoRefresh: true,
    });

    // Preset date ranges for quick selection
    const presetRanges = AnalyticsService.getPresetDateRanges();

    // Handle preset selection
    const handlePresetChange = (preset: keyof ReturnType<typeof AnalyticsService.getPresetDateRanges>) => {
        setDateRange(presetRanges[preset]);
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Loading analytics...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center py-12">
                <Card variant="glass" className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
                        <p className="text-muted-foreground text-sm mb-4">{error}</p>
                        <Button onClick={refetch} className="gap-2">
                            <RefreshCw size={16} />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Empty state
    if (!data || data.totalBookings === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Card variant="glass" className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold mb-2">No Bookings in This Period</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            Try expanding your date range to see your analytics
                        </p>
                        <div className="flex gap-2 justify-center flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetChange('last7Days')}
                            >
                                Last 7 Days
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetChange('last30Days')}
                            >
                                Last 30 Days
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetChange('last90Days')}
                            >
                                Last 90 Days
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Format chart data for daily bookings
    const dailyChartData = data.dailyBookings.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }),
        bookings: d.count,
        revenue: d.revenue,
    }));

    // Format peak hours for display
    const peakHoursDisplay = data.peakHours.slice(0, 4).map(h => {
        const totalBookings = data.peakHours.reduce((sum, hour) => sum + hour.bookings, 0);
        const percentage = totalBookings > 0 ? Math.round((h.bookings / totalBookings) * 100) : 0;
        return {
            hour: `${h.hour}:00 - ${h.hour + 1}:00`,
            count: h.bookings,
            percentage,
        };
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Analytics Dashboard
                    </h2>
                    {turfName && <p className="text-muted-foreground text-sm mt-1">{turfName}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                        {AnalyticsService.formatDateRange(dateRange)}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Preset date range buttons */}
                    <select
                        onChange={(e) => handlePresetChange(e.target.value as any)}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="last7Days">Last 7 Days</option>
                        <option value="last30Days" selected>Last 30 Days</option>
                        <option value="last90Days">Last 90 Days</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                    </select>

                    {/* Refresh button */}
                    <Button
                        onClick={refetch}
                        disabled={isRefetching}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                        {isRefetching ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<IndianRupee size={20} />}
                    title="Total Revenue"
                    value={`₹${data.totalRevenue.toLocaleString()}`}
                    change={data.revenueChange}
                    color="green"
                />
                <MetricCard
                    icon={<Calendar size={20} />}
                    title="Total Bookings"
                    value={data.totalBookings}
                    change={data.bookingsChange}
                    color="blue"
                />
                <MetricCard
                    icon={<BarChart3 size={20} />}
                    title="Occupancy Rate"
                    value={`${data.occupancyRate}%`}
                    change={0} // No change tracking for occupancy in current implementation
                    color="purple"
                />
                <MetricCard
                    icon={<Star size={20} />}
                    title="Average Rating"
                    value={data.avgRating.toFixed(1)}
                    change={parseFloat((data.ratingChange * 20).toFixed(1))} // Convert to percentage (0-5 scale to 0-100)
                    color="yellow"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Bookings Chart */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Daily Bookings Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dailyChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={dailyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-muted-foreground"
                                        style={{ fontSize: '11px' }}
                                    />
                                    <YAxis
                                        className="text-muted-foreground"
                                        style={{ fontSize: '11px' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="bookings"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue by Day */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Revenue by Day of Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.revenueByDayOfWeek.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={data.revenueByDayOfWeek}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis
                                        dataKey="dayOfWeek"
                                        className="text-muted-foreground"
                                        style={{ fontSize: '11px' }}
                                    />
                                    <YAxis
                                        className="text-muted-foreground"
                                        style={{ fontSize: '11px' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="hsl(var(--primary))"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Peak Hours & Weekly Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Hours */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock size={18} className="text-primary" />
                            Peak Booking Hours
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {peakHoursDisplay.length > 0 ? (
                            peakHoursDisplay.map((hour, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{hour.hour}</span>
                                        <span className="text-muted-foreground">
                                            {hour.count} bookings ({hour.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${hour.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-muted-foreground text-sm text-center py-4">
                                No peak hours data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Weekly Comparison */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Weekly Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Bookings</p>
                                <p className="text-xl font-bold">{data.weeklyComparison.currentWeek.bookings}</p>
                                <p className="text-xs text-muted-foreground">
                                    vs {data.weeklyComparison.previousWeek.bookings}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                                <p className="text-xl font-bold">
                                    ₹{(data.weeklyComparison.currentWeek.revenue / 1000).toFixed(1)}k
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    vs ₹{(data.weeklyComparison.previousWeek.revenue / 1000).toFixed(1)}k
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Avg/Day</p>
                                <p className="text-xl font-bold">
                                    {(data.weeklyComparison.currentWeek.bookings / 7).toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    vs {(data.weeklyComparison.previousWeek.bookings / 7).toFixed(1)}
                                </p>
                            </div>
                        </div>

                        {/* Change indicator */}
                        {(() => {
                            const change = data.weeklyComparison.previousWeek.bookings > 0
                                ? ((data.weeklyComparison.currentWeek.bookings - data.weeklyComparison.previousWeek.bookings) / data.weeklyComparison.previousWeek.bookings) * 100
                                : 0;
                            const isPositive = change >= 0;

                            return (
                                <div className="flex items-center gap-2 pt-2 border-t border-border">
                                    {isPositive ? (
                                        <TrendingUp size={16} className="text-green-600" />
                                    ) : (
                                        <TrendingDown size={16} className="text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.abs(Math.round(change))}% change from last week
                                    </span>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TurfAnalyticsEnhanced;
