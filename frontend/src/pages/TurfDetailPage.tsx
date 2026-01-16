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
  MessageCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTurfDetails } from "@/services/turfService";
import { getSlotsByTurf } from "@/services/slotService";
import { createBooking, verifyPayment } from "@/services/bookingService";
import { Turf, Slot, RazorpayResponse, RazorpayErrorResponse } from "@/types";
import api from "@/services/api";

/* TYPES */

type ToastConfig = {
  title: string;
  description: string;
  variant?: "default" | "destructive" | "success";
};

type TurfComment = {
  id: string;
  turf_id: string;
  user_id: string;
  comment: string;
  created_at?: string;
  users?: {
    id: string;
    name: string;
    profile_image_url?: string | null;
  };
};

/* RAZORPAY LOADER */

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as unknown as { Razorpay: unknown }).Razorpay) {
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

import { LucideIcon } from "lucide-react";

/* FACILITY ICONS MAP */

const facilityIconsMap: { [key: string]: LucideIcon } = {
  wifi: Wifi,
  parking: Car,
  cafeteria: Coffee,
  showers: ShowerHead,
  "free wifi": Wifi,
  "free parking": Car,
};

const getFacilityIcon = (facility: string): LucideIcon => {
  const key = facility.toLowerCase();
  return facilityIconsMap[key] || Wifi;
};

/* MAIN COMPONENT */

const TurfDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<Array<{ id: string; image_url: string }>>([]);
  const [testimonials, setTestimonials] = useState<Array<{ id: string; type: string; content?: string; video_url?: string; users?: { name: string; profile_image_url?: string } }>>([]);
  const [comments, setComments] = useState<TurfComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  /* AUTH */

  const role = localStorage.getItem("role");
  const playerId = localStorage.getItem("user_id");
  const userId = playerId;

  /* TOAST */

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

  /* SLOT AVAILABILITY */

  const isSlotAvailable = (slot: Slot): boolean => {
    if (typeof slot.is_booked === "boolean") {
      return slot.is_booked === false;
    }
    if (typeof slot.is_available === "boolean") {
      return slot.is_available === true;
    }
    return true;
  };

  const toggleSlotSelection = (slotId: number) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  /* BOOKING AND PAYMENT */

  const handleBooking = async () => {
    if (role !== "player") {
      showToast({
        title: "Access Denied",
        description: "Only players can book slots",
        variant: "destructive"
      });
      return;
    }

    if (selectedSlots.length === 0) {
      showToast({
        title: "Select Slot",
        description: "Please select at least one slot",
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

    try {
      const { data } = await createBooking(selectedSlots);

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Book My Turf",
        description: "Turf Booking",
        order_id: data.order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: data.booking_ids[0]
            });
            const verificationCodes = verifyRes.data?.verification_codes || [];
            const firstCode = verificationCodes[0]?.verification_code;

            if (firstCode) {
              showToast({
                title: "Success",
                description: `Booking Confirmed! Verification Code: ${firstCode}`,
                variant: "success"
              });
            } else {
              showToast({
                title: "Success",
                description: "Booking Confirmed!",
                variant: "success"
              });
            }
            setTimeout(() => {
              navigate("/player/dashboard");
            }, 2000);
          } catch (err) {
            console.error(err);
            showToast({
              title: "Error",
              description: "Payment verification failed",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: "Player",
          email: "player@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2563eb"
        }
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void; on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void } }).Razorpay;
      const rzp = new RazorpayConstructor(options);
      rzp.open();
      rzp.on('payment.failed', function (response: RazorpayErrorResponse) {
        showToast({
          title: "Failed",
          description: response.error.description,
          variant: "destructive"
        });
      });

    } catch (error: unknown) {
      console.error(error);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not initiate booking";
      showToast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  };

  /* CONTACT */

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

  const handleMessageOwner = async () => {
    if (!playerId) {
      showToast({
        title: "Login Required",
        description: "Please login first",
        variant: "destructive"
      });
      return;
    }

    if (!turf?.owner_id) {
      showToast({
        title: "Error",
        description: "Turf owner information not available",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create or retrieve conversation with the turf owner
      const { data } = await api.post("/chat/conversations", {
        owner_id: turf.owner_id,
        player_id: playerId
      });

      // Navigate to chat page with the conversation active
      navigate(`/chat?chat=${data.id}`);
    } catch (error: any) {
      let errorMessage = "Failed to start conversation. Please try again.";

      if (error.response) {
        // Server responded with an error status
        console.error("Server responded with error:", error.response.data);
        console.error("Status:", error.response.status);

        if (error.response.status === 400) {
          errorMessage = error.response.data?.error || "Invalid request. Please check your inputs.";
        } else if (error.response.status === 401) {
          errorMessage = "Please login again to continue.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to create this conversation.";
        } else if (error.response.status === 404) {
          errorMessage = "Chat service not found. Please contact support.";
        } else if (error.response.status >= 500) {
          errorMessage = `Server error (${error.response.status}). Please try again later.`;
        } else {
          errorMessage = error.response.data?.error || `Request failed with status ${error.response.status}`;
        }
      } else if (error.request) {
        // Request made but no response received
        console.error("No response received:", error.request);
        errorMessage = "Cannot reach server. Please check your internet connection.";
      } else {
        // Error setting up the request
        console.error("Error setting up request:", error.message);
        errorMessage = `Error: ${error.message}`;
      }

      console.error("Failed to create conversation:", error);
      showToast({
        title: "Chat Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  /* IMAGE NAVIGATION */

  const nextImage = () => {
    const images = Array.isArray(turf?.images)
      ? turf.images
      : typeof turf?.images === "string"
        ? turf.images.split(",")
        : [];
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = Array.isArray(turf?.images)
      ? turf.images
      : typeof turf?.images === "string"
        ? turf.images.split(",")
        : [];
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  /* FETCH DATA */

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [turfRes, galleryRes, testimonialsRes, commentsRes] = await Promise.all([
          getTurfDetails(id),
          api.get(`/turfs/${id}/gallery`).catch(() => ({ data: [] })),
          api.get(`/turfs/${id}/testimonials`).catch(() => ({ data: [] })),
          api.get(`/turfs/${id}/comments`).catch(() => ({ data: [] })),
        ]);
        setTurf(turfRes.data);
        setGallery(galleryRes.data || []);
        setTestimonials(testimonialsRes.data || []);
        setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      } catch (error) {
        console.error(error);
        showToast({
          title: "Error",
          description: "Failed to load turf details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  /* FETCH SLOTS WHEN DATE CHANGES */
  useEffect(() => {
    const fetchSlots = async () => {
      if (!id) return;
      try {
        const slotsRes = await getSlotsByTurf(id);
        const allSlots = slotsRes.data;

        // Filter slots by selected date
        // Filter slots by selected date using LOCAL date string to avoid timezone shifts
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const selectedDateStr = `${year}-${month}-${day}`;

        const filteredSlots = allSlots.filter((slot: Slot) => {
          if (slot.date) {
            // Check if slot date string matches directly (assuming DB returns YYYY-MM-DD)
            // If slot.date is ISO, convert to local YYYY-MM-DD
            const d = new Date(slot.date);
            const sYear = d.getFullYear();
            const sMonth = String(d.getMonth() + 1).padStart(2, '0');
            const sDay = String(d.getDate()).padStart(2, '0');
            const slotDateStr = `${sYear}-${sMonth}-${sDay}`;

            return slotDateStr === selectedDateStr;
          }
          return false;
        });

        setSlots(filteredSlots);
      } catch (error) {
        console.error(error);
        setSlots([]);
      }
    };
    fetchSlots();
  }, [id, selectedDate]);

  /* LOADING STATE */

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading turf details...</p>
        </div>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Turf Not Found</h2>
          <p className="text-muted-foreground mb-6">The turf you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/turfs")}>Browse Turfs</Button>
        </div>
      </div>
    );
  }

  if (turf.verification_status && turf.verification_status !== "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-12">
          <div className="container px-4">
            <div className="max-w-xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center space-y-4">
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    Turf not available for booking
                  </h2>
                  <p className="text-muted-foreground">
                    {turf.verification_status === "pending"
                      ? "This turf is currently pending approval by our team."
                      : "This turf has been rejected and is not available for public booking."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* DATA NORMALIZATION */

  const images = Array.isArray(turf.images)
    ? turf.images
    : typeof turf.images === "string"
      ? turf.images.split(",").map(img => img.trim())
      : ["https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200"];

  const facilitiesList = Array.isArray(turf.facilities)
    ? turf.facilities
    : typeof turf.facilities === "string"
      ? (Array.isArray(turf.facilities) ? turf.facilities : turf.facilities.split(",")).map(f => typeof f === "string" ? f.trim() : f)
      : ["WiFi", "Parking", "Cafeteria", "Showers"];

  const isOwner = !!userId && turf.owner_id === userId;

  const sportsList = Array.isArray(turf.sports)
    ? turf.sports
    : typeof turf.sports === "string"
      ? turf.sports.split(",").map(s => s.trim())
      : ["Football", "Cricket", "Badminton"];

  const totalAmount = selectedSlots.reduce((sum, slotId) => {
    const slot = slots.find(s => s.id === slotId);
    return sum + (slot ? Number(slot.price) : 0);
  }, 0);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {toast && (
        <div className={`fixed top-20 right-4 p-4 rounded-lg z-50 ${toastClass} text-white shadow-lg animate-slide-down`}>
          <b className="block mb-1">{toast.title}</b>
          <p className="text-sm">{toast.description}</p>
        </div>
      )}

      <main className="pt-20 pb-12">
        {/* Image Gallery */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img
            src={images[currentImage]}
            alt={turf.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {images.length > 1 && (
            <>
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
            </>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? "w-8 bg-primary" : "bg-foreground/50"
                    }`}
                />
              ))}
            </div>
          )}

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
                        {turf.name}
                      </h1>
                      <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{turf.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-heading font-bold text-primary">
                        {turf.rating || 4.8}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        ({turf.reviews || 245} reviews)
                      </span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">{turf.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {sportsList.map((sport) => (
                      <Badge key={sport} variant="secondary">{sport}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Open Hours</div>
                      <div className="text-sm font-semibold text-foreground">
                        {turf.open_hours || "6:00 AM - 11:00 PM"}
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Size</div>
                      <div className="text-sm font-semibold text-foreground">
                        {turf.size || "100 x 60 m"}
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center col-span-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xs text-muted-foreground">Surface</div>
                      <div className="text-sm font-semibold text-foreground">
                        {turf.surface || "Artificial Turf"}
                      </div>
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
                    {facilitiesList.map((facility) => {
                      const IconComponent = getFacilityIcon(facility);
                      return (
                        <div
                          key={facility}
                          className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{facility}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Gallery Section */}
              {gallery.length > 0 && (
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {gallery.map((item) => (
                        <div
                          key={item.id}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(item.image_url, '_blank')}
                        >
                          <img
                            src={item.image_url}
                            alt="Gallery"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Testimonials Section */}
              {testimonials.length > 0 && (
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Testimonials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="p-4 bg-secondary/50 rounded-lg">
                          {testimonial.type === 'video' && testimonial.video_url ? (
                            <div className="aspect-video rounded-lg overflow-hidden mb-3">
                              <video
                                src={testimonial.video_url}
                                controls
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <p className="text-muted-foreground mb-3">{testimonial.content}</p>
                          )}
                          {testimonial.users && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">{testimonial.users.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userId ? (
                    <div className="space-y-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={3000}
                        rows={4}
                        className="w-full rounded-md border border-border bg-background/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="Share your experience at this turf (50-60 lines max)."
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {newComment.length}/3000 characters
                        </span>
                        <Button
                          size="sm"
                          disabled={!newComment.trim() || commentSubmitting}
                          onClick={async () => {
                            if (!id) return;
                            setCommentSubmitting(true);
                            try {
                              const res = await api.post(`/turfs/${id}/comments`, { comment: newComment.trim() });
                              setComments((prev) => [res.data, ...prev]);
                              setNewComment("");
                              showToast({
                                title: "Comment added",
                                description: "Your feedback has been recorded.",
                              });
                            } catch (error: unknown) {
                              const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to add comment";
                              showToast({
                                title: "Unable to add comment",
                                description: errorMessage,
                                variant: "destructive",
                              });
                            } finally {
                              setCommentSubmitting(false);
                            }
                          }}
                        >
                          {commentSubmitting ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Please log in to share your comments about this turf.
                    </p>
                  )}

                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No comments yet. Be the first to share your experience.
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg bg-secondary/40 border border-border/40 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {c.users?.name || "User"}
                              {c.created_at && (
                                <span className="ml-2 opacity-70">
                                  b7 {new Date(c.created_at).toLocaleString()}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {c.comment}
                            </p>
                          </div>
                          {isOwner && (
                            <button
                              onClick={async () => {
                                if (!id) return;
                                try {
                                  await api.delete(`/turfs/${id}/comments/${c.id}`);
                                  setComments((prev) => prev.filter((x) => x.id !== c.id));
                                  showToast({
                                    title: "Comment deleted",
                                    description: "The comment has been removed.",
                                  });
                                } catch (error: unknown) {
                                  const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to delete comment";
                                  showToast({
                                    title: "Unable to delete comment",
                                    description: errorMessage,
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Google Maps */}
              {(turf as any).google_maps_link || (turf.latitude && turf.longitude) || turf.location ? (
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[400px] rounded-lg overflow-hidden">
                      {(() => {
                        // Priority 1: Use latitude/longitude if available (most reliable)
                        if (turf.latitude && turf.longitude) {
                          return (
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://maps.google.com/maps?q=${turf.latitude},${turf.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                            />
                          );
                        }

                        // Priority 2: Try to extract coords from google_maps_link
                        if ((turf as any).google_maps_link) {
                          const link = (turf as any).google_maps_link;
                          console.log('🔍 Attempting to extract coordinates from:', link);

                          // Try to extract coordinates from the link
                          const coordMatch = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                          const qMatch = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                          const dMatch3 = link.match(/!3d(-?\d+\.?\d*)/);
                          const dMatch4 = link.match(/!4d(-?\d+\.?\d*)/);

                          if (coordMatch) {
                            const lat = coordMatch[1];
                            const lng = coordMatch[2];
                            console.log('✅ Extracted from @ pattern:', lat, lng);
                            return (
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              />
                            );
                          } else if (qMatch) {
                            const lat = qMatch[1];
                            const lng = qMatch[2];
                            console.log('✅ Extracted from ?q pattern:', lat, lng);
                            return (
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              />
                            );
                          } else if (dMatch3 && dMatch4) {
                            const lat = dMatch3[1];
                            const lng = dMatch4[1];
                            console.log('✅ Extracted from !3d/!4d pattern:', lat, lng);
                            return (
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              />
                            );
                          } else {
                            console.warn('⚠️ Could not extract coordinates from link, falling back to location search');
                          }
                        }

                        // Priority 3: Fallback to location text search
                        if (turf.location) {
                          return (
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(turf.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                            />
                          );
                        }

                        return null;
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {turf.location}
                    </p>
                    {(turf as any).google_maps_link && (
                      <a
                        href={(turf as any).google_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        Open in Google Maps →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Time Slots */}
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {dates.map((date, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlots([]); // Clear selections when changing date
                        }}
                        className={`flex flex-col items-center min-w-[70px] p-3 rounded-xl transition-all ${selectedDate.toDateString() === date.toDateString()
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

                  {slots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {slots.map((slot) => {
                        const available = isSlotAvailable(slot);
                        const isSelected = selectedSlots.includes(slot.id);

                        return (
                          <button
                            key={slot.id}
                            disabled={!available}
                            onClick={() => available && toggleSlotSelection(slot.id)}
                            className={`p-3 rounded-lg text-center transition-all ${!available
                              ? "bg-secondary/30 text-muted-foreground cursor-not-allowed line-through"
                              : isSelected
                                ? "gradient-primary text-primary-foreground shadow-glow"
                                : "bg-secondary text-foreground hover:border-primary border border-transparent"
                              }`}
                          >
                            <div className="text-sm font-semibold">
                              {slot.start_time.slice(0, 5)}
                            </div>
                            <div className="text-xs mt-1">₹{slot.price}</div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 mx-auto mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No slots available for this date</p>
                    </div>
                  )}
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
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <div className="text-muted-foreground text-sm">Starting from</div>
                    <div className="font-heading text-3xl font-bold text-primary">
                      ₹{turf.price_per_slot}
                      <span className="text-muted-foreground text-sm font-normal">/hr</span>
                    </div>
                  </div>

                  {selectedSlots.length > 0 && (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                      <div className="text-sm text-muted-foreground mb-1">Selected Slots</div>
                      <div className="font-heading font-bold text-foreground">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric"
                        })}
                      </div>
                      <div className="text-primary font-semibold mt-2">
                        {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                      </div>
                      <div className="text-foreground font-bold text-xl mt-2">
                        Total: ₹{totalAmount}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    disabled={selectedSlots.length === 0 || bookingLoading}
                    onClick={handleBooking}
                  >
                    {bookingLoading ? "Processing..." : selectedSlots.length > 0 ? "Proceed to Pay" : "Select a Time Slot"}
                  </Button>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleCallOwner}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    {/* Chat is ALWAYS enabled - works before payment/booking */}
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleMessageOwner}
                      disabled={false}  // Explicitly never disabled
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>

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
