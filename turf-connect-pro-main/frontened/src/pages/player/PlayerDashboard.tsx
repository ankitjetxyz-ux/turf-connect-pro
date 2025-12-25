import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, XCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const PlayerDashboard = () => {
  type Booking = { id: number | string; turf_name?: string; location?: string; slot_time?: string; status?: string; turf_owner_name?: string; turf_owner_email?: string };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  type Conversation = { id: string; owner_id: string; player_id: string; last_message?: string; updated_at?: string };
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    try {
      const res = await api.get(`/chat/conversations/${userId}`);
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
      alert("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    loadConversations();
  }, []);

  const cancelBooking = async (bookingId: number | string) => {
    if (!bookingId) {
      console.error("Invalid booking ID");
      return;
    }
    
    if (!confirm("Cancel this booking?")) return;

    try {
      console.log("Cancelling booking:", bookingId);
      await api.post("/bookings/cancel", { booking_id: bookingId });
      
      // Optimistic update: Update status locally to "cancelled_by_user"
      setBookings((prev) => 
        prev.map((b) => 
          String(b.id) === String(bookingId) ? { ...b, status: "cancelled_by_user" } : b
        )
      );

      // Optional: Refresh after a short delay to ensure DB consistency
      setTimeout(() => fetchBookings(), 1000);
      
      alert("Booking cancelled successfully");
    } catch (err: any) {
      console.error("Cancellation failed", err);
      const msg = err.response?.data?.error || "Cancellation failed";
      alert(msg);
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
                        className={`capitalize border-0 ${
                          booking.status === "confirmed"
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
                    <div className="p-4 bg-secondary/30">
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
