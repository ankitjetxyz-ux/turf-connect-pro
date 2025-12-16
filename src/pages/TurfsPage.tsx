import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TurfCard from "@/components/turfs/TurfCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  MapPin, 
  Filter, 
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

const allTurfs = [
  {
    id: "1",
    name: "Green Arena Sports Complex",
    location: "Andheri West, Mumbai",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
    rating: 4.8,
    reviews: 245,
    price: 1200,
    sports: ["Football", "Cricket", "Badminton"],
    availableSlots: 5,
    featured: true,
  },
  {
    id: "2",
    name: "Champions Turf Hub",
    location: "Koramangala, Bangalore",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
    rating: 4.6,
    reviews: 189,
    price: 800,
    sports: ["Football", "Tennis"],
    availableSlots: 8,
  },
  {
    id: "3",
    name: "Victory Sports Arena",
    location: "Bandra East, Mumbai",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    rating: 4.9,
    reviews: 312,
    price: 1500,
    sports: ["Cricket", "Football", "Hockey", "Basketball"],
    availableSlots: 2,
    featured: true,
  },
  {
    id: "4",
    name: "Elite Sports Zone",
    location: "Indiranagar, Bangalore",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
    rating: 4.5,
    reviews: 156,
    price: 900,
    sports: ["Football", "Volleyball"],
    availableSlots: 12,
  },
  {
    id: "5",
    name: "Premier Football Arena",
    location: "Whitefield, Bangalore",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
    rating: 4.7,
    reviews: 203,
    price: 1100,
    sports: ["Football"],
    availableSlots: 6,
  },
  {
    id: "6",
    name: "Sports Hub 360",
    location: "HSR Layout, Bangalore",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800",
    rating: 4.4,
    reviews: 98,
    price: 750,
    sports: ["Cricket", "Badminton", "Tennis"],
    availableSlots: 15,
  },
  {
    id: "7",
    name: "Urban Sports Ground",
    location: "Powai, Mumbai",
    image: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800",
    rating: 4.6,
    reviews: 167,
    price: 1000,
    sports: ["Football", "Cricket"],
    availableSlots: 4,
  },
  {
    id: "8",
    name: "Royal Sports Complex",
    location: "Juhu, Mumbai",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
    rating: 4.9,
    reviews: 289,
    price: 1800,
    sports: ["Football", "Cricket", "Tennis", "Basketball"],
    availableSlots: 3,
    featured: true,
  },
];

const sportsFilters = ["All Sports", "Football", "Cricket", "Badminton", "Tennis", "Basketball", "Hockey"];
const priceFilters = ["Any Price", "Under ₹500", "₹500 - ₹1000", "₹1000 - ₹1500", "Above ₹1500"];

const TurfsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [selectedPrice, setSelectedPrice] = useState("Any Price");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-overlay-intense" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />

      <Navbar />
      
      <main className="pt-24 pb-12 relative z-10">
        <div className="container px-4">
          {/* Header */}
          <div className="mb-8">
            <Badge variant="success" className="mb-4">Browse Turfs</Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
              Find Your Perfect <span className="text-primary">Turf</span>
            </h1>
            <p className="text-muted-foreground">
              Discover and book premium sports turfs near you
            </p>
          </div>

          {/* Search & Filters */}
          <Card variant="glass" className="mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <Search className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 lg:w-64">
                  <MapPin className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Location..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Filter Toggle (Mobile) */}
                <Button 
                  variant="outline" 
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>

                {/* Search Button */}
                <Button variant="hero" className="lg:w-auto">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>

              {/* Filters Row */}
              <div className={`flex flex-col lg:flex-row gap-4 mt-4 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
                {/* Sports Filter */}
                <div className="flex flex-wrap gap-2">
                  {sportsFilters.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedSport === sport
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>

                {/* Price Filter */}
                <div className="flex items-center gap-2 lg:ml-auto">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="bg-secondary text-foreground rounded-lg px-4 py-2 text-sm outline-none border border-border focus:border-primary"
                  >
                    {priceFilters.map((price) => (
                      <option key={price} value={price}>{price}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{allTurfs.length}</span> turfs
            </p>
            <select className="bg-secondary text-foreground rounded-lg px-4 py-2 text-sm outline-none border border-border">
              <option>Sort by: Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating: High to Low</option>
            </select>
          </div>

          {/* Turfs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allTurfs.map((turf, index) => (
              <div
                key={turf.id}
                className="animate-slide-up opacity-0"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TurfCard {...turf} />
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="flex justify-center mt-12">
            <Button variant="outline" size="lg">
              Load More Turfs
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TurfsPage;
