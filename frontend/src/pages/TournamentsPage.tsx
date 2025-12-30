import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Users,
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
  "Kabaddi",
  "Volleyball",
  "Running",
  "Golf",
  "Table Tennis",
  "Rugby",
];

const TournamentsPage = () => {
  type Tournament = { id: string | number; name?: string; sport?: string; start_date?: string; end_date?: string; entry_fee?: number; max_teams?: number; image?: string; status?: string; already_joined?: boolean };
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [filterType, setFilterType] = useState<"all" | "joined">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Join Modal State
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({ team_name: "", team_members: "" });
  const [joining, setJoining] = useState(false);

  const role = localStorage.getItem("role");

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;

      const res = await api.get("/tournaments", { params });
      const tournamentData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setTournaments(tournamentData);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTournaments();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const openJoinModal = (id: string) => {
    if (role !== "player") {
      alert("Only players can join tournaments");
      return;
    }
    setSelectedTournamentId(id);
    setJoinForm({ team_name: "", team_members: "" });
    setIsJoinOpen(true);
  };

  const handleJoinSubmit = async () => {
    if (!joinForm.team_name) {
      alert("Team Name is required");
      return;
    }

    setJoining(true);
    try {
      await api.post("/tournaments/join", {
        tournament_id: selectedTournamentId,
        team_name: joinForm.team_name,
        team_members: joinForm.team_members.split(",").map(s => s.trim()).filter(Boolean)
      });

      alert("Successfully joined the tournament!");
      setIsJoinOpen(false);
      fetchTournaments(); // Refresh list to update status/spots
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Join failed");
    } finally {
      setJoining(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchSport =
      selectedSport === "All Sports" || t.sport === selectedSport;

    const matchType = filterType === "all" || (filterType === "joined" && t.already_joined);

    return matchSport && matchType;
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
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filterType === "all"
                    ? "bg-primary text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  All Tournaments
                </button>
                <button
                  onClick={() => setFilterType("joined")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filterType === "joined"
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
                    className={`ml-2 w-4 h-4 ${showFilters ? "rotate-180" : ""
                      }`}
                  />
                </Button>
              </div>

              <div
                className={`mt-4 ${showFilters ? "block" : "hidden lg:block"
                  }`}
              >
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="bg-secondary px-4 py-3 rounded-xl w-full"
                >
                  {sportFilters.map((s) => (
                    <option key={s}>{s}</option>
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
                {t.image && (
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t.sport}</Badge>
                    <Badge variant={t.status === "upcoming" ? "default" : "secondary"}>{t.status}</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4" />
                      {t.start_date} - {t.end_date}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span>Entry: ₹{t.entry_fee}</span>
                    <span>{t.max_teams} teams</span>
                  </div>

                  <Button
                    className="w-full"
                    disabled={
                      role !== "player" ||
                      t.already_joined ||
                      (t.max_teams || 0) <= 0
                    }
                    onClick={() => openJoinModal(String(t.id))}
                  >
                    {t.already_joined
                      ? "Already Joined"
                      : (t.max_teams || 0) > 0
                        ? "Join Tournament"
                        : "Full"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for Tournament</DialogTitle>
            <DialogDescription>
              Enter your team details to join.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team_name">Team Name</Label>
              <Input
                id="team_name"
                value={joinForm.team_name}
                onChange={(e) => setJoinForm({ ...joinForm, team_name: e.target.value })}
                placeholder="e.g. Thunder Strikers"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team_members">Team Members (Optional)</Label>
              <Textarea
                id="team_members"
                value={joinForm.team_members}
                onChange={(e) => setJoinForm({ ...joinForm, team_members: e.target.value })}
                placeholder="Enter player names separated by commas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinSubmit} disabled={joining}>
              {joining ? "Registering..." : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TournamentsPage;
