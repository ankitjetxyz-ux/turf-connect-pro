import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  Clock,
  CheckCircle,
  MessageCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ---------------- TYPES ---------------- */

type Slot = {
  id: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
  price: number;
};

type Turf = {
  name: string;
  location: string;
  description: string;
  images: string;
  facilities: string;
  price_per_slot: number;
  owner_phone: string;
};

type ToastConfig = {
  title: string;
  description: string;
  variant?: "default" | "destructive" | "success";
};

/* ---------------- RAZORPAY LOADER ---------------- */

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

/* ---------------- COMPONENT ---------------- */

const TurfDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH ---------------- */

  const role = localStorage.getItem("role");
  const playerId = localStorage.getItem("user_id");

  /* ---------------- TOAST ---------------- */

  const showToast = (config: ToastConfig) => {
    setToast(config);
    setTimeout(() => setToast(null), 4000);
  };

  const toastClass =
    toast?.variant === "success"
      ? "bg-green-600"
      : toast?.variant === "destructive"
      ? "bg-red-600"
      : "bg-slate-800";

  /* ---------------- BOOKING ---------------- */

  const handleBooking = async () => {
    if (role !== "player") {
      showToast({
        title: "Access Denied",
        description: "Only players can book slots",
        variant: "destructive"
      });
      return;
    }

    if (selectedSlot === null) {
      showToast({
        title: "Select Slot",
        description: "Please select a slot",
        variant: "destructive"
      });
      return;
    }

    const slotData = slots.find((s) => s.id === selectedSlot);
    if (!slotData || !slotData.is_available) {
      showToast({
        title: "Slot Unavailable",
        description: "This slot is already booked",
        variant: "destructive"
      });
      return;
    }

    setBookingLoading(true);

    const razorLoaded = await loadRazorpay();
    if (!razorLoaded) {
      showToast({
        title: "Payment Error",
        description: "Razorpay failed to load",
        variant: "destructive"
      });
      setBookingLoading(false);
      return;
    }

    setTimeout(() => {
      showToast({
        title: "Booking Successful",
        description: "Payment completed",
        variant: "success"
      });
      setBookingLoading(false);
      navigate("/player/dashboard");
    }, 1000);
  };

  /* ---------------- CONTACT ---------------- */

  const handleCallOwner = () => {
    if (!turf?.owner_phone) {
      showToast({
        title: "Unavailable",
        description: "Owner phone not available",
        variant: "destructive"
      });
      return;
    }
    window.open(`tel:${turf.owner_phone}`, "_self");
  };

  const handleMessageOwner = () => {
    if (!playerId) {
      showToast({
        title: "Login Required",
        description: "Please login first",
        variant: "destructive"
      });
      return;
    }
    navigate("/chat");
  };

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    setTimeout(() => {
      setTurf({
        name: "Elite Sports Arena",
        location: "Ahmedabad",
        description: "Premium football turf",
        images:
          "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800,https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
        facilities: "Parking, Floodlights, Water",
        price_per_slot: 1500,
        owner_phone: "+919876543210"
      });

      setSlots([
        { id: 1, is_available: true, start_time: "06:00", end_time: "07:30", price: 1200 },
        { id: 2, is_available: false, start_time: "07:30", end_time: "09:00", price: 1500 },
        { id: 3, is_available: true, start_time: "09:00", end_time: "10:30", price: 1800 }
      ]);

      setLoading(false);
    }, 700);
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!turf) {
    return <div className="min-h-screen flex items-center justify-center text-white">Turf not found</div>;
  }

  const images = turf.images.split(",");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded ${toastClass}`}>
          <b>{toast.title}</b>
          <p>{toast.description}</p>
        </div>
      )}

      <div className="relative h-80">
        <img src={images[currentImage]} className="w-full h-full object-cover" />
        <button onClick={() => setCurrentImage((p) => (p ? p - 1 : images.length - 1))} className="absolute left-4 top-1/2">
          <ChevronLeft />
        </button>
        <button onClick={() => setCurrentImage((p) => (p + 1) % images.length)} className="absolute right-4 top-1/2">
          <ChevronRight />
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold">{turf.name}</h1>
        <p className="flex gap-2 text-slate-400 mt-2">
          <MapPin /> {turf.location}
        </p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {slots.map((slot) => (
            <button
              key={slot.id}
              disabled={!slot.is_available}
              onClick={() => setSelectedSlot(slot.id)}
              className={`p-4 rounded border ${
                selectedSlot === slot.id ? "bg-blue-600" : "bg-slate-800"
              }`}
            >
              <Clock /> {slot.start_time} - {slot.end_time}
              <p>₹{slot.price}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleBooking}
          disabled={bookingLoading}
          className="mt-6 w-full bg-blue-600 p-3 rounded"
        >
          {bookingLoading ? "Processing..." : "Book Now"}
        </button>

        <div className="flex gap-4 mt-4">
          <button onClick={handleCallOwner} className="bg-green-600 p-2 rounded flex gap-2">
            <Phone /> Call
          </button>
          <button onClick={handleMessageOwner} className="bg-purple-600 p-2 rounded flex gap-2">
            <MessageCircle /> Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurfDetailPage;
