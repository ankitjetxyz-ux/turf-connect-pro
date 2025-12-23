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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const ClientDashboard = () => {
  type TurfItem = { id: number | string; name?: string; location?: string; facilities?: string; price_per_slot?: number };
  type Booking = { id: number | string; turf_name?: string; player_name?: string; slot_time?: string; status?: string };

  const [turfs, setTurfs] = useState<TurfItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [turfsRes, bookingsRes] = await Promise.all([
        api.get("/turfs/my"),
        api.get("/bookings/client"),
      ]);

      setTurfs(turfsRes.data);
      setBookings(bookingsRes.data);
    } catch {
      alert("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="pt-24 pb-12 relative z-10">
        <div className="container px-4">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Client Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your turfs, slots & bookings
              </p>
            </div>

            <Button
              className="gradient-primary shadow-glow hover:shadow-glow-lg transition-all"
              onClick={() => navigate("/client/add-turf")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Turf
            </Button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <Card variant="glass" className="glass-card hover-lift border-white/10 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {turfs.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Turfs
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card hover-lift border-white/10 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {bookings.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Bookings
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card hover-lift border-white/10 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  Active
                </div>
                <div className="text-sm text-muted-foreground">
                  Business Status
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MY TURFS */}
          <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <span className="w-1 h-6 bg-primary rounded-full" />
            My Turfs
          </h2>

          {!loading && turfs.length === 0 && (
            <Card variant="glass" className="glass-card border-white/10 p-12 text-center mb-10 animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Turfs Added</h3>
              <p className="text-muted-foreground mb-6">
                You haven’t added any turfs yet. Start by listing your first turf.
              </p>
              <Button
                className="gradient-primary"
                onClick={() => navigate("/client/add-turf")}
              >
                Add Turf
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {turfs.map((turf, i) => (
              <Card
                key={turf.id}
                variant="glass"
                className="glass-card hover-lift border-white/10 animate-slide-up"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-heading font-bold text-lg line-clamp-1">
                      {turf.name}
                    </h3>
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">Active</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="truncate">{turf.location}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {turf.facilities?.split(",").slice(0, 3).map((f: string) => (
                      <Badge key={f} variant="secondary" className="bg-secondary/50 text-xs">
                        {f.trim()}
                      </Badge>
                    ))}
                    {turf.facilities && turf.facilities.split(",").length > 3 && (
                       <Badge variant="secondary" className="bg-secondary/50 text-xs">+{turf.facilities.split(",").length - 3}</Badge>
                    )}
                  </div>

                  <div className="font-semibold text-primary">
                    ₹{turf.price_per_slot} <span className="text-muted-foreground text-sm font-normal">/ slot</span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5"
                    onClick={() =>
                      navigate(`/client/turfs/${turf.id}/slots`)
                    }
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Manage Slots
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* BOOKINGS */}
          <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2 animate-fade-in">
             <span className="w-1 h-6 bg-primary rounded-full" />
             Recent Bookings
          </h2>

          {bookings.length === 0 && (
            <Card variant="glass" className="glass-card border-white/10 p-8 text-center animate-slide-up">
              <p className="text-muted-foreground">
                No bookings yet
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b, i) => (
              <Card key={b.id} className="glass-card hover-lift border-white/10 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg line-clamp-1">{b.turf_name}</h3>
                    <Badge variant={b.status === "confirmed" ? "success" : "secondary"}>{b.status}</Badge>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4 text-primary" />
                      {b.player_name || "Guest User"}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      {b.slot_time ? new Date(b.slot_time).toLocaleString() : "N/A"}
                    </div>
                  </div>
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
