import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, XCircle, User, Calendar, Users, MoreVertical, History, LogOut, Edit, Save, X, Trophy, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Booking, Conversation, Tournament, UserProfile } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import AnimatedStatsBar from "@/components/ui/AnimatedStatsBar";
import { getCancellationInfo } from "@/services/bookingService";

const PlayerDashboard = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [activeSection, setActiveSection] = useState<"bookings" | "tournaments">("bookings");
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState<Booking[]>([]);

    // Cancellation modal state
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelBookingId, setCancelBookingId] = useState<string | number | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelInfo, setCancelInfo] = useState<{
        can_cancel: boolean;
        refund_percentage: number;
        refund_amount: number;
        hours_until_slot: number;
        message: string;
        cancellations_this_month?: number;
        remaining_cancellations?: number;
    } | null>(null);
    const [loadingCancelInfo, setLoadingCancelInfo] = useState(false);

    const loadConversations = async () => {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;
        try {
            // Conversations are resolved on the server from the authenticated user
            const res = await api.get("/chat/conversations");
            setConversations(res.data || []);
        } catch (e) {
            console.warn("Failed to load conversations", e);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get("/bookings/my");
            setBookings(res.data);
        } catch {
            toast({
                title: "Unable to load bookings",
                description: "Please try again in a moment.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const [tournamentStats, setTournamentStats] = useState({ total: 0, upcoming: 0, past: 0 });

    const [tournamentBookings, setTournamentBookings] = useState<Tournament[]>([]);

    const fetchTournamentStats = async () => {
        try {
            const res = await api.get("/tournaments/player-stats");
            const list = Array.isArray(res.data) ? res.data : [];
            const now = new Date();
            const upcoming = list.filter((t: Tournament) => new Date(t.start_date) > now).length;
            const past = list.filter((t: Tournament) => new Date(t.start_date) <= now).length; // Approximating past as started
            setTournamentStats({ total: list.length, upcoming, past });
            setTournamentBookings(list);
        } catch (e) {
            console.warn("Failed to load tournament stats");
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get("/profile/me");
            const { user } = res.data;
            setProfile(user);
            setProfileName(user?.name || "");
            if (user?.name) localStorage.setItem("name", user.name);
            if (user?.profile_image_url) {
                localStorage.setItem("profile_image_url", user.profile_image_url);
            }
        } catch (e) {
            console.warn("Failed to load profile for dashboard");
        }
    };

    const loadHistory = async () => {
        try {
            const res = await api.get("/bookings/my");
            setHistoryData(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSavingProfile(true);

        try {
            let profileImageUrl = profile.profile_image_url || undefined;

            if (avatarFile) {
                const form = new FormData();
                form.append("avatar", avatarFile);
                const uploadRes = await api.post("/profile/avatar", form, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                profileImageUrl = uploadRes.data.profile_image_url;
            }

            const updateRes = await api.put("/profile", {
                name: profileName,
                profile_image_url: profileImageUrl,
            });

            setProfile(updateRes.data);
            setIsEditingProfile(false);
            setAvatarFile(null);
            setAvatarPreview(null);

            if (updateRes.data?.name) {
                localStorage.setItem("name", updateRes.data.name);
            }
            if (updateRes.data?.profile_image_url) {
                localStorage.setItem("profile_image_url", updateRes.data.profile_image_url);
            }

            toast({
                title: "Profile updated",
                description: "Your profile has been saved successfully.",
            });
        } catch (e) {
            console.error("Failed to save profile", e);
            toast({
                title: "Failed to save profile",
                description: "Please try again.",
                variant: "destructive",
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user_id");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("profile_image_url");
        navigate("/login");
    };

    useEffect(() => {
        fetchBookings();
        loadConversations();
        fetchTournamentStats();
        fetchProfile();
    }, []);

    // Open cancel modal and fetch cancellation info
    const openCancelModal = async (bookingId: number | string) => {
        setCancelBookingId(bookingId);
        setCancelInfo(null);
        setCancelModalOpen(true);
        setLoadingCancelInfo(true);

        try {
            const res = await getCancellationInfo(bookingId);
            setCancelInfo(res.data);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.error || "Failed to load cancellation info";
            setCancelInfo({
                can_cancel: false,
                refund_percentage: 0,
                refund_amount: 0,
                hours_until_slot: 0,
                message: errorMsg,
            });
        } finally {
            setLoadingCancelInfo(false);
        }
    };

    // Confirm cancellation
    const confirmCancelBooking = async () => {
        if (!cancelBookingId || !cancelInfo?.can_cancel) return;

        setCancelling(true);
        try {
            await api.post("/bookings/cancel", { booking_id: cancelBookingId });
            // Remove from UI
            setBookings(prev => prev.filter(b => b.id !== cancelBookingId));
            setCancelModalOpen(false);
            toast({
                title: "Booking cancelled",
                description: cancelInfo.refund_percentage === 100 
                    ? `Your booking has been cancelled. Full refund of ₹${cancelInfo.refund_amount} will be processed.`
                    : "Your booking has been cancelled. No refund (cancelled less than 2 hours before slot).",
            });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.error || "We couldn't cancel this booking. Please try again.";
            toast({
                title: "Cancellation failed",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setCancelling(false);
        }
    };

    const displayAvatar = avatarPreview || profile?.profile_image_url || undefined;
    const initials = profile?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 grid-overlay opacity-20" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <Navbar />

            <main className="pt-24 pb-12 relative z-10">
                <div className="container px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
                        {/* LEFT SIDEBAR - PROFILE */}
                        <div className="lg:sticky lg:top-24 h-fit">
                            <Card
                                className="border-green-500/20 p-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%)',
                                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                {!isEditingProfile ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar className="h-20 w-20">
                                                {displayAvatar && (
                                                    <AvatarImage src={displayAvatar} alt={profile?.name} />
                                                )}
                                                <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-center">
                                                <h3 className="font-bold text-lg text-green-400">{profile?.name || "User"}</h3>
                                                <p className="text-sm text-green-300/70">{profile?.email || ""}</p>
                                                <Badge variant="outline" className="mt-2 border-green-500/30 bg-green-500/10 text-green-400">Player</Badge>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => setIsEditingProfile(true)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Profile
                                            </Button>
                                            <div className="space-y-2 text-sm pt-4 border-t border-green-500/20">
                                                <div className="flex justify-between">
                                                    <span className="text-green-300/60">Phone</span>
                                                    <span className="font-medium text-green-400">{profile?.phone || "Not set"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-green-300/60">Joined</span>
                                                    <span className="font-medium text-green-400">Member</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar className="h-20 w-20">
                                                {displayAvatar && (
                                                    <AvatarImage src={displayAvatar} alt={profile?.name} />
                                                )}
                                                <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="w-full space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                />
                                            </div>
                                            <div className="w-full space-y-2">
                                                <Label>Email</Label>
                                                <Input value={profile?.email || ""} disabled />
                                            </div>
                                            <div className="w-full space-y-2">
                                                <Label htmlFor="avatar">Profile Picture</Label>
                                                <Input
                                                    id="avatar"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setIsEditingProfile(false);
                                                    setAvatarFile(null);
                                                    setAvatarPreview(null);
                                                    setProfileName(profile?.name || "");
                                                }}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={handleSaveProfile}
                                                disabled={savingProfile}
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {savingProfile ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* MAIN CONTENT */}
                        <div className="space-y-6">
                            {/* HEADER */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-heading font-bold text-foreground">Player Dashboard</h1>
                                    <p className="text-muted-foreground mt-1">Manage your turf bookings and schedule</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            loadHistory();
                                            setHistoryOpen(true);
                                        }}>
                                            <History className="w-4 h-4 mr-2" />
                                            History
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleLogout}>
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* STATS SECTION - Animated */}
                            <AnimatedStatsBar
                                stats={[
                                    { value: bookings.length, label: "Turf Booked" },
                                    { value: tournamentStats.total, label: "Total Tournaments" },
                                    { value: tournamentStats.upcoming, label: "Upcoming Events" },
                                ]}
                            />

                            {/* INTERNAL NAVBAR */}
                            <div className="flex gap-2 border-b border-border/40 pb-2">
                                <button
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeSection === "bookings"
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    onClick={() => setActiveSection("bookings")}
                                >
                                    My Bookings
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeSection === "tournaments"
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    onClick={() => setActiveSection("tournaments")}
                                >
                                    My Tournaments
                                </button>
                            </div>

                            {/* CONTENT SECTIONS */}
                            {activeSection === "bookings" && (
                                <>
                                    {loading && (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}

                                    {!loading && bookings.length === 0 && (
                                        <Card className="glass-card border-white/10 p-12 text-center">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                                <Clock className="w-8 h-8 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                You haven't booked any turfs yet. Browse our selection of premium turfs and book your first game!
                                            </p>
                                            <Button onClick={() => navigate("/turfs")} className="gradient-primary hover:opacity-90">
                                                Browse Turfs
                                            </Button>
                                        </Card>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {bookings.map((booking, index) => (
                                            <Card
                                                key={booking.id}
                                                className="hover-lift border-green-500/20 overflow-hidden relative"
                                                style={{
                                                    animationDelay: `${index * 100}ms`,
                                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%)',
                                                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)',
                                                }}
                                            >
                                                <CardContent className="p-0">
                                                    <div className="p-5 border-b border-white/5 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <h3 className="font-heading font-bold text-xl text-foreground line-clamp-1">
                                                                    {booking.turf_name}
                                                                </h3>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`capitalize border-0 mt-1 ${booking.status === "confirmed"
                                                                        ? "bg-green-500/10 text-green-500"
                                                                        : booking.status?.includes("cancelled")
                                                                            ? "bg-red-500/10 text-red-500"
                                                                            : "bg-secondary text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {booking.status?.replace(/_/g, " ")}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <MapPin className="w-4 h-4 text-primary" />
                                                                <span className="truncate">{booking.location || "Location not available"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Clock className="w-4 h-4 text-primary" />
                                                                <span>{booking.slot_time || "Time not set"}</span>
                                                            </div>
                                                            {booking.turf_owner_name && (
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <User className="w-4 h-4 text-primary" />
                                                                    <span>Owner: {booking.turf_owner_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {booking.status === "confirmed" && (
                                                        <div className="p-4 bg-secondary/30 space-y-3">
                                                            {booking.verification_code && (
                                                                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                                                                    <div className="text-xs text-muted-foreground mb-1">Verification Code</div>
                                                                    <div className="text-2xl font-mono font-bold text-primary tracking-wider text-center">
                                                                        {booking.verification_code}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground mt-2 text-center">
                                                                        Show this code to the turf owner
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Button
                                                                variant="destructive"
                                                                className="w-full gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0"
                                                                onClick={() => openCancelModal(booking.id)}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Cancel Booking
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </>
                            )}

                            {activeSection === "tournaments" && (
                                <>
                                    {tournamentBookings.length === 0 && (
                                        <Card className="glass-card border-white/10 p-12 text-center">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                                <Trophy className="w-8 h-8 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">No tournaments yet</h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                You haven't joined any tournaments yet. Browse available tournaments and join one!
                                            </p>
                                            <Button onClick={() => navigate("/tournaments")} className="gradient-primary hover:opacity-90">
                                                Browse Tournaments
                                            </Button>
                                        </Card>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {tournamentBookings.map((tournament, index) => (
                                            <Card
                                                key={tournament.id}
                                                className="hover-lift border-green-500/20 overflow-hidden relative"
                                                style={{
                                                    animationDelay: `${index * 100}ms`,
                                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%)',
                                                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)',
                                                }}
                                            >
                                                <CardContent className="p-0">
                                                    <div className="p-5 border-b border-white/5 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <h3 className="font-heading font-bold text-xl text-foreground line-clamp-1">
                                                                    {tournament.name}
                                                                </h3>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`capitalize border-0 mt-1 ${tournament.status === "upcoming"
                                                                        ? "bg-amber-500/10 text-amber-500"
                                                                        : tournament.status === "completed"
                                                                            ? "bg-gray-500/10 text-gray-500"
                                                                            : "bg-secondary text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {tournament.status}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Calendar className="w-4 h-4 text-primary" />
                                                                <span>
                                                                    {tournament.start_date} - {tournament.end_date}
                                                                </span>
                                                            </div>
                                                            {tournament.team_name && (
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Users className="w-4 h-4 text-primary" />
                                                                    <span>Team: {tournament.team_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {tournament.verification_code && (
                                                        <div className="p-4 bg-primary/10 border-t border-primary/30">
                                                            <div className="text-xs text-muted-foreground mb-1">Verification Code</div>
                                                            <div className="text-2xl font-mono font-bold text-primary tracking-wider text-center">
                                                                {tournament.verification_code}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-2 text-center">
                                                                Show this code at the tournament
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* PLAYER CANCELLATION MODAL */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Cancel Booking
                        </DialogTitle>
                        <DialogDescription>
                            Review the cancellation details before confirming.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loadingCancelInfo ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : cancelInfo ? (
                            <div className="space-y-4">
                                {/* Refund Info */}
                                <div className={`p-4 rounded-lg border ${
                                    cancelInfo.refund_percentage === 100
                                        ? "bg-green-500/10 border-green-500/30"
                                        : "bg-red-500/10 border-red-500/30"
                                }`}>
                                    <div className="text-sm text-muted-foreground mb-1">Refund Amount</div>
                                    <div className={`text-2xl font-bold ${
                                        cancelInfo.refund_percentage === 100 ? "text-green-500" : "text-red-500"
                                    }`}>
                                        ₹{cancelInfo.refund_amount} ({cancelInfo.refund_percentage}%)
                                    </div>
                                </div>

                                {/* Time Warning */}
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                                        <div className="text-sm">
                                            <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                                {cancelInfo.hours_until_slot.toFixed(1)} hours until slot
                                            </span>
                                            <p className="text-muted-foreground mt-1">
                                                {cancelInfo.refund_percentage === 100
                                                    ? "Cancel ≥2 hours before for 100% refund."
                                                    : "Cancelling <2 hours before = 0% refund."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Limit Info */}
                                {cancelInfo.cancellations_this_month !== undefined && (
                                    <div className="text-sm text-muted-foreground">
                                        Cancellations this month: <span className="font-semibold text-foreground">
                                            {cancelInfo.cancellations_this_month}/5
                                        </span>
                                        {cancelInfo.remaining_cancellations !== undefined && (
                                            <span className="ml-2">({cancelInfo.remaining_cancellations} remaining)</span>
                                        )}
                                    </div>
                                )}

                                {/* Cannot Cancel Warning */}
                                {!cancelInfo.can_cancel && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500">
                                        {cancelInfo.message}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">Unable to load cancellation info</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCancelModalOpen(false)}
                            disabled={cancelling}
                        >
                            Keep Booking
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmCancelBooking}
                            disabled={cancelling || !cancelInfo?.can_cancel}
                        >
                            {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* HISTORY DIALOG */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Booking History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {historyData.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No history available</p>
                        ) : (
                            historyData.map((booking) => (
                                <Card key={booking.id} className="glass-card border-white/10">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold">{booking.turf_name}</h4>
                                                <p className="text-sm text-muted-foreground">{booking.player_name || "Guest"}</p>
                                            </div>
                                            <Badge variant={booking.status === "confirmed" ? "success" : "secondary"}>
                                                {booking.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {booking.slot_time || "N/A"}
                                            </div>
                                        </div>
                                        {booking.verification_code && (
                                            <div className="p-2 bg-primary/10 border border-primary/30 rounded text-sm">
                                                <span className="text-muted-foreground">Code: </span>
                                                <span className="font-mono font-bold text-primary">{booking.verification_code}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
};

export default PlayerDashboard;