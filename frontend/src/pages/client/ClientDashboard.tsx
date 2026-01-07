import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Clock,
  Building2,
  User,
  Trophy,
  Calendar,
  MoreVertical,
  History,
  LogOut,
  Edit,
  Save,
  X,
  TrendingUp,
} from "lucide-react";
import AnimatedStatsBar from "@/components/ui/AnimatedStatsBar";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { io, Socket } from "socket.io-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Turf, Booking, Tournament, UserProfile } from "@/types";
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
} from "@/components/ui/dialog";

const ClientDashboard = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeSection, setActiveSection] = useState<"turfs" | "tournaments" | "bookings">("turfs");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<Booking[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [turfsRes, bookingsRes, tournamentsRes, profileRes] =
        await Promise.all([
          api.get("/turfs/my"),
          api.get("/bookings/client"),
          api.get("/tournaments/my"),
          api.get("/profile/me"),
        ]);

      setTurfs(Array.isArray(turfsRes.data) ? turfsRes.data : []);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setMyTournaments(
        Array.isArray(tournamentsRes.data) ? tournamentsRes.data : [],
      );
      const user = profileRes.data?.user;
      if (user) {
        setProfile(user);
        setProfileName(user.name || "");
        if (user.name) localStorage.setItem("name", user.name);
        if (user.profile_image_url) {
          localStorage.setItem("profile_image_url", user.profile_image_url);
        }
      }
    } catch (err: unknown) {
      console.error("Client dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get("/bookings/client");
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
    fetchData();

    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    const socket = io({
      path: "/socket.io",
      transports: ["polling", "websocket"],
    });

    // Join per-user room so backend can push booking notifications
    socket.emit("join_user", userId);

    socket.on("booking_confirmed", () => {
      toast({
        title: "New booking received",
        description: "A player has just booked one of your turfs.",
      });
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData, toast]);

  const handleCancel = async (bookingId: string | number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await api.post("/bookings/owner-cancel", {
        booking_id: bookingId,
      });

      // Instantly remove from UI
      setBookings(prev => prev.filter(b => b.id !== bookingId));

      toast({
        title: "Booking cancelled",
        description: res.data.message || "The booking was cancelled successfully.",
      });
    } catch (err: unknown) {
      console.error("Cancel booking error:", err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Cancellation failed";
      toast({
        title: "Unable to cancel booking",
        description: errorMessage,
        variant: "destructive",
      });
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
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
            {/* LEFT SIDEBAR - PROFILE EDIT */}
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
                        <Badge variant="outline" className="mt-2 border-green-500/30 bg-green-500/10 text-green-400">Client</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
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
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Client Dashboard</h1>
                  <p className="text-muted-foreground">
                    Manage your turfs, slots & bookings
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="gradient-primary"
                    onClick={() => navigate("/client/add-turf")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Turf
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
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
              </div>

              {/* STATS - Animated */}
              <AnimatedStatsBar
                stats={[
                  { value: turfs.length, label: "Total Turfs" },
                  { value: bookings.length, label: "Total Bookings" },
                  { value: 1, label: "Business Status", prefix: "Active" },
                ]}
              />

              {/* INTERNAL NAVBAR */}
              <div className="flex gap-2 border-b border-border/40 pb-2">
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeSection === "turfs"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => setActiveSection("turfs")}
                >
                  My Turfs
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
                <button
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeSection === "bookings"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => setActiveSection("bookings")}
                >
                  Recent Bookings
                </button>
              </div>

              {/* CONTENT SECTIONS */}
              {activeSection === "turfs" && (
                <>
                  {!loading && turfs.length === 0 && (
                    <Card variant="glass" className="p-10 text-center">
                      <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-lg font-bold mb-2">No Turfs Added</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding your first turf
                      </p>
                      <Button onClick={() => navigate("/client/add-turf")}>
                        Add Turf
                      </Button>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {turfs.map((turf) => (
                      <Card key={turf.id} variant="glass" className="relative">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{turf.name}</h3>
                              <Badge variant="outline" className="mt-1">Active</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {turf.location}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {(Array.isArray(turf.facilities)
                              ? turf.facilities
                              : turf.facilities?.split(",") || []
                            )
                              .slice(0, 3)
                              .map((f) => (
                                <Badge key={f} variant="secondary" className="text-xs">
                                  {typeof f === "string" ? f.trim() : f}
                                </Badge>
                              ))}
                          </div>

                          <div className="font-semibold text-primary">
                            ₹{turf.price_per_slot} / slot
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() =>
                                navigate(`/client/turfs/${turf.id}/slots`)
                              }
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Slots
                            </Button>

                            <Button
                              className="flex-1 gradient-primary text-xs"
                              onClick={() =>
                                navigate(`/client/add-tournament?turf_id=${turf.id}`)
                              }
                            >
                              + Tournament
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {activeSection === "tournaments" && (
                <>
                  {myTournaments.length === 0 && (
                    <Card variant="glass" className="p-10 text-center">
                      <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-lg font-bold mb-2">No Tournaments</h3>
                      <p className="text-muted-foreground mb-4">You haven't organized any tournaments yet.</p>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTournaments.map(t => (
                      <Card key={t.id} variant="glass" className="relative">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{t.name}</h3>
                              <Badge variant="outline" className="mt-1">{t.sport}</Badge>
                            </div>
                            <Badge variant={t.status === 'upcoming' ? 'secondary' : 'default'}>{t.status || 'Active'}</Badge>
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(t.start_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Max Teams: {t.max_teams}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/client/add-tournament?id=${t.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-10 px-0"
                              onClick={async () => {
                                if (!confirm("Delete this tournament?")) return;
                                try {
                                  await api.delete(`/tournaments/${t.id}`);
                                  setMyTournaments(prev => prev.filter(x => x.id !== t.id));
                                  toast({
                                    title: "Tournament deleted",
                                    description: "The tournament has been removed.",
                                  });
                                } catch (e: unknown) {
                                  const errorMessage = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to delete";
                                  toast({
                                    title: "Unable to delete tournament",
                                    description: errorMessage,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              X
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {activeSection === "bookings" && (
                <>
                  {bookings.length === 0 && (
                    <Card variant="glass" className="p-8 text-center">
                      <p className="text-muted-foreground">No bookings yet</p>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((b) => (
                      <Card key={b.id} variant="glass" className="relative">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex justify-between items-start"><div className="flex-1">
                            <h3 className="font-semibold">{b.turf_name}</h3>
                            <Badge
                              variant={
                                b.status === "confirmed" ? "success" : "secondary"
                              }
                              className="mt-1"
                            >
                              {b.status}
                            </Badge>
                          </div>
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {b.player_name || "Guest"}
                          </div>

                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {b.slot_time || "N/A"}
                          </div>

                          {b.status === "confirmed" && b.verification_code && (
                            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">Verification Code</div>
                              <div className="text-xl font-mono font-bold text-primary tracking-wider text-center">
                                {b.verification_code}
                              </div>
                            </div>
                          )}

                          {b.status === "confirmed" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => handleCancel(b.id)}
                            >
                              Cancel Booking
                            </Button>
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
                <Card key={booking.id} variant="glass">
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

export default ClientDashboard;