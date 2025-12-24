import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/services/api";

const sportFilters = [
  "All Sports",
  "Football",
  "Cricket",
  "Badminton",
  "Tennis",
  "Basketball",
  "Hockey",
];

const cityFilters = [
  "All Cities",
  "Mumbai",
  "Bangalore",
  "Delhi",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Ahmedabad",
];

const TournamentsPage = () => {
  type Tournament = { id: string | number; image?: string; name?: string; date?: string; time?: string; location?: string; entry_fee?: number; spots_left?: number; sport?: string; city?: string; status?: string; already_joined?: boolean };
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [filterType, setFilterType] = useState<"all" | "joined">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get("/tournaments");
        const tournamentData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setTournaments(tournamentData);
      } catch {
        alert("Failed to load tournaments");
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleJoin = async (tournamentId: string) => {
    if (role !== "player") {
      alert("Only players can join tournaments");
      return;
    }

    try {
      await api.post("/tournaments/join", {
        tournament_id: tournamentId,
      });

      const res = await api.get("/tournaments");
      const tournamentData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setTournaments(tournamentData);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Join failed";
      alert(message);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const name = (t.name || "").toLowerCase();
    const location = (t.location || "").toLowerCase();
    const search = searchQuery.toLowerCase();

    const matchSport =
      selectedSport === "All Sports" || t.sport === selectedSport;
    const matchCity =
      selectedCity === "All Cities" || t.city === selectedCity;
    const matchSearch =
      name.includes(search) ||
      location.includes(search);
    
    const matchType = filterType === "all" || (filterType === "joined" && t.already_joined);

    return matchSport && matchCity && matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <main className="pt-24 pb-12 relative z-10">
        <div className="container px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
              Compete & Win
            </Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              Upcoming <span className="text-gradient">Tournaments</span>
            </h1>
            <p className="text-muted-foreground">
              Join local tournaments and showcase your skills
            </p>
          </div>

          {/* Tabs for My Tournaments */}
          {role === "player" && (
            <div className="flex justify-center mb-6">
              <div className="bg-secondary/50 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === "all"
                      ? "bg-primary text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Tournaments
                </button>
                <button
                  onClick={() => setFilterType("joined")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === "joined"
                      ? "bg-primary text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Tournaments
                </button>
              </div>
            </div>
          )}

          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 bg-secondary/50 px-4 py-3 rounded-xl">
                  <Search className="w-5 h-5" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tournaments..."
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown
                    className={`ml-2 w-4 h-4 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ${
                  showFilters ? "block" : "hidden lg:grid"
                }`}
              >
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="bg-secondary px-4 py-3 rounded-xl"
                >
                  {sportFilters.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-secondary px-4 py-3 rounded-xl"
                >
                  {cityFilters.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {loading && <p>Loading tournaments...</p>}

          {!loading && filteredTournaments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No tournaments found matching your criteria.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => (
              <Card key={t.id}>
                <img
                  src={t.image}
                  alt={t.name}
                  className="h-48 w-full object-cover"
                />

                <CardContent className="p-5 space-y-3">
                  <h3 className="text-lg font-bold">{t.name}</h3>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4" />
                      {t.date}
                    </div>
                    <div className="flex gap-2">
                      <Clock className="w-4 h-4" />
                      {t.time}
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4" />
                      {t.location}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span>Entry: ₹{t.entry_fee}</span>
                    <span>{t.spots_left} spots left</span>
                  </div>

                  <Button
                    className="w-full"
                    disabled={
                      role !== "player" ||
                      t.status !== "Registering" ||
                      t.already_joined
                    }
                    onClick={() => handleJoin(String(t.id))}
                  >
                    {t.already_joined
                      ? "Already Joined"
                      : t.status === "Registering"
                      ? "Join Tournament"
                      : "Coming Soon"}
                  </Button>
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

export default TournamentsPage;
