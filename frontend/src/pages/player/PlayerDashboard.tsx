import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, XCircle, User, Calendar, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Booking, Conversation, Tournament, UserProfile } from "@/types";
import { useToast } from "@/components/ui/use-toast";

const PlayerDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

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
      if (user?.name) localStorage.setItem("name", user.name);
      if (user?.profile_image_url) {
        localStorage.setItem("profile_image_url", user.profile_image_url);
      }
    } catch (e) {
      console.warn("Failed to load profile for dashboard");
    }
  };

  useEffect(() => {
    fetchBookings();
    loadConversations();
    fetchTournamentStats();
    fetchProfile();
  }, []);

  const cancelBooking = async (bookingId: number | string) => {
    if (!confirm("Cancel this booking? Refund will be processed after 5% deduction.")) return;

    try {
      await api.post("/bookings/cancel", { booking_id: bookingId });
      // Instantly remove from UI
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    } catch {
      toast({
        title: "Cancellation failed",
        description: "We couldn't cancel this booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="pt-24 pb-12 relative z-10">
        <div className="container px-4">

          {/* PROFILE HEADER */}
          {profile && (
            <div className="flex items-center gap-4 mb-6 animate-fade-in">
              <Avatar className="h-12 w-12">
                {profile.profile_image_url && (
                  <AvatarImage
                    src={profile.profile_image_url}
                    alt={profile.name}
                  />
                )}
                <AvatarFallback>
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <h1 className="text-xl font-heading font-bold">{profile.name}</h1>
              </div>
            </div>
          )}

          {/* STATS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            <Card className="glass-card border-white/10 p-6">
              <h3 className="text-muted-foreground font-medium mb-2">Total Tournaments</h3>
              <div className="text-3xl font-bold font-heading">{tournamentStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">You have joined {tournamentStats.total} tournaments</p>
            </Card>
            <Card className="glass-card border-white/10 p-6">
              <h3 className="text-muted-foreground font-medium mb-2">Upcoming Events</h3>
              <div className="text-3xl font-bold font-heading text-primary">{tournamentStats.upcoming}</div>
              <p className="text-xs text-muted-foreground mt-1">Get ready to compete!</p>
            </Card>
            <Card className="glass-card border-white/10 p-6">
              <h3 className="text-muted-foreground font-medium mb-2">Past Events</h3>
              <div className="text-3xl font-bold font-heading">{tournamentStats.past}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed tournaments</p>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">My Bookings</h1>
              <p className="text-muted-foreground mt-1">Manage your turf bookings and schedule</p>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <Card className="glass-card border-white/10 p-12 text-center animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven’t booked any turfs yet. Browse our selection of premium turfs and book your first game!
              </p>
              <Button onClick={() => navigate("/turfs")} className="gradient-primary hover:opacity-90">
                Browse Turfs
              </Button>
            </Card>
          )}

          {/* Tournament Bookings Section */}
          {tournamentBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                My Tournament Bookings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournamentBookings.map((tournament, index) => (
                  <Card
                    key={tournament.id}
                    className="glass-card hover-lift border-white/10 overflow-hidden animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="p-5 border-b border-white/5 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-heading font-bold text-xl text-foreground line-clamp-1">
                            {tournament.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`capitalize border-0 ${
                              tournament.status === "upcoming"
                                ? "bg-amber-500/10 text-amber-500"
                                : tournament.status === "completed"
                                ? "bg-gray-500/10 text-gray-500"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {tournament.status}
                          </Badge>
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
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking, index) => (
              <Card
                key={booking.id}
                className="glass-card hover-lift border-white/10 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0">
                  <div className="p-5 border-b border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-heading font-bold text-xl text-foreground line-clamp-1">
                        {booking.turf_name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`capitalize border-0 ${booking.status === "confirmed"
                          ? "bg-green-500/10 text-green-500"
                          : booking.status?.includes("cancelled")
                            ? "bg-red-500/10 text-red-500"
                            : "bg-secondary text-muted-foreground"
                          }`}
                      >
                        {booking.status?.replace(/_/g, " ")}
                      </Badge>
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
                        onClick={() => cancelBooking(booking.id)}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlayerDashboard;
