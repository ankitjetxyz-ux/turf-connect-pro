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
import { useToast } from "@/components/ui/use-toast";

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

  const { toast } = useToast();

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
      toast({
        title: "Only players can join",
        description: "Please sign in as a player to join tournaments.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTournament(tournament);
    setJoinForm({ team_name: "", team_members: "", leader_contact_phone: "" });
    setIsJoinOpen(true);
  };

  const handleJoinSubmit = async () => {
    if (!joinForm.team_name || !selectedTournament || !joinForm.leader_contact_phone) {
      toast({
        title: "Missing details",
        description: "Team name and leader contact number are required.",
        variant: "destructive",
      });
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
        toast({
          title: "Joined successfully",
          description: "Your team has been registered for this tournament.",
        });
        setIsJoinOpen(false);
        fetchTournaments();
        return;
      }

      const razorLoaded = await loadRazorpay();
      if (!razorLoaded) {
        toast({
          title: "Payment gateway unavailable",
          description: "We couldn't load the payment gateway. Please try again.",
          variant: "destructive",
        });
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
              toast({
                title: "Registration successful",
                description: `Payment confirmed. Your verification code: ${verificationCode}`,
              });
            } else {
              toast({
                title: "Registration successful",
                description: "Payment confirmed and your team is registered.",
              });
            }
            setIsJoinOpen(false);
            fetchTournaments();
          } catch (err: unknown) {
            console.error("verify-payment failed", err);
            const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Payment verification failed. Please contact support.";
            toast({
              title: "Payment verification failed",
              description: errorMessage,
              variant: "destructive",
            });
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

      toast({
        title: "Unable to join tournament",
        description: errorMessage,
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />

      <main className="pt-24 pb-12 relative z-10 flex-1">
        <div className="container px-4">
          {/* Header */}
          <div className="mb-8 text-center space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-7xl tracking-tight mb-6" style={{ fontFamily: '"Inter Display", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em' }}>
              Upcoming <span className="text-gradient">Tournaments</span>
            </h1>
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
                <Trophy className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Tournament Feature Coming Soon</h2>
              <p className="text-muted-foreground max-w-md">
                We are working hard to bring you the best tournament experience.
                Stay tuned for exciting competitions and rewards!
              </p>
            </div>
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
