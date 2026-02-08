import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock, MessageSquare, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Booking } from "@/types";

const ClientBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings/client");
      const bookingData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setBookings(bookingData);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleChat = async (playerId: string) => {
    if (!playerId) return;
    try {
      const ownerId = localStorage.getItem("user_id");
      // Backend will either return an existing chat or create a new one
      const res = await api.post("/chat/create", {
        owner_id: ownerId,
        player_id: playerId
      });
      if (res.data && res.data.id) {
        navigate(`/chat?chat=${res.data.id}`);
      }
    } catch (err) {
      console.error("Failed to start chat", err);
      toast({ title: "Error", description: "Failed to start chat", variant: "destructive" });
    }
  };

  const handleCancel = async (bookingId: string | number) => {
    if (!confirm("Are you sure you want to cancel this booking? This will refund the user.")) return;

    try {
      await api.post("/bookings/owner-cancel", { booking_id: bookingId });
      toast({ title: "Success", description: "Booking cancelled", variant: "default" });

      // Instantly remove from UI
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err: unknown) {
      console.error("Cancel failed", err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to cancel booking";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="pt-24 pb-12 flex-1">
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

                  {b.verification_code && b.status === "booked" && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg mb-3">
                      <div className="text-xs text-muted-foreground mb-1">Verification Code</div>
                      <div className="text-xl font-mono font-bold text-primary tracking-wider text-center">
                        {b.verification_code}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        Player should show this code
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Badge>{b.status}</Badge>

                    <div className="flex gap-2">
                      {b.player_id && (
                        <Button size="sm" variant="outline" onClick={() => handleChat(b.player_id!)}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      {b.status === "booked" && (
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(b.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
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

export default ClientBookings;
