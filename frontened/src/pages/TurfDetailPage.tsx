import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";

const TurfDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
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
      alert("Only players can book slots");
      return;
    }

    if (!selectedSlot) {
      alert("Please select a slot");
      return;
    }

    try {
      setBookingLoading(true);

      await api.post("/bookings/book", {
        slot_id: selectedSlot,
      });

      alert("✅ Booking confirmed! Redirecting to dashboard...");
      navigate("/player/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.error || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        {/* IMAGE GALLERY */}
        <section className="relative h-[50vh] overflow-hidden">
          {images.length > 0 && (
            <img
              src={images[currentImage]}
              alt={turf.name}
              className="w-full h-full object-cover"
            />
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </section>

        <div className="container px-4 -mt-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h1 className="text-3xl font-bold">{turf.name}</h1>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {turf.location}
                  </div>

                  <p className="text-muted-foreground">{turf.description}</p>

                  <div className="flex gap-2 flex-wrap">
                    {turf.facilities?.split(",").map((f: string) => (
                      <span
                        key={f}
                        className="px-3 py-1 bg-secondary rounded-full text-sm"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* SLOTS */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Slots</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        disabled={!slot.is_available}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`p-3 rounded-lg border text-center transition ${
                          !slot.is_available
                            ? "opacity-40 cursor-not-allowed"
                            : selectedSlot === slot.id
                            ? "bg-primary text-white"
                            : "bg-secondary"
                        }`}
                      >
                        <div className="font-semibold">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <div className="text-sm">₹{slot.price}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Book This Turf</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center text-2xl font-bold">
                    ₹{turf.price_per_slot} / slot
                  </div>

                  <Button
                    className="w-full"
                    disabled={!selectedSlot || bookingLoading}
                    onClick={handleBooking}
                  >
                    {bookingLoading
                      ? "Booking..."
                      : selectedSlot
                      ? "Proceed to Book"
                      : "Select a Slot"}
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
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
