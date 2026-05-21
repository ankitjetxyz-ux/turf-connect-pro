export type HomeTestimonial = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  image: string;
};

export const homeTestimonials: HomeTestimonial[] = [
  {
    id: 1,
    name: "Rahul Mehta",
    role: "Weekend football captain · Ahmedabad",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    text: "I used to confirm slots on three WhatsApp groups. Last Friday I booked a 8 PM slot on TurfBook, paid online, and we were on the pitch within ten minutes. The turf grip was solid even after light rain in the afternoon.",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Priya Shah",
    role: "Corporate league organiser · Vadodara",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    text: "We run a quarterly office sports day and TurfBook saved hours of back-and-forth. Live slot availability meant no double bookings, and the owner got paid instantly. Our team has already locked next month's slot.",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Arjun Desai",
    role: "Cricket enthusiast · Mehsana",
    avatar: "https://randomuser.me/api/portraits/men/71.jpg",
    rating: 5,
    text: "Booked a box cricket ground for a college reunion match. Entry was smooth with the booking confirmation, nets were in good shape, and floodlights made the evening session comfortable. Exactly what we needed.",
    image: "https://randomuser.me/api/portraits/men/71.jpg",
  },
  {
    id: 4,
    name: "Sneha Kapoor",
    role: "Badminton player · Ahmedabad",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 5,
    text: "Love that I can see open courts before paying. Reserved a Saturday morning slot two weeks ahead, showed up, scanned my confirmation, and started playing — no awkward negotiation at the gate.",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop",
  },
  {
    id: 5,
    name: "Vikram Solanki",
    role: "Turf owner · Gujarat",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
    rating: 5,
    text: "Listing our ground on TurfBook cut empty evening slots noticeably. Payments land reliably, players arrive knowing their slot time, and the verification process gave us credibility with new customers.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=300&fit=crop&crop=faces",
  },
  {
    id: 6,
    name: "Ananya Iyer",
    role: "Fitness group admin · Vadodara",
    avatar: "https://randomuser.me/api/portraits/women/28.jpg",
    rating: 5,
    text: "Our running club switched to TurfBook for monthly football sessions. Splitting costs across bookings is easier, and the chat feature helped us ask the owner about parking before we booked twelve slots.",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=300&fit=crop",
  },
];
