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
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get("/tournaments");
        setTournaments(res.data || []);
      } catch {
        alert("Failed to load tournaments");
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
      setTournaments(res.data || []);
    } catch (err: any) {
      alert(err.response?.data?.error || "Join failed");
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchSport =
      selectedSport === "All Sports" || t.sport === selectedSport;
    const matchCity =
      selectedCity === "All Cities" || t.city === selectedCity;
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSport && matchCity && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge variant="featured" className="mb-4">
              <Trophy className="w-4 h-4 mr-2" />
              Tournaments
            </Badge>
            <h1 className="text-4xl font-bold">
              Compete & <span className="text-primary">Win Big</span>
            </h1>
          </div>

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
                    onClick={() => handleJoin(t.id)}
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
