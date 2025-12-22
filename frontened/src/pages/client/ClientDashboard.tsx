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
  MessageCircle,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const ClientDashboard = () => {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 relative">
        <div className="container px-4 relative z-10">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Client Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage turfs, slots & bookings
              </p>
            </div>

            <Button
              variant="hero"
              onClick={() => navigate("/client/add-turf")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Turf
            </Button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <Card variant="glass" className="glass-card">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  {turfs.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Turfs
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  {bookings.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Bookings
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="glass-card">
              <CardContent className="p-5 text-center">
                <div className="text-3xl font-bold text-primary">
                  Active
                </div>
                <div className="text-sm text-muted-foreground">
                  Business Status
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MY TURFS */}
          <h2 className="text-xl font-heading font-semibold mb-4">
            My Turfs
          </h2>

          {!loading && turfs.length === 0 && (
            <Card variant="glass" className="glass-card p-10 text-center mb-10">
              <Building2 className="w-14 h-14 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven’t added any turfs yet
              </p>
              <Button
                variant="hero"
                onClick={() => navigate("/client/add-turf")}
              >
                Add Turf
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {turfs.map((turf) => (
              <Card
                key={turf.id}
                variant="interactive"
                className="glass-card hover-lift"
              >
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-heading font-bold text-lg">
                    {turf.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {turf.location}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {turf.facilities?.split(",").map((f: string) => (
                      <Badge key={f} variant="secondary">
                        {f}
                      </Badge>
                    ))}
                  </div>

                  <div className="font-semibold">
                    ₹{turf.price_per_slot} / slot
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
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
          <h2 className="text-xl font-heading font-semibold mb-4">
            Recent Bookings
          </h2>

          {bookings.length === 0 && (
            <Card variant="glass" className="glass-card p-6 text-center">
              <p className="text-muted-foreground">
                No bookings yet
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <Card key={b.id} className="glass-card hover-lift">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold">{b.turf_name}</h3>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    {b.player_name}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {b.slot_time}
                  </div>

                  <Badge variant="success">{b.status}</Badge>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/chat/${b.id}`)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Player
                  </Button>
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
