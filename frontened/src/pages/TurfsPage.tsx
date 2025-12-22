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
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/services/api";

const sportsFilters = [
  "All Sports",
  "Football",
  "Cricket",
  "Badminton",
  "Tennis",
  "Basketball",
  "Hockey",
];

const priceFilters = [
  "Any Price",
  "Under ₹500",
  "₹500 - ₹1000",
  "₹1000 - ₹1500",
  "Above ₹1500",
];

const TurfsPage = () => {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [selectedPrice, setSelectedPrice] = useState("Any Price");
  const [showFilters, setShowFilters] = useState(false);

  // 🔹 FETCH TURFS FROM BACKEND
  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const res = await api.get("/turfs");
        setTurfs(res.data);
      } catch (err) {
        console.error("Failed to fetch turfs");
      }
    };

    fetchTurfs();
  }, []);

  // 🔹 FILTER LOGIC (FRONTEND ONLY)
  const filteredTurfs = turfs.filter((turf) => {
    const matchesSearch =
      turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      turf.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport =
      selectedSport === "All Sports" ||
      turf.sports?.includes(selectedSport);

    return matchesSearch && matchesSport;
  });

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main className="pt-24 pb-12 relative z-10">
        <div className="container px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <Badge variant="success" className="mb-4">
              Browse Turfs
            </Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              Find Your Perfect <span className="text-gradient">Turf</span>
            </h1>
            <p className="text-muted-foreground">
              Discover and book premium sports turfs near you
            </p>
          </div>

          {/* Search & Filters */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                  <Search className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 lg:w-64">
                  <MapPin className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Location..."
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown
                    className={`w-4 h-4 ml-2 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                <Button variant="hero">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>

              {/* Filters */}
              <div
                className={`flex flex-col lg:flex-row gap-4 mt-4 ${
                  showFilters ? "block" : "hidden lg:flex"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {sportsFilters.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        selectedSport === sport
                          ? "bg-primary text-white"
                          : "bg-secondary"
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                  <Filter className="w-4 h-4" />
                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="bg-secondary rounded-lg px-4 py-2"
                  >
                    {priceFilters.map((price) => (
                      <option key={price}>{price}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <p className="mb-6 text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredTurfs.length}
            </span>{" "}
            turfs
          </p>

          {/* Turf Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTurfs.map((turf, index) => (
              <div
                key={turf.id}
                className="animate-slide-up opacity-0"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TurfCard
                  id={turf.id}
                  name={turf.name}
                  location={turf.location}
                  image={turf.images?.split(",")[0]}
                  price={turf.price_per_slot}
                  rating={4.5}
                  reviews={120}
                  sports={turf.facilities?.split(",")}
                  availableSlots={0}
                />
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
