import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, XCircle, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const PlayerDashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings/my");
      setBookings(res.data);
    } catch {
      alert("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (bookingId: number) => {
    if (!confirm("Cancel this booking?")) return;

    try {
      await api.post("/bookings/cancel", { booking_id: bookingId });
      fetchBookings();
    } catch {
      alert("Cancellation failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container px-4">
          <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

          {loading && <p>Loading bookings...</p>}

          {!loading && bookings.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                You haven’t booked any turfs yet.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover-lift">
                <CardContent className="p-4 space-y-3">
                  {/* Turf Name */}
                  <h3 className="font-semibold text-lg">
                    {booking.turf_name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {booking.location}
                  </div>

                  {/* Slot Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {booking.slot_time}
                  </div>

                  {/* Status */}
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {booking.status}
                  </Badge>

                  {/* ACTION BUTTONS */}
                  {booking.status === "confirmed" && (
                    <div className="flex gap-2">
                      {/* CHAT BUTTON */}
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          navigate(`/chat/${booking.id}`)
                        }
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>

                      {/* CANCEL BUTTON */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
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
