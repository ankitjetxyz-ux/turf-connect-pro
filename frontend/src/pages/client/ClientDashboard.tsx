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
  Calendar
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { io, Socket } from "socket.io-client";

const ClientDashboard = () => {
  type TurfItem = {
    id: number | string;
    name?: string;
    location?: string;
    facilities?: string;
    price_per_slot?: number;
  };

  type Booking = {
    id: number | string;
    turf_name?: string;
    player_name?: string;
    slot_time?: string;
    status?: string;
  };

  const [turfs, setTurfs] = useState<TurfItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  const fetchData = async () => {
    try {
      const [turfsRes, bookingsRes, tournamentsRes] = await Promise.all([
        api.get("/turfs/my"),
        api.get("/bookings/client"),
        api.get("/tournaments/my")
      ]);

      setTurfs(Array.isArray(turfsRes.data) ? turfsRes.data : []);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setMyTournaments(Array.isArray(tournamentsRes.data) ? tournamentsRes.data : []);
    } catch (err: any) {
      console.error("Client dashboard error:", err?.response?.data || err);
      // alert(err?.response?.data?.error || "Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    const socket = io("http://localhost:8080");
    socketRef.current = socket;

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
  }, []);

  const handleCancel = async (bookingId: string | number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await api.post("/bookings/owner-cancel", {
        booking_id: bookingId,
      });
      alert(res.data.message || "Booking cancelled");

      // Instantly remove from UI
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err: any) {
      console.error("Cancel booking error:", err?.response?.data || err);
      alert(err?.response?.data?.error || "Cancellation failed");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container px-4">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Client Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your turfs, slots & bookings
              </p>
            </div>

            <Button
              className="gradient-primary"
              onClick={() => navigate("/client/add-turf")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Turf
            </Button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <Card variant="glass">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  {turfs.length}
                </div>
                <p className="text-muted-foreground">Total Turfs</p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  {bookings.length}
                </div>
                <p className="text-muted-foreground">Total Bookings</p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  Active
                </div>
                <p className="text-muted-foreground">Business Status</p>
              </CardContent>
            </Card>
          </div>

          {/* MY TURFS */}
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            My Turfs
          </h2>

          {!loading && turfs.length === 0 && (
            <Card variant="glass" className="p-10 text-center mb-10">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {turfs.map((turf) => (
              <Card key={turf.id} variant="glass">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-lg">{turf.name}</h3>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {turf.location}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {turf.facilities
                      ?.split(",")
                      .slice(0, 3)
                      .map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">
                          {f.trim()}
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

          {/* MY TOURNAMENTS */}
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            My Tournaments
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {myTournaments.length === 0 && (
              <Card variant="glass" className="p-10 text-center col-span-full">
                <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-bold mb-2">No Tournaments</h3>
                <p className="text-muted-foreground mb-4">You haven't organized any tournaments yet.</p>
              </Card>
            )}

            {myTournaments.map(t => (
              <Card key={t.id} variant="glass">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
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
                          toast({ title: "Tournament deleted" });
                        } catch (e: any) {
                          alert(e.response?.data?.error || "Failed to delete");
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

          {/* BOOKINGS */}
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            Recent Bookings
          </h2>

          {bookings.length === 0 && (
            <Card variant="glass" className="p-8 text-center">
              <p className="text-muted-foreground">No bookings yet</p>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <Card key={b.id} variant="glass">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{b.turf_name}</h3>
                    <Badge
                      variant={
                        b.status === "confirmed" ? "success" : "secondary"
                      }
                    >
                      {b.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {b.player_name || "Guest"}
                  </div>

                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {b.slot_time || "N/A"}
                  </div>

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

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
