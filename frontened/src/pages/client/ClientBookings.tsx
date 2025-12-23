import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const ClientBookings = () => {
  type Booking = { id: string | number; turf_name?: string; player_name?: string; slot_time?: string; status?: string };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      const res = await api.get("/bookings/client");
      setBookings(res.data);
    };
    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container px-4">
          <h1 className="text-3xl font-bold mb-6">Bookings on My Turfs</h1>

          {bookings.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No bookings yet</p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">{b.turf_name}</h3>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    {b.player_name}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {b.slot_time}
                  </div>

                  <Badge>{b.status}</Badge>
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

export default ClientBookings;
