import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Calendar,
    DollarSign, Star, BarChart3,
    Clock, Activity, IndianRupee
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change: number;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, change, color }) => {
    const isPositive = change >= 0;
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
                    {isPositive ? (
                        <TrendingUp size={14} className="text-green-600" />
                    ) : (
                        <TrendingDown size={14} className="text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(change)}%
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">vs last period</span>
                </div>
            </CardContent>
        </Card>
    );
};

interface AnalyticsProps {
    turfId: string;
    turfName?: string;
}

const TurfAnalytics: React.FC<AnalyticsProps> = ({ turfId, turfName }) => {
    const [period, setPeriod] = useState('30days');
    const [summary, setSummary] = useState<any>(null);
    const [dailyBookings, setDailyBookings] = useState<any[]>([]);
    const [peakHours, setPeakHours] = useState<any>(null);
    const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
    const [weeklyComparison, setWeeklyComparison] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllAnalytics();
    }, [turfId, period]);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchSummary(),
                fetchDailyBookings(),
                fetchPeakHours(),
                fetchRevenueByDay(),
                fetchWeeklyComparison()
            ]);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/analytics/summary?turf_id=${turfId}&period=${period}`);
            if (response.data.success) setSummary(response.data.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const fetchDailyBookings = async () => {
        try {
            const days = period === '7days' ? 7 : 30;
            const response = await api.get(`/analytics/daily-bookings?turf_id=${turfId}&days=${days}`);
            if (response.data.success) setDailyBookings(response.data.data);
        } catch (error) {
            console.error('Error fetching daily bookings:', error);
        }
    };

    const fetchPeakHours = async () => {
        try {
            const response = await api.get(`/analytics/peak-hours?turf_id=${turfId}&period=${period}`);
            if (response.data.success) setPeakHours(response.data.data);
        } catch (error) {
            console.error('Error fetching peak hours:', error);
        }
    };

    const fetchRevenueByDay = async () => {
        try {
            const response = await api.get(`/analytics/revenue-by-day?turf_id=${turfId}&period=${period}`);
            if (response.data.success) setRevenueByDay(response.data.data);
        } catch (error) {
            console.error('Error fetching revenue by day:', error);
        }
    };

    const fetchWeeklyComparison = async () => {
        try {
            const response = await api.get(`/analytics/weekly-comparison?turf_id=${turfId}`);
            if (response.data.success) setWeeklyComparison(response.data.data);
        } catch (error) {
            console.error('Error fetching weekly comparison:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Analytics
                    </h2>
                    {turfName && <p className="text-muted-foreground text-sm">{turfName}</p>}
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<IndianRupee size={20} />}
                    title="Revenue"
                    value={`₹${summary?.totalRevenue?.toLocaleString() || 0}`}
                    change={summary?.revenueChange || 0}
                    color="green"
                />
                <MetricCard
                    icon={<Calendar size={20} />}
                    title="Bookings"
                    value={summary?.totalBookings || 0}
                    change={summary?.bookingsChange || 0}
                    color="blue"
                />
                <MetricCard
                    icon={<BarChart3 size={20} />}
                    title="Occupancy"
                    value={`${summary?.occupancyRate || 0}%`}
                    change={summary?.occupancyChange || 0}
                    color="purple"
                />
                <MetricCard
                    icon={<Star size={20} />}
                    title="Rating"
                    value={summary?.averageRating?.toFixed(1) || '0.0'}
                    change={summary?.ratingChange || 0}
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
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={dailyBookings}>
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
                    </CardContent>
                </Card>

                {/* Revenue by Day */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Revenue by Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={revenueByDay}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis
                                    dataKey="day"
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
                            Peak Hours
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {peakHours?.peakHours?.slice(0, 4).map((hour: any, index: number) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium">{hour.hour}</span>
                                    <span className="text-muted-foreground">{hour.percentage}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${hour.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Weekly Comparison */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Weekly Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {weeklyComparison && (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Bookings</p>
                                        <p className="text-xl font-bold">{weeklyComparison.currentWeek.bookings}</p>
                                        <p className="text-xs text-muted-foreground">vs {weeklyComparison.previousWeek.bookings}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                                        <p className="text-xl font-bold">₹{(weeklyComparison.currentWeek.revenue / 1000).toFixed(1)}k</p>
                                        <p className="text-xs text-muted-foreground">vs ₹{(weeklyComparison.previousWeek.revenue / 1000).toFixed(1)}k</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Avg/Day</p>
                                        <p className="text-xl font-bold">{weeklyComparison.currentWeek.avgPerDay}</p>
                                        <p className="text-xs text-muted-foreground">vs {weeklyComparison.previousWeek.avgPerDay}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-border">
                                    {weeklyComparison.changes.bookings >= 0 ? (
                                        <TrendingUp size={16} className="text-green-600" />
                                    ) : (
                                        <TrendingDown size={16} className="text-red-600" />
                                    )}
                                    <span className={`text-sm font-medium ${weeklyComparison.changes.bookings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {Math.abs(weeklyComparison.changes.bookings)}% change from last week
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TurfAnalytics;
