import { MapPin, ChevronLeft, ChevronRight, Phone, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Slot = {
  id: number | string;
  is_available?: boolean;
  start_time?: string;
  end_time?: string;
  price?: number;
};

type Turf = {
  name?: string;
  location?: string;
  description?: string;
  images?: string;
  facilities?: string;
  price_per_slot?: number;
  owner_id?: string;
};

type ToastConfig = {
  title: string;
  description: string;
  variant?: "default" | "destructive" | "success";
};

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const TurfDetailPage = () => {
  // Mock params and navigation since we don't have react-router-dom
  const id = "1";
  const navigate = (path: string) => console.log("Navigate to:", path);
  
  const [turf, setTurf] = useState<Turf | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const role = "player"; // localStorage.getItem("role");
  const playerId = "123"; // localStorage.getItem("user_id");
  const userName = "Demo User"; // localStorage.getItem("name") || "User";
  const userEmail = "demo@example.com"; // localStorage.getItem("email") || "";

  const showToast = (config: ToastConfig) => {
    setToast(config);
    setTimeout(() => setToast(null), 4000);
  };

  const getToastStyles = () => {
    if (!toast) return "";
    switch (toast.variant) {
      case "destructive":
        return "bg-red-600 text-white border-red-700";
      case "success":
        return "bg-green-600 text-white border-green-700";
      default:
        return "bg-slate-800 text-white border-slate-700";
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  const handleBooking = async () => {
    if (role !== "player") {
      showToast({
        title: "Access Denied",
        description: "Only players can book slots",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSlot) {
      showToast({
        title: "Select a Slot",
        description: "Please choose a time slot to continue",
        variant: "destructive"
      });
      return;
    }

    try {
      setBookingLoading(true);
      
      // Demo: Show success after 1 second
      setTimeout(() => {
        showToast({
          title: "Booking Confirmed!",
          description: "Your payment was successful",
          variant: "success"
        });
        setBookingLoading(false);
        setTimeout(() => navigate("/player/dashboard"), 1500);
      }, 1000);
    } catch (err: any) {
      console.error("Booking error:", err);
      showToast({
        title: "Booking Failed",
        description: "Failed to initiate booking",
        variant: "destructive"
      });
      setBookingLoading(false);
    }
  };

  const handlePayLater = async () => {
    if (role !== "player") {
      showToast({
        title: "Access Denied",
        description: "Only players can book slots",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSlot) {
      showToast({
        title: "Select a Slot",
        description: "Please choose a time slot to continue",
        variant: "destructive"
      });
      return;
    }

    try {
      setBookingLoading(true);
      setTimeout(() => {
        showToast({
          title: "Booking Confirmed!",
          description: "You can pay at the venue.",
          variant: "success"
        });
        setBookingLoading(false);
        setTimeout(() => navigate("/player/dashboard"), 1500);
      }, 1000);
    } catch (err: any) {
      showToast({
        title: "Booking Failed",
        description: "Booking failed",
        variant: "destructive"
      });
      setBookingLoading(false);
    }
  };

  const handleMessageOwner = () => {
    if (!playerId) {
      showToast({
        title: "Login Required",
        description: "Please login to message the owner",
        variant: "destructive"
      });
      return;
    }

    showToast({
      title: "Opening Chat",
      description: "Redirecting to messages...",
      variant: "success"
    });
    setTimeout(() => navigate("/chat"), 1000);
  };

  const handleCallOwner = () => {
    const phoneNumber = turf?.owner_id;
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      showToast({
        title: "Unavailable",
        description: "Phone number not available",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTurf({
        name: "Elite Sports Arena",
        location: "Sector 21, Ahmedabad",
        description: "Premium football turf with state-of-the-art facilities. Perfect for tournaments and casual matches.",
        images: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800,https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800,https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
        facilities: "Floodlights, Parking, Changing Rooms, First Aid, Water",
        price_per_slot: 1500,
        owner_id: "+91-9876543210"
      });

      setSlots([
        { id: 1, is_available: true, start_time: "06:00", end_time: "07:30", price: 1200 },
        { id: 2, is_available: true, start_time: "07:30", end_time: "09:00", price: 1500 },
        { id: 3, is_available: false, start_time: "09:00", end_time: "10:30", price: 1500 },
        { id: 4, is_available: true, start_time: "10:30", end_time: "12:00", price: 1800 },
        { id: 5, is_available: true, start_time: "16:00", end_time: "17:30", price: 2000 },
        { id: 6, is_available: true, start_time: "17:30", end_time: "19:00", price: 2500 },
        { id: 7, is_available: false, start_time: "19:00", end_time: "20:30", price: 2500 },
        { id: 8, is_available: true, start_time: "20:30", end_time: "22:00", price: 2200 }
      ]);

      setLoading(false);
    }, 800);
  }, [id]);

  const images = turf?.images ? turf.images.split(",").map(img => img.trim()) : [];
  const selectedSlotData = slots.find((s) => Number(s.id) === selectedSlot);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Turf Details...</p>
        </div>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Turf Not Found</h1>
          <p className="text-slate-300 mb-6">The turf you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-2xl max-w-sm animate-in slide-in-from-top ${getToastStyles()}`}>
          <div className="flex items-start gap-3">
            {toast.variant === "success" && <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
            TurfBook
          </button>
          {role === "player" && (
            <button onClick={() => navigate("/player/dashboard")} className="text-sm text-blue-400 hover:text-blue-300">
              My Bookings
            </button>
          )}
        </div>
      </nav>

      {/* Hero Image Gallery */}
      <div className="relative h-96 overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[currentImage]}
            alt={turf.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600?text=Turf+Image";
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
            No Images Available
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

        <div className="absolute bottom-6 left-6 text-white z-10">
          <h1 className="text-4xl font-bold mb-2">{turf.name || "Unnamed Turf"}</h1>
          <p className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {turf.location || "Location not specified"}
          </p>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-6 right-6 flex gap-2 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImage ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">About this Turf</h2>
              <p className="text-slate-300 leading-relaxed">{turf.description || "No description provided."}</p>

              {turf.facilities && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {turf.facilities.split(",").map((facility, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full text-sm"
                      >
                        {facility.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slots Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Available Slots</h2>

              {slots.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No slots available for this turf</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const slotId = Number(slot.id);
                    const isSelected = selectedSlot === slotId;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => slot.is_available && setSelectedSlot(slotId)}
                        disabled={!slot.is_available}
                        className={`relative p-3 rounded-xl border text-center transition-all duration-200 ${
                          !slot.is_available
                            ? "bg-slate-800/50 text-slate-500 opacity-50 cursor-not-allowed border-slate-700"
                            : isSelected
                            ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 scale-105 ring-2 ring-blue-400/30"
                            : "bg-slate-800 hover:bg-slate-700 hover:border-blue-500/50 border-slate-700 text-white hover:scale-105"
                        }`}
                      >
                        <div className="text-xs font-medium mb-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <div className="text-sm font-bold">₹{slot.price}</div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Booking Summary</h2>

              {/* Price Display */}
              <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                <p className="text-slate-400 text-sm mb-1">
                  {selectedSlotData ? "Selected Slot Price" : "Price per Slot"}
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹{selectedSlotData?.price || turf.price_per_slot || 0}
                </p>
                {selectedSlotData && (
                  <p className="text-blue-400 text-sm mt-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {selectedSlotData.start_time} - {selectedSlotData.end_time}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Booking Buttons */}
                <button
                  onClick={handlePayLater}
                  disabled={!selectedSlot || bookingLoading}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Later
                </button>

                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || bookingLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {bookingLoading ? (
                    "⏳ Processing..."
                  ) : selectedSlot ? (
                    `Pay ₹${selectedSlotData?.price || 0}`
                  ) : (
                    "Select Slot"
                  )}
                </button>

                {/* Contact Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={handleCallOwner}
                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                  <button
                    onClick={handleMessageOwner}
                    className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-slate-500 text-center mt-6">
                By booking, you agree to our{" "}
                <button className="text-blue-400 hover:underline">cancellation policy</button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          © {new Date().getFullYear()} TurfBook. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default TurfDetailPage;