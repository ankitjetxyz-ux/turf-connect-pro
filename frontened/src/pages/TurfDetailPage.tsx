import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  Clock,
  CheckCircle,
  CreditCard
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

type Slot = { id: number | string; is_available?: boolean; start_time?: string; end_time?: string; price?: number };
type Turf = { name?: string; location?: string; description?: string; images?: string; facilities?: string; price_per_slot?: number; owner_id?: string; owner?: string; ownerId?: string };

const TurfDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const role = localStorage.getItem("role");

  /* =========================
     FETCH TURF + SLOTS
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const turfRes = await api.get(`/turfs/${id}`);
        const slotRes = await api.get(`/slots/${id}`);

        setTurf(turfRes.data);
        setSlots(slotRes.data);
      } catch {
        alert("Failed to load turf");
      }
    };

    fetchData();
  }, [id]);

  if (!turf) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        <div className="animate-pulse flex flex-col items-center gap-2">
           <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
           Loading Turf Details...
        </div>
      </div>
    );
  }

  const images = turf.images ? turf.images.split(",") : [];

  const nextImage = () =>
    setCurrentImage((prev) => (prev + 1) % images.length);

  const prevImage = () =>
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  /* =========================
     BOOK SLOT
  ========================= */
  const handleBooking = async () => {
    if (role !== "player") {
      toast({ title: "Access Denied", description: "Only players can book slots", variant: "destructive" });
      return;
    }

    if (!selectedSlot) {
      toast({ title: "Selection Required", description: "Please select a slot", variant: "destructive" });
      return;
    }

    try {
      setBookingLoading(true);

      // create pending booking and get order
      const res = await api.post("/bookings/create-and-order", { slot_id: selectedSlot });
      const { booking_id, order, key_id } = res.data;

      // load razorpay script
      await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => reject(new Error("Razorpay script load failed"));
        document.body.appendChild(s);
      });

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: turf.name,
        description: `Booking for ${turf.name}`,
        order_id: order.id,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id,
            });

            toast({
              title: "Payment Successful",
              description: "Booking confirmed! Redirecting to dashboard...",
              className: "bg-green-600 text-white border-none"
            });
            navigate("/player/dashboard");
          } catch (e) {
            console.error(e);
            toast({ title: "Payment Failed", description: "Payment verification failed", variant: "destructive" });
          }
        },
        prefill: {
          name: localStorage.getItem("name") || "",
          email: localStorage.getItem("email") || "",
        },
        theme: { color: "#22c55e" }, // Green theme for payment
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Booking failed";
      toast({ title: "Booking Failed", description: message, variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMessageOwner = async () => {
    const playerId = localStorage.getItem("user_id");
    if (!playerId) {
      toast({ title: "Login Required", description: "Please login to message the owner", variant: "destructive" });
      return;
    }
    const ownerId = turf.owner_id || turf.owner || turf.ownerId;
    if (!ownerId) {
      toast({ title: "Error", description: "Owner information not available", variant: "destructive" });
      return;
    }
    
    try {
      // API expects owner_id (we use schema aligned key now)
      const resp = await api.post("/chat/create", { owner_id: ownerId, player_id: playerId });
      const chat = resp.data;
      navigate(`/chat?chat=${chat.id}`);
    } catch(e: any) {
      console.error(e);
      // Backend returns specific error if booking not found
      const msg = e.response?.data?.error || "Could not start chat";
      toast({ title: "Chat Unavailable", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-12 animate-in fade-in duration-700">
        {/* IMAGE GALLERY HERO */}
        <section className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] overflow-hidden group">
          {images.length > 0 ? (
            <img
              src={images[currentImage]}
              alt={turf.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
             <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                No Images Available
             </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 container mx-auto">
             <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 drop-shadow-lg">{turf.name}</h1>
             <div className="flex items-center gap-2 text-muted-foreground text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                {turf.location}
             </div>
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </section>

        <div className="container mx-auto px-4 -mt-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              {/* DESCRIPTION CARD */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold border-b border-border pb-2">About this Turf</h2>
                  <p className="text-muted-foreground leading-relaxed">{turf.description || "No description provided."}</p>

                  <div className="pt-4">
                    <h3 className="font-medium mb-3">Facilities</h3>
                    <div className="flex gap-2 flex-wrap">
                      {turf.facilities?.split(",").map((f: string) => (
                        <span
                          key={f}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {f.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SLOTS SELECTION */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Available Slots
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {slots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No slots available for booking.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {slots.map((slot) => (
                        <button
                            key={slot.id}
                            disabled={!slot.is_available}
                            onClick={() => setSelectedSlot(Number(slot.id))}
                            className={`relative p-3 rounded-xl border text-center transition-all duration-200 group ${
                            !slot.is_available
                                ? "bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed border-transparent"
                                : selectedSlot === Number(slot.id)
                                ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105 ring-2 ring-primary/20"
                                : "bg-card hover:bg-accent hover:border-primary/50 border-border"
                            }`}
                        >
                            <div className="font-semibold text-sm sm:text-base">
                            {slot.start_time} - {slot.end_time}
                            </div>
                            <div className="text-xs opacity-80 mt-1">₹{slot.price}</div>
                            {selectedSlot === Number(slot.id) && (
                                <div className="absolute -top-2 -right-2 bg-background text-primary rounded-full p-0.5 shadow-sm">
                                    <CheckCircle className="w-4 h-4 fill-current" />
                                </div>
                            )}
                        </button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDEBAR (BOOKING ACTION) */}
            <div className="lg:pl-4">
              <Card className="sticky top-24 bg-card/90 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600"></div>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Price per Slot</div>
                    <div className="text-3xl font-bold text-primary">
                      ₹{turf.price_per_slot}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 py-6 text-lg font-semibold border-white/10 hover:bg-white/5 hover:text-primary transition-all"
                        onClick={handlePayLater}
                        disabled={!selectedSlot || bookingLoading}
                      >
                        Pay Later
                      </Button>
                      <Button
                        className="flex-1 py-6 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all gradient-primary border-0"
                        disabled={!selectedSlot || bookingLoading}
                        onClick={handleBooking}
                      >
                        {bookingLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin">⏳</span> Processing...
                            </span>
                        ) : selectedSlot ? (
                            `Pay ₹${slots.find((s) => s.id === selectedSlot)?.price}`
                        ) : (
                            "Select a Slot"
                        )}
                      </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-border/60 hover:bg-accent" onClick={() => window.open(`tel:${turf.owner_id}`)}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                        </Button>
                        <Button
                        variant="ghost"
                        className="flex-1 hover:bg-accent"
                        onClick={handleMessageOwner}
                        >
                        Message Owner
                        </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-center text-muted-foreground">
                    By booking, you agree to our <span className="underline cursor-pointer hover:text-primary">cancellation policy</span>.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TurfDetailPage;


