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
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Users,
  Target,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/services/api";
import { loadRazorpay } from "@/utils/razorpay";
import { RazorpayResponse } from "@/types";

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
  type Tournament = {
    id: string | number;
    name?: string;
    sport?: string;
    start_date?: string;
    end_date?: string;
    entry_fee?: number;
    max_teams?: number;
    current_teams?: number;
    spots_left?: number;
    image?: string;
    status?: string;
    already_joined?: boolean;
  };
  type Participant = {
    id: string;
    team_name: string;
    team_members?: string[];
    leader_contact_phone?: string;
    user?: { name?: string; profile_image_url?: string | null } | null;
  };

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [filterType, setFilterType] = useState<"all" | "joined">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Join Modal State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({ team_name: "", team_members: "", leader_contact_phone: "" });
  const [joining, setJoining] = useState(false);

  // Participants modal
  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const role = localStorage.getItem("role");

  // Calculate tournament stats
  const tournamentStats = useMemo(() => {
    const total = tournaments.length;
    const upcoming = tournaments.filter(t => t.status === 'upcoming').length;
    const totalSpots = tournaments.reduce((sum, t) => sum + (t.spots_left || 0), 0);
    const totalTeams = tournaments.reduce((sum, t) => sum + (t.current_teams || 0), 0);
    return { total, upcoming, totalSpots, totalTeams };
  }, [tournaments]);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;

      const res = await api.get("/tournaments", { params });
      const tournamentData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setTournaments(tournamentData);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTournaments();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchTournaments]);

  const openTeamsModal = async (tournament: Tournament) => {
    try {
      const res = await api.get(`/tournaments/${tournament.id}/participants`);
      setParticipants(res.data || []);
      setIsTeamsOpen(true);
    } catch (err) {
      console.error("Failed to load participants", err);
      setParticipants([]);
      setIsTeamsOpen(true);
    }
  };

  const openJoinModal = (tournament: Tournament) => {
    if (role !== "player") {
      alert("Only players can join tournaments");
      return;
    }
    setSelectedTournament(tournament);
    setJoinForm({ team_name: "", team_members: "", leader_contact_phone: "" });
    setIsJoinOpen(true);
  };

  const handleJoinSubmit = async () => {
    if (!joinForm.team_name || !selectedTournament || !joinForm.leader_contact_phone) {
      alert("Team Name and Leader Contact Number are required");
      return;
    }

    setJoining(true);
    try {
      const isPaid = Number(selectedTournament.entry_fee || 0) > 0;
      const teamMembers = joinForm.team_members
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!isPaid) {
        await api.post("/tournaments/join", {
          tournament_id: selectedTournament.id,
          team_name: joinForm.team_name,
          team_members: teamMembers,
          leader_contact_phone: joinForm.leader_contact_phone
        });
        alert("Successfully joined the tournament!");
        setIsJoinOpen(false);
        fetchTournaments();
        return;
      }

      const razorLoaded = await loadRazorpay();
      if (!razorLoaded) {
        alert("Failed to load payment gateway. Please try again.");
        return;
      }

      const { data } = await api.post("/tournaments/join-and-order", {
        tournament_id: selectedTournament.id,
        team_name: joinForm.team_name,
        team_members: teamMembers,
        leader_contact_phone: joinForm.leader_contact_phone
      });

      const options: Record<string, unknown> = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: selectedTournament.name || "Tournament Entry",
        description: "Tournament registration",
        order_id: data.order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await api.post("/tournaments/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              participant_id: data.participant_id,
            });

            const verificationCode = verifyRes.data?.verification_code;
            if (verificationCode) {
              alert(`Registration & payment successful! Your verification code: ${verificationCode}`);
            } else {
              alert("Registration & payment successful!");
            }
            setIsJoinOpen(false);
            fetchTournaments();
          } catch (err: unknown) {
            console.error("verify-payment failed", err);
            const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Payment verification failed. Please contact support.";
            alert(errorMessage);
          }
        },
        prefill: {
          name: localStorage.getItem("name") || "Player",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (err: unknown) {
      console.error("Join tournament error:", err);
      let errorMessage = "Join failed";

      if (err && typeof err === 'object') {
        const axiosError = err as {
          response?: {
            data?: {
              error?: string;
              details?: string;
            }
          };
          message?: string;
        };

        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
          if (axiosError.response.data.details) {
            errorMessage += `: ${axiosError.response.data.details}`;
          }
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      alert(`Unable to join tournament: ${errorMessage}`);
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
          <div className="mb-8 text-center space-y-3">
            <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
              Compete & Win
            </Badge>
            <h1 className="font-heading text-3xl md:text-4xl font-bold">
              Upcoming <span className="text-gradient">Tournaments</span>
            </h1>
            <p className="text-muted-foreground">
              Join local tournaments, push your limits, and play like a champion.
            </p>
            <div className="text-xs md:text-sm text-muted-foreground/80 space-y-1 max-w-xl mx-auto">
              <p>"Hard work beats talent when talent doesn&apos;t work hard."</p>
              <p>"You miss 100% of the shots you don&apos;t take."</p>
            </div>
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

          {/* Tournament Stats Bar */}
          {!loading && tournaments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{tournamentStats.total}</div>
                    <p className="text-sm text-muted-foreground">Active Tournaments</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/5 border-rose-500/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-rose-400">{tournamentStats.totalTeams}</div>
                    <p className="text-sm text-muted-foreground">Teams Registered</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">{tournamentStats.totalSpots}</div>
                    <p className="text-sm text-muted-foreground">Spots Open</p>
                  </div>
                </CardContent>
              </Card>
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
            {filteredTournaments.map((t) => {
              const spotsLeft = t.spots_left ?? t.max_teams;
              const capacityLabel =
                spotsLeft !== undefined && t.max_teams
                  ? `${spotsLeft} / ${t.max_teams} spots left`
                  : `${t.max_teams || 0} teams`;

              return (
                <Card key={t.id}>
                  {t.image && (
                    <img
                      src={t.image}
                      alt={t.name}
                      className="h-48 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-lg font-bold">{t.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{t.sport}</Badge>
                      <Badge
                        variant={
                          t.status === "upcoming" ? "default" : "secondary"
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex gap-2">
                        <Calendar className="w-4 h-4" />
                        {t.start_date} - {t.end_date}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Users className="w-4 h-4" />
                        <span>{capacityLabel}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2">
                      <span>Entry: ₹{t.entry_fee}</span>
                      <button
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={() => openTeamsModal(t)}
                        type="button"
                      >
                        <Users className="w-3 h-3" /> View Teams
                      </button>
                    </div>

                    <Button
                      className="w-full mt-2"
                      disabled={
                        role !== "player" ||
                        t.already_joined ||
                        (spotsLeft || 0) <= 0
                      }
                      onClick={() => openJoinModal(t)}
                    >
                      {t.already_joined
                        ? "Already Joined"
                        : (spotsLeft || 0) > 0
                          ? "Join Tournament"
                          : "Full"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for Tournament</DialogTitle>
            <DialogDescription>
              Enter your team details and contact information to join.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team_name">Team Name</Label>
              <Input
                id="team_name"
                value={joinForm.team_name}
                onChange={(e) =>
                  setJoinForm({ ...joinForm, team_name: e.target.value })
                }
                placeholder="e.g. Thunder Strikers"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="leader_contact">Team Leader Contact Number</Label>
              <Input
                id="leader_contact"
                value={joinForm.leader_contact_phone}
                onChange={(e) =>
                  setJoinForm({ ...joinForm, leader_contact_phone: e.target.value })
                }
                placeholder="e.g. 9876543210"
                type="tel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team_members">Team Members (Optional)</Label>
              <Textarea
                id="team_members"
                value={joinForm.team_members}
                onChange={(e) =>
                  setJoinForm({ ...joinForm, team_members: e.target.value })
                }
                placeholder="Enter player names separated by commas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinSubmit} disabled={joining}>
              {joining ? "Processing..." : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamsOpen} onOpenChange={setIsTeamsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registered Teams</DialogTitle>
            <DialogDescription>
              All teams that have completed payment for this tournament.
            </DialogDescription>
          </DialogHeader>

          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teams have registered yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between rounded-lg border border-border/40 p-3"
                >
                  <div>
                    <p className="font-medium">{p.team_name}</p>
                    {p.leader_contact_phone && (
                      <p className="text-xs text-muted-foreground">
                        Leader Contact: {p.leader_contact_phone}
                      </p>
                    )}
                    {p.team_members && p.team_members.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.team_members.join(", ")}
                      </p>
                    )}
                  </div>
                  {p.user?.name && (
                    <p className="text-xs text-muted-foreground">
                      Captain: {p.user.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TournamentsPage;
