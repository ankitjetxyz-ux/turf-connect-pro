import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Wifi, 
  Car, 
  Coffee, 
  ShowerHead,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Phone,
  MessageCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getToken } from "@/utils/auth";

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

interface Facility {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface TurfData {
  id: string;
  name: string;
  location: string;
  description: string;
  images: string[];
  rating: number;
  reviews: number;
  price: number;
  sports: string[];
  facilities: Facility[];
  openHours: string;
  size: string;
  surface: string;
}

const turfData: TurfData = {
  id: "1",
  name: "Green Arena Sports Complex",
  location: "123 Sports Lane, Andheri West, Mumbai 400058",
  description: "Green Arena is a premium sports facility featuring state-of-the-art artificial turf, professional lighting, and world-class amenities. Perfect for football, cricket, and more.",
  images: [
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200",
  ],
  rating: 4.8,
  reviews: 245,
  price: 1200,
  sports: ["Football", "Cricket", "Badminton", "Tennis"],
  facilities: [
    { icon: Wifi, label: "Free WiFi" },
    { icon: Car, label: "Parking" },
    { icon: Coffee, label: "Cafeteria" },
    { icon: ShowerHead, label: "Showers" },
  ],
  openHours: "6:00 AM - 11:00 PM",
  size: "100 x 60 meters",
  surface: "FIFA Approved Artificial Turf",
};

const timeSlots: TimeSlot[] = [
  { time: "6:00 AM", available: true, price: 800 },
  { time: "7:00 AM", available: true, price: 800 },
  { time: "8:00 AM", available: false, price: 1000 },
  { time: "9:00 AM", available: true, price: 1000 },
  { time: "10:00 AM", available: true, price: 1200 },
  { time: "11:00 AM", available: true, price: 1200 },
  { time: "4:00 PM", available: false, price: 1200 },
  { time: "5:00 PM", available: true, price: 1500 },
  { time: "6:00 PM", available: true, price: 1500 },
  { time: "7:00 PM", available: false, price: 1500 },
  { time: "8:00 PM", available: true, price: 1200 },
  { time: "9:00 PM", available: true, price: 1000 },
];

const TurfDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % turfData.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + turfData.images.length) % turfData.images.length);
  };

  const handleBooking = async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }

    if (!selectedSlot) {
      setBookingError("Please select a time slot");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      // Call booking API here
      // await bookSlot({ ...selectedSlot, turf_id: id });
      // For now, just show success message
      alert("Booking confirmed! Check your bookings page for details.");
      setSelectedSlot(null);
    } catch (error: any) {
      setBookingError(error.response?.data?.error || "Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Generate next 7 days for date selection
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-12">
        {/* Image Gallery */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={turfData.images[currentImage]}
            alt={turfData.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-effect flex items-center justify-center text-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-effect flex items-center justify-center text-foreground hover:text-primary transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {turfData.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentImage ? "w-8 bg-primary" : "bg-foreground/50"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="w-10 h-10 rounded-full glass-effect flex items-center justify-center text-foreground hover:text-destructive transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full glass-effect flex items-center justify-center text-foreground hover:text-primary transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </section>

        <div className="container px-4 -mt-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <Badge variant="featured" className="mb-2">Featured</Badge>
                      <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                        {turfData.name}
                      </h1>
                      <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{turfData.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-heading font-bold text-primary">{turfData.rating}</span>
                      <span className="text-muted-foreground text-sm">({turfData.reviews} reviews)</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">{turfData.description}</p>

                  {/* Sports Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {turfData.sports.map((sport) => (
                      <Badge key={sport} variant="secondary">{sport}</Badge>
                    ))}
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Open Hours</div>
                      <div className="text-sm font-semibold text-foreground">{turfData.openHours}</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Size</div>
                      <div className="text-sm font-semibold text-foreground">{turfData.size}</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center col-span-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Surface</div>
                      <div className="text-sm font-semibold text-foreground">{turfData.surface}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facilities */}
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Facilities & Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {turfData.facilities.map((facility) => (
                      <div
                        key={facility.label}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                          <facility.icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{facility.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Date Selection */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {dates.map((date, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center min-w-[70px] p-3 rounded-xl transition-all ${
                          selectedDate.toDateString() === date.toDateString()
                            ? "gradient-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-lg font-bold">{date.getDate()}</span>
                        <span className="text-xs">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Time Slots Grid */}
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-3 rounded-lg text-center transition-all ${
                          !slot.available
                            ? "bg-secondary/30 text-muted-foreground cursor-not-allowed line-through"
                            : selectedSlot === slot.time
                            ? "gradient-primary text-primary-foreground shadow-glow"
                            : "bg-secondary text-foreground hover:border-primary border border-transparent"
                        }`}
                      >
                        <div className="text-sm font-semibold">{slot.time}</div>
                        <div className="text-xs mt-1">₹{slot.price}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <Card variant="featured" className="sticky top-24">
                <CardHeader>
                  <CardTitle>Book This Turf</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <div className="text-muted-foreground text-sm">Starting from</div>
                    <div className="font-heading text-3xl font-bold text-primary">
                      ₹{turfData.price}
                      <span className="text-muted-foreground text-sm font-normal">/hr</span>
                    </div>
                  </div>

                  {/* Selected Slot */}
                  {selectedSlot && (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                      <div className="text-sm text-muted-foreground mb-1">Selected Slot</div>
                      <div className="font-heading font-bold text-foreground">
                        {selectedDate.toLocaleDateString("en-US", { 
                          weekday: "long",
                          month: "long",
                          day: "numeric"
                        })}
                      </div>
                      <div className="text-primary font-semibold">{selectedSlot}</div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button variant="hero" size="xl" className="w-full" disabled={!selectedSlot}>
                    {selectedSlot ? "Proceed to Book" : "Select a Time Slot"}
                  </Button>

                  {/* Contact Options */}
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    {[
                      "Instant Confirmation",
                      "Free Cancellation (24hrs)",
                      "Secure Payment",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {item}
                      </div>
                    ))}
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
