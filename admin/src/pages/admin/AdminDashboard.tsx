import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users, MapPin, AlertCircle, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";

// Types
interface DashboardStats {
    turfs: {
        total: number;
        live: number;
        pending: number;
    };
    users: {
        total: number;
        new: number;
    };
    bookings: {
        weekly: number;
    };
}

interface PendingTurf {
    id: string;
    name: string;
    location: string;
    submitted_at: string;
    owner: {
        name: string;
        email: string;
    };
}

interface ActivityLog {
    id: string;
    activity_type: string;
    description: string;
    created_at: string;
}

const AdminDashboard = () => {
    // 1. Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get("/admin/dashboard/stats");
            return res.data;
        }
    });

    // 2. Fetch Pending Turfs Preview
    const { data: pendingTurfs, isLoading: pendingLoading } = useQuery<{ turfs: PendingTurf[] }>({
        queryKey: ['admin-pending-preview'],
        queryFn: async () => {
            // Fix: Correct route for pending preview is /admin/dashboard/pending-preview
            const res = await api.get("/admin/dashboard/pending-preview");
            return res.data;
        }
    });

    // 3. Fetch Recent Activity
    const { data: activityData, isLoading: activityLoading } = useQuery<{ activities: ActivityLog[] }>({
        queryKey: ['admin-activity'],
        queryFn: async () => {
            // Fix: Correct route for activity is /admin/activity/recent
            const res = await api.get("/admin/activity/recent");
            return res.data;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    {/* <Button variant="outline">Download Report</Button> */}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Turfs</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                            <>
                                <div className="text-2xl font-bold">{stats?.turfs.total}</div>
                                <p className="text-xs text-muted-foreground">{stats?.turfs.live} Live, {stats?.turfs.pending} Pending</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                            <>
                                <div className="text-2xl font-bold">{stats?.turfs.pending}</div>
                                <Link to="/admin/verification" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                    Review requests <ArrowRight className="h-3 w-3" />
                                </Link>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                            <>
                                <div className="text-2xl font-bold">{stats?.users.total}</div>
                                <p className="text-xs text-muted-foreground">+{stats?.users.new} this week</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                            <>
                                <div className="text-2xl font-bold">{stats?.bookings.weekly}</div>
                                <p className="text-xs text-muted-foreground">This week</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sections */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* RECENT ACTIVITY */}
                <Card className="col-span-4 h-[400px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full px-6 pb-6">
                            {activityLoading ? (
                                <div className="space-y-4 pt-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : activityData?.activities && activityData.activities.length > 0 ? (
                                <div className="space-y-6 pt-4">
                                    {activityData.activities.map((log) => (
                                        <div key={log.id} className="flex gap-4">
                                            <div className="mt-1">
                                                {log.activity_type.includes('approved') ? (
                                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                        <CheckCircle className="h-4 w-4" />
                                                    </div>
                                                ) : log.activity_type.includes('rejected') ? (
                                                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                                        <XCircle className="h-4 w-4" />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Activity className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{log.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    No recent activity.
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* PENDING VERIFICATIONS */}
                <Card className="col-span-3 h-[400px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Pending Verifications</span>
                            <Badge variant="secondary">{pendingTurfs?.turfs.length || 0}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full px-6 pb-6">
                            {pendingLoading ? (
                                <div className="space-y-4 pt-4">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            ) : pendingTurfs?.turfs && pendingTurfs.turfs.length > 0 ? (
                                <div className="space-y-4 pt-4">
                                    {pendingTurfs.turfs.map((turf) => (
                                        <div key={turf.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                                            <div className="space-y-1">
                                                <div className="font-medium text-sm">{turf.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> {turf.owner.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {new Date(turf.submitted_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link to={`/admin/verification/${turf.id}`}>Review</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                    <CheckCircle className="h-8 w-8 text-green-500/50" />
                                    <span>All caught up! No pending requests.</span>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
